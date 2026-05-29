const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function devicesRoutes(app) {

  // Middleware de autenticación para todas las rutas
  app.addHook('onRequest', app.authenticate)

  // ── Listar dispositivos de la organización ─────
  app.get('/', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows } = await app.db.query(
      `SELECT d.*,
              COUNT(v.id) as variable_count,
              CASE WHEN d.last_seen > NOW() - INTERVAL '5 minutes'
                   THEN 'online' ELSE 'offline' END as status
       FROM devices d
       LEFT JOIN variables v ON v.device_id = d.id
       WHERE d.org_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [targetOrgId]
    )
    return rows
  })

  // ── Crear dispositivo ──────────────────────────
  app.post('/', async (req, reply) => {
    const { label, name, lat, lng, orgId } = req.body
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && orgId)
      ? orgId
      : req.user.orgId

    const { rows: [device] } = await app.db.query(
      `INSERT INTO devices (org_id, label, name, lat, lng)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [targetOrgId, label, name, lat, lng]
    )

    // Crear variables por defecto para estación meteorológica
    const defaultVars = [
      { label: 'temperatura', name: 'Temperatura',  unit: '°C' },
      { label: 'humedad',     name: 'Humedad',       unit: '%'  },
      { label: 'so2',         name: 'SO₂',           unit: 'ppb'},
      { label: 'pm25',        name: 'PM2.5',         unit: 'µg/m³'},
      { label: 'pm1',         name: 'PM1',           unit: 'µg/m³'},
      { label: 'pm10',        name: 'PM10',          unit: 'µg/m³'},
      { label: 'o3',          name: 'O₃',            unit: 'ppb'},
      { label: 'nox',         name: 'NOx',           unit: 'ppb'},
      { label: 'nh3',         name: 'NH₃',           unit: 'ppb'},
      { label: 'mq135_adc',  name: 'MQ135 ADC',     unit: 'ADC'},
    ]

    for (const v of defaultVars) {
      await app.db.query(
        `INSERT INTO variables (device_id, label, name, unit)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [device.id, v.label, v.name, v.unit]
      )
    }

    return reply.code(201).send(device)
  })

  // ── Obtener un dispositivo ─────────────────────
  app.get('/:id', async (req, reply) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows } = await app.db.query(
      `SELECT d.*,
              CASE WHEN d.last_seen > NOW() - INTERVAL '5 minutes'
                   THEN 'online' ELSE 'offline' END as status
       FROM devices d
       WHERE d.id = $1 AND d.org_id = $2`,
      [req.params.id, targetOrgId]
    )

    if (!rows.length) return reply.code(404).send({ error: 'Dispositivo no encontrado' })
    return rows[0]
  })

  // ── Actualizar dispositivo ─────────────────────
  app.put('/:id', async (req, reply) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { name, label, lat, lng, status } = req.body

    const { rows } = await app.db.query(
      `UPDATE devices SET
         name = COALESCE($1, name),
         label = COALESCE($2, label),
         lat = COALESCE($3, lat),
         lng = COALESCE($4, lng),
         status = COALESCE($5, status)
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
      [name, label, lat, lng, status, req.params.id, targetOrgId]
    )

    if (!rows.length) return reply.code(404).send({ error: 'Dispositivo no encontrado' })
    return rows[0]
  })

  // ── Eliminar dispositivo ───────────────────────
  app.delete('/:id', async (req, reply) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rowCount } = await app.db.query(
      'DELETE FROM devices WHERE id = $1 AND org_id = $2',
      [req.params.id, targetOrgId]
    )

    if (!rowCount) return reply.code(404).send({ error: 'Dispositivo no encontrado' })
    return { message: 'Dispositivo eliminado' }
  })

  // ── Variables del dispositivo ──────────────────
  app.get('/:id/variables', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows } = await app.db.query(
      `SELECT v.*
       FROM variables v
       JOIN devices d ON d.id = v.device_id
       WHERE v.device_id = $1 AND d.org_id = $2
       ORDER BY v.label`,
      [req.params.id, targetOrgId]
    )
    return rows
  })

  // ── Último valor de todas las variables (para KPIs) ──
  app.get('/:id/last-values', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows: variables } = await app.db.query(
      `SELECT v.label, v.name, v.unit, v.last_value, v.last_time
       FROM variables v
       JOIN devices d ON d.id = v.device_id
       WHERE v.device_id = $1 AND d.org_id = $2`,
      [req.params.id, targetOrgId]
    )
    return variables
  })
}
