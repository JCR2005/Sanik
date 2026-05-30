export default async function variablesRoutes(app) {

  // Middleware de autenticación para todas las rutas
  app.addHook('onRequest', app.authenticate)

  // ── 1. LISTAR CATÁLOGO DE VARIABLES ─────────────────────
  // El frontend (Variables.jsx) llama aquí para mostrar las tarjetas
  app.get('/catalog', async (req) => {
    const { rows } = await app.db.query(
      `SELECT label, name, unit, icon, description 
       FROM variable_catalog 
       ORDER BY name ASC`
    )
    return rows
  })

  // ── 2. CREAR NUEVA VARIABLE EN EL CATÁLOGO ──────────────
  // Solo los admins pueden crear variables nuevas desde el panel
  app.post('/catalog', async (req, reply) => {
    const { name, label, unit, icon, description } = req.body

    // Seguridad: Solo superadmin o admin
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'No tienes permisos para modificar el catálogo.' })
    }

    if (!name || !label || !unit) {
      return reply.code(400).send({ error: 'Faltan campos obligatorios (nombre, label o unidad).' })
    }

    try {
      const cleanLabel = label.toLowerCase().trim().replace(/\s+/g, '_')

      const { rows } = await app.db.query(
        `INSERT INTO variable_catalog (label, name, unit, icon, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [cleanLabel, name.trim(), unit.trim(), icon || 'Activity', description?.trim()]
      )

      return reply.code(201).send(rows[0])
    } catch (err) {
      if (err.code === '23505') { // Violación de llave única en Postgres
        return reply.code(400).send({ error: `La variable con identificador "${label}" ya existe.` })
      }
      app.log.error(err)
      return reply.code(500).send({ error: 'Error interno al guardar la variable.' })
    }
  })

  // ── 3. ELIMINAR VARIABLE DEL CATÁLOGO ───────────────────
  app.delete('/catalog/:label', async (req, reply) => {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'No tienes permisos.' })
    }

    const { rowCount } = await app.db.query(
      `DELETE FROM variable_catalog WHERE label = $1`,
      [req.params.label]
    )

    if (rowCount === 0) {
      return reply.code(404).send({ error: 'Variable no encontrada.' })
    }

    return { message: 'Variable eliminada correctamente.' }
  })
}