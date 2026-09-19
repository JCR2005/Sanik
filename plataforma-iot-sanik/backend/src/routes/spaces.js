import { getSpaceConfig, computeAqi, seedAirTemplate } from '../utils/aqi.js'

export default async function spacesRoutes(app) {
  app.addHook('onRequest', app.authenticate)

  // ── LISTAR ESPACIOS DEL ORG DEL USUARIO ─────────────
  app.get('/', async (req) => {
    const { rows } = await app.db.query(
      `SELECT s.id, s.name, s.slug, s.type, s.icon, s.hidden, s.description, s.created_at,
              COUNT(d.id)::int as device_count
       FROM spaces s
       LEFT JOIN devices d ON d.space_id = s.id
       WHERE s.org_id = $1
       GROUP BY s.id
       ORDER BY s.created_at ASC`,
      [req.user.orgId]
    )
    return rows
  })

  // ── CREAR ESPACIO ─────────────────────────────────
  app.post('/', async (req, reply) => {
    const { name, slug, type, icon, description } = req.body
    if (!name || !slug) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios (name, slug)' })
    }

    const client = await app.db.connect()
    try {
      await client.query('BEGIN')
      const iconByType = { aire: 'aire', agua: 'agua', suelo: 'suelo', ruido: 'ruido' }
      const finalIcon = icon || iconByType[type] || 'otro'
      const { rows: [space] } = await client.query(
        `INSERT INTO spaces (org_id, name, slug, type, icon, description, hidden)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING *`,
        [req.user.orgId, name.trim(), slug.trim().toLowerCase().replace(/\s+/g, '_'), type || 'other', finalIcon, description?.trim()]
      )
      if (space.type === 'aire')
        await seedAirTemplate(client, space.id)
      await client.query('COMMIT')
      return reply.code(201).send(space)
    } catch (err) {
      await client.query('ROLLBACK')
      if (err.code === '23505')
        return reply.code(400).send({ error: 'Ya existe un espacio con ese identificador' })
      app.log.error(err)
      return reply.code(500).send({ error: 'Error al crear el espacio' })
    } finally {
      client.release()
    }
  })

  // ── VERIFICAR PERTENENCIA ─────────────────────────
  async function getOwnerSpace(id, orgId) {
    const { rows: [s] } = await app.db.query(
      `SELECT * FROM spaces WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    )
    return s
  }

  // ── DETALLE DE ESPACIO ────────────────────────────
  app.get('/:id', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })
    return space
  })

  // ── ACTUALIZAR ESPACIO (nombre, slug, descripción, icono) ──
  app.put('/:id', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })

    const { name, slug, description, icon } = req.body || {}
    const set = []
    const params = []
    if (name !== undefined) { params.push(name.trim()); set.push(`name = $${params.length}`) }
    if (slug !== undefined) { params.push(slug.trim().toLowerCase().replace(/\s+/g, '_')); set.push(`slug = $${params.length}`) }
    if (description !== undefined) { params.push(description.trim()); set.push(`description = $${params.length}`) }
    if (icon !== undefined) { params.push(icon); set.push(`icon = $${params.length}`) }
    if (set.length === 0) return space

    params.push(space.id)
    const { rows: [updated] } = await app.db.query(
      `UPDATE spaces SET ${set.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    return updated
  })

  // ── DISPOSITIVOS DEL ESPACIO ──────────────────────
  app.get('/:id/devices', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })

    const { rows } = await app.db.query(
      `SELECT d.*,
              COUNT(dv.variable_label)::int as variable_count,
              CASE WHEN d.last_seen > NOW() - INTERVAL '5 minutes'
                   THEN 'online' ELSE 'offline' END as status
       FROM devices d
       LEFT JOIN device_variables dv ON dv.device_id = d.id
       WHERE d.space_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [space.id]
    )
    return rows
  })

  // ── CONFIG AQI COMPLETA DEL ESPACIO ───────────────
  app.get('/:id/aqi', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })

    const config = await getSpaceConfig(app, space.id)
    return { ...space, aqiConfig: config }
  })

  // ── GUARDAR CONFIG AQI DEL ESPACIO ────────────────
  // body: {
  //   categories: [{ name, color, score_lo, score_hi }],
  //   variables: [{ variable_label }],            // en orden de prioridad
  //   ranges:    [{ variable_label, cat_order, min_value, max_value }]
  // }
  app.put('/:id/aqi', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })

    const { categories = [], variables = [], ranges = [] } = req.body || {}

    if (!Array.isArray(categories) || !Array.isArray(variables) || !Array.isArray(ranges)) {
      return reply.code(400).send({ error: 'categories, variables y ranges deben ser arrays' })
    }

    const client = await app.db.connect()
    try {
      await client.query('BEGIN')

      await client.query('DELETE FROM space_variable_ranges WHERE space_id = $1', [space.id])
      await client.query('DELETE FROM space_aqi_variables WHERE space_id = $1', [space.id])
      await client.query('DELETE FROM space_aqi_categories WHERE space_id = $1', [space.id])

      for (let i = 0; i < categories.length; i++) {
        const c = categories[i]
        await client.query(
          `INSERT INTO space_aqi_categories (space_id, name, color, cat_order, score_lo, score_hi)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [space.id, c.name, c.color || '#10B981', i + 1, Number(c.score_lo ?? 0), Number(c.score_hi ?? 100)]
        )
      }

      for (let i = 0; i < variables.length; i++) {
        await client.query(
          `INSERT INTO space_aqi_variables (space_id, variable_label, priority)
           VALUES ($1, $2, $3)
           ON CONFLICT (space_id, variable_label) DO NOTHING`,
          [space.id, variables[i].variable_label, i + 1]
        )
      }

      for (const r of ranges) {
        await client.query(
          `INSERT INTO space_variable_ranges (space_id, variable_label, cat_order, min_value, max_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [space.id, r.variable_label, r.cat_order, Number(r.min_value), r.max_value == null ? null : Number(r.max_value)]
        )
      }

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      app.log.error(err)
      return reply.code(500).send({ error: 'Error al guardar la configuración' })
    } finally {
      client.release()
    }

    const config = await getSpaceConfig(app, space.id)
    return { ...space, aqiConfig: config }
  })

  // ── CALCULAR AQI DE UN ESPACIO (diagnóstico) ──────
  app.post('/:id/aqi/calculate', async (req, reply) => {
    const space = await getOwnerSpace(req.params.id, req.user.orgId)
    if (!space) return reply.code(404).send({ error: 'Espacio no encontrado' })

    const config = await getSpaceConfig(app, space.id)
    const values = req.body?.values || {}
    return computeAqi(values, config)
  })

  // ── ELIMINAR ESPACIO ──────────────────────────────
  app.delete('/:id', async (req, reply) => {
    const { rowCount } = await app.db.query(
      `DELETE FROM spaces WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    )
    if (rowCount === 0) return reply.code(404).send({ error: 'Espacio no encontrado' })
    return { message: 'Espacio eliminado' }
  })
}
