export default async function alertsRoutes(app) {

  app.addHook('onRequest', app.authenticate)

  // ── Listar alertas de un dispositivo ──────────
  app.get('/:deviceId', async (req) => {
    const { rows } = await app.db.query(
      `SELECT a.*
       FROM alerts a
       JOIN devices d ON d.id = a.device_id
       WHERE a.device_id = $1 AND d.org_id = $2
       ORDER BY a.created_at DESC`,
      [req.params.deviceId, req.user.orgId]
    )
    return rows
  })

  // ── Crear alerta ───────────────────────────────
  app.post('/', async (req, reply) => {
    const { deviceId, variable, condition, threshold, channel, destination } = req.body

    const { rows: [alert] } = await app.db.query(
      `INSERT INTO alerts (device_id, variable, condition, threshold, channel, destination)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [deviceId, variable, condition, threshold, channel, destination]
    )
    return reply.code(201).send(alert)
  })

  // ── Activar / desactivar alerta ────────────────
  app.patch('/:id', async (req) => {
    const { active } = req.body
    const { rows: [alert] } = await app.db.query(
      'UPDATE alerts SET active = $1 WHERE id = $2 RETURNING *',
      [active, req.params.id]
    )
    return alert
  })

  // ── Eliminar alerta ────────────────────────────
  app.delete('/:id', async (req) => {
    await app.db.query('DELETE FROM alerts WHERE id = $1', [req.params.id])
    return { message: 'Alerta eliminada' }
  })
}
