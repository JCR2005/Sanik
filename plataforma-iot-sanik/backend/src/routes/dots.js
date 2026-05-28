export default async function dotsRoutes(app) {

  app.addHook('onRequest', app.authenticate)

  // ── Datos históricos de una variable ──────────
  // GET /api/dots/:deviceId/:variable?range=24h
  app.get('/:deviceId/:variable', async (req, reply) => {
    const { deviceId, variable } = req.params
    const { range = '24h', limit = 500 } = req.query

    // Convertir range a intervalo de PostgreSQL
    const intervals = {
      '1h':  '1 hour',
      '6h':  '6 hours',
      '24h': '24 hours',
      '7d':  '7 days',
      '30d': '30 days'
    }
    const interval = intervals[range] || '24 hours'

    // Verificar que el dispositivo pertenece a la organización
    const { rows: check } = await app.db.query(
      'SELECT id FROM devices WHERE id = $1 AND org_id = $2',
      [deviceId, req.user.orgId]
    )
    if (!check.length) return reply.code(403).send({ error: 'Sin acceso' })

    // Consulta de datos históricos
    const { rows } = await app.db.query(
      `SELECT time, value
       FROM dots
       WHERE device_id = $1
         AND variable = $2
         AND time > NOW() - INTERVAL '${interval}'
       ORDER BY time ASC
       LIMIT $3`,
      [deviceId, variable, limit]
    )

    return rows
  })

  // ── Múltiples variables a la vez (para la gráfica principal) ──
  // GET /api/dots/:deviceId?variables=temperatura,humedad&range=24h
  app.get('/:deviceId', async (req, reply) => {
    const { deviceId } = req.params
    const { variables = '', range = '24h' } = req.query

    const varList = variables.split(',').filter(Boolean)
    if (!varList.length) return reply.code(400).send({ error: 'Indicá al menos una variable' })

    const intervals = {
      '1h': '1 hour', '6h': '6 hours',
      '24h': '24 hours', '7d': '7 days', '30d': '30 days'
    }
    const interval = intervals[range] || '24 hours'

    const { rows: check } = await app.db.query(
      'SELECT id FROM devices WHERE id = $1 AND org_id = $2',
      [deviceId, req.user.orgId]
    )
    if (!check.length) return reply.code(403).send({ error: 'Sin acceso' })

    const { rows } = await app.db.query(
      `SELECT time, variable, value
       FROM dots
       WHERE device_id = $1
         AND variable = ANY($2)
         AND time > NOW() - INTERVAL '${interval}'
       ORDER BY time ASC`,
      [deviceId, varList]
    )

    // Agrupar por variable para el frontend
    const result = {}
    for (const v of varList) result[v] = []
    for (const row of rows) {
      if (result[row.variable]) {
        result[row.variable].push({ time: row.time, value: row.value })
      }
    }

    return result
  })

  // ── Recibir datos por HTTP (alternativa a MQTT) ──
  // POST /api/dots/:deviceToken
  app.post('/:deviceToken', {
    config: { skipAuth: true }
  }, async (req, reply) => {
    const { deviceToken } = req.params
    const payload = req.body

    const { rows } = await app.db.query(
      'SELECT id FROM devices WHERE token = $1',
      [deviceToken]
    )
    if (!rows.length) return reply.code(404).send({ error: 'Token inválido' })

    const deviceId = rows[0].id
    const now = new Date()

    for (const [variable, value] of Object.entries(payload)) {
      if (typeof value !== 'number') continue

      await app.db.query(
        'INSERT INTO dots (time, device_id, variable, value) VALUES ($1, $2, $3, $4)',
        [now, deviceId, variable, value]
      )

      await app.redis.set(
        `last:${deviceId}:${variable}`,
        JSON.stringify({ value, time: now }),
        { EX: 86400 }
      )
    }

    await app.db.query(
      'UPDATE devices SET last_seen = $1 WHERE id = $2',
      [now, deviceId]
    )

    return reply.code(201).send({ message: 'Datos guardados', count: Object.keys(payload).length })
  })
}
