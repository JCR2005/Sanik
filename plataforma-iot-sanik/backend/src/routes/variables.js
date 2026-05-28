export default async function variablesRoutes(app) {

  app.addHook('onRequest', app.authenticate)

  // ── Actualizar variable (nombre, unidad) ───────
  app.put('/:id', async (req, reply) => {
    const { name, unit } = req.body

    const { rows } = await app.db.query(
      `UPDATE variables v SET name = $1, unit = $2
       FROM devices d
       WHERE v.device_id = d.id
         AND v.id = $3
         AND d.org_id = $4
       RETURNING v.*`,
      [name, unit, req.params.id, req.user.orgId]
    )

    if (!rows.length) return reply.code(404).send({ error: 'Variable no encontrada' })
    return rows[0]
  })
}
