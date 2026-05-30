const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function dotsRoutes(app) {

  // Proteger solo las rutas GET (POST debe ser público para Postman/ESP32)
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'GET') {
      await app.authenticate(req, reply)
    }
  })

 // ── 1. DATOS HISTÓRICOS PARA LA GRÁFICA (GET) ──────────
  app.get('/:deviceId/:variable', async (req, reply) => {
    const { deviceId } = req.params
    const variable = String(req.params.variable || '').toLowerCase()
    const { range = '24h' } = req.query

    // Diccionario de tiempos 
    const intervals = {
      '1h':  '1 hour',
      '6h':  '6 hours',
      '24h': '24 hours',
      '7d':  '7 days',
      '30d': '30 days'
    }
    const interval = intervals[range] || '24 hours'

    // 1. Validar permisos de forma robusta (sin depender del req.query.orgId)
    const { rows: check } = await app.db.query(
      'SELECT org_id FROM devices WHERE id = $1',
      [deviceId]
    )
    if (!check.length) return reply.code(404).send({ error: 'Dispositivo no encontrado' })
    
    // Si no es admin y no pertenece a su organización, bloquear
    if (!SANIK_ROLES.includes(req.user.role) && req.user.orgId !== check[0].org_id) {
      return reply.code(403).send({ error: 'Sin acceso' })
    }

    // 2. Extraer los puntos (Usamos interpolación segura INTERVAL '${interval}' para evitar el bug de pg)
    const { rows } = await app.db.query(
      `SELECT time, value FROM dots
       WHERE device_id = $1 AND variable = $2 
       AND time >= NOW() - INTERVAL '${interval}'
       ORDER BY time ASC`,
      [deviceId, variable]
    )

    // 3. Mapear seguro para el Frontend
    return rows.map(r => ({
      time: new Date(r.time).toISOString(),
      value: Number(r.value)
    }))
  })

  // ── 2. DATOS HISTÓRICOS MULTI-VARIABLE (GET) ──────────
  app.get('/:deviceId', async (req, reply) => {
    const { deviceId } = req.params
    const { variables = '', range = '24h' } = req.query

    const varList = variables.split(',').filter(Boolean).map(v => v.toLowerCase())
    if (!varList.length) return reply.code(400).send({ error: 'Indicá al menos una variable' })

    const intervals = {
      '1h': '1 hour', '6h': '6 hours',
      '24h': '24 hours', '7d': '7 days', '30d': '30 days'
    }
    const interval = intervals[range] || '24 hours'

    const { rows: check } = await app.db.query(
      'SELECT org_id FROM devices WHERE id = $1',
      [deviceId]
    )
    if (!check.length) return reply.code(404).send({ error: 'Dispositivo no encontrado' })

    if (!SANIK_ROLES.includes(req.user.role) && req.user.orgId !== check[0].org_id) {
      return reply.code(403).send({ error: 'Sin acceso' })
    }

    const { rows } = await app.db.query(
      `SELECT time, variable, value
       FROM dots
       WHERE device_id = $1
         AND variable = ANY($2)
         AND time >= NOW() - INTERVAL '${interval}'
       ORDER BY time ASC`,
      [deviceId, varList]
    )

    const result = {}
    for (const v of varList) result[v] = []
    for (const row of rows) {
      if (result[row.variable]) {
        result[row.variable].push({ time: row.time, value: Number(row.value) })
      }
    }

    return result
  })
  app.post('/:deviceToken', async (req, reply) => {
    const { deviceToken } = req.params
    const payload = req.body

    const { rows } = await app.db.query(
      'SELECT id FROM devices WHERE token = $1',
      [deviceToken]
    )
    if (!rows.length) return reply.code(404).send({ error: 'Token inválido' })

    const deviceId = rows[0].id
    const now = new Date()
    let guardados = 0

    for (const [rawVariable, rawValue] of Object.entries(payload)) {
      const variable = String(rawVariable).toLowerCase()
      const value = Number(rawValue) // Convertir string de Postman a número
      if (isNaN(value)) continue     // Si es basura ("hola"), ignorar

      await app.db.query(
        `INSERT INTO device_variables (device_id, variable_label)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [deviceId, variable]
      )

      // 1. Guardar histórico para la Gráfica
      await app.db.query(
        'INSERT INTO dots (time, device_id, variable, value) VALUES ($1, $2, $3, $4)',
        [now, deviceId, variable, value]
      )

      // 2. Guardar en Redis para las Tarjetas en tiempo real
      if (app.redis) {
        await app.redis.set(
          `last:${deviceId}:${variable}`,
          JSON.stringify({ value, time: now }),
          { EX: 86400 } // Expira en 24 horas si pierde conexión
        )
      }
      guardados++
    }

    // Actualizar última conexión del dispositivo
    await app.db.query(
      'UPDATE devices SET last_seen = $1 WHERE id = $2',
      [now, deviceId]
    )

    return reply.code(201).send({ message: 'Datos guardados', count: guardados })
  })
}