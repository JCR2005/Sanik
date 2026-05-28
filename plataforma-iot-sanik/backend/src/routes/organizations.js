// Rutas para gestión de organizaciones (clientes)
// Solo accesible por admin/superadmin/worker de Sanik

const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function organizationsRoutes(app) {

  app.addHook('onRequest', app.authenticate)

  // Verificar que sea equipo Sanik
  app.addHook('preHandler', async (req, reply) => {
    if (!SANIK_ROLES.includes(req.user.role))
      return reply.code(403).send({ error: 'Sin permisos' })
  })

  // ── Listar todas las organizaciones ───────────
  app.get('/', async (req) => {
    const { rows } = await app.db.query(
      `SELECT o.*,
              COUNT(DISTINCT u.id) as user_count,
              COUNT(DISTINCT d.id) as device_count,
              COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_devices
       FROM organizations o
       LEFT JOIN users u ON u.org_id = o.id AND u.role = 'client'
       LEFT JOIN devices d ON d.org_id = o.id
       WHERE o.slug != 'sanik-internal'
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    )
    return rows
  })

  // ── Crear organización + usuario cliente ───────
  app.post('/', async (req, reply) => {
    const { orgName, phone, location, plan, paidUntil } = req.body

    // Generar usuario y contraseña automáticamente
    const orgSlug = orgName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')

    const email = orgSlug + '@sanik.local' // usuario interno
    const password = 'Sanik-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    const bcrypt = await import('bcrypt')

    const existing = await app.db.query(
      'SELECT id FROM organizations WHERE slug = $1', [orgSlug]
    )
    if (existing.rows.length)
      return reply.code(400).send({ error: 'Ese nombre de organización ya existe' })

    const hash = await bcrypt.default.hash(password, 10)

    const { rows: [org] } = await app.db.query(
      `INSERT INTO organizations (name, slug, plan, phone, location, status, paid_until)
       VALUES ($1, $2, $3, $4, $5, 'active', $6) RETURNING *`,
      [orgName, orgSlug || orgName.toLowerCase().replace(/\s+/g, '-'), plan || 'free', phone, location, paidUntil || null]
    )

    const { rows: [user] } = await app.db.query(
      `INSERT INTO users (org_id, email, password_hash, role)
       VALUES ($1, $2, $3, 'client') RETURNING id, email, role`,
      [org.id, email, hash]
    )
    return reply.code(201).send({ org, user, credentials: { username: orgSlug, password } })
  })

  // ── Obtener una organización ───────────────────
  app.get('/:id', async (req, reply) => {
    const { rows } = await app.db.query(
      `SELECT o.*,
              COUNT(DISTINCT d.id) as device_count,
              COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_devices,
              COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as pending_devices
       FROM organizations o
       LEFT JOIN devices d ON d.org_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [req.params.id]
    )
    if (!rows.length) return reply.code(404).send({ error: 'No encontrado' })
    return rows[0]
  })

  // ── Actualizar organización ────────────────────
  app.put('/:id', async (req, reply) => {
    const { name, phone, location, plan, status, paidUntil, notes } = req.body
    const { rows: [org] } = await app.db.query(
      `UPDATE organizations SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        location = COALESCE($3, location),
        plan = COALESCE($4, plan),
        status = COALESCE($5, status),
        paid_until = COALESCE($6, paid_until),
        notes = COALESCE($7, notes)
       WHERE id = $8 RETURNING *`,
      [name, phone, location, plan, status, paidUntil, notes, req.params.id]
    )
    return org
  })

  // ── Suspender / activar ────────────────────────
  app.patch('/:id/status', async (req, reply) => {
    const { status } = req.body
    const { rows: [org] } = await app.db.query(
      'UPDATE organizations SET status = $1 WHERE id = $2 RETURNING id, name, status',
      [status, req.params.id]
    )
    return org
  })
}
