import bcrypt from 'bcrypt'

// Roles permitidos en el sistema
// superadmin = admin central (solo uno, no se puede crear desde la app)
// admin = administrador Sanik
// worker = trabajador Sanik
// client = cliente (municipalidad, empresa)
const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function authRoutes(app) {

  // ── Login ──────────────────────────────────────
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body

    const { rows } = await app.db.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.name, u.status,
              u.org_id, o.name as org_name, o.slug as org_slug, o.plan, o.status as org_status
      FROM users u
      LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.email = $1`,
      [email]
    )

    if (!rows.length)
      return reply.code(401).send({ error: 'Correo o contraseña incorrectos' })

    const user = rows[0]

    if (user.status === 'suspended')
      return reply.code(403).send({ error: 'Tu cuenta está suspendida. Contactá a Sanik.' })

    if (user.org_status === 'suspended' && !SANIK_ROLES.includes(user.role))
      return reply.code(403).send({ error: 'Tu organización está suspendida. Contactá a Sanik.' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return reply.code(401).send({ error: 'Correo o contraseña incorrectos' })

    const token = app.jwt.sign({
      userId: user.id,
      orgId:  user.org_id,
      role:   user.role
    })

    // Ruta a la que redirigir según el rol
    const redirect = SANIK_ROLES.includes(user.role) ? '/admin' : '/devices'

    return {
      token,
      redirect,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      org:  { id: user.org_id, name: user.org_name, slug: user.org_slug, plan: user.plan }
    }
  })

  // ── Perfil del usuario actual ──────────────────
  app.get('/me', { onRequest: [app.authenticate] }, async (req) => {
    const { rows } = await app.db.query(
      `SELECT u.id, u.email, u.role, u.name, u.phone,
              o.id as org_id, o.name as org_name, o.slug, o.plan, o.location
       FROM users u 
      LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.id = $1`,
      [req.user.userId]
    )
    return rows[0]
  })

  // ── Crear usuario (solo admin/superadmin de Sanik) ──
  app.post('/users', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { role: myRole } = req.user
    const { email, password, name, phone, role, orgId } = req.body

    // Solo superadmin puede crear admins
    if (role === 'admin' && myRole !== 'superadmin')
      return reply.code(403).send({ error: 'Solo el superadmin puede crear administradores' })

    // Solo Sanik puede crear workers y admins
    if (SANIK_ROLES.includes(role) && !SANIK_ROLES.includes(myRole))
      return reply.code(403).send({ error: 'Sin permisos' })

    const existing = await app.db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length)
      return reply.code(400).send({ error: 'Ese correo ya está registrado' })

    const hash = await bcrypt.hash(password, 10)
    const targetOrgId = orgId || req.user.orgId

    const { rows: [user] } = await app.db.query(
      `INSERT INTO users (org_id, email, password_hash, role, name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, name`,
      [targetOrgId, email, hash, role || 'client', name, phone]
    )

    return reply.code(201).send(user)
  })

  // ── Listar usuarios de Sanik (equipo interno) ──
  app.get('/team', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { role } = req.user
    if (!SANIK_ROLES.includes(role))
      return reply.code(403).send({ error: 'Sin permisos' })

    const { rows } = await app.db.query(
      `SELECT u.id, u.email, u.role, u.name, u.status, u.created_at
       FROM users u
        LEFT JOIN organizations o ON o.id = u.org_id
      WHERE (o.slug = 'sanik-internal' OR u.org_id IS NULL)
       ORDER BY u.created_at ASC`
    )
    return rows
  })

  // ── Actualizar estado de usuario (suspender/activar) ──
  app.patch('/users/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { role: myRole } = req.user
    const { status, role } = req.body

    if (!SANIK_ROLES.includes(myRole))
      return reply.code(403).send({ error: 'Sin permisos' })

    // Solo superadmin puede cambiar rol de admins
    if (role === 'admin' && myRole !== 'superadmin')
      return reply.code(403).send({ error: 'Solo el superadmin puede cambiar este rol' })

    const updates = []
    const values = []
    let i = 1

    if (status) { updates.push(`status = $${i++}`); values.push(status) }
    if (role)   { updates.push(`role = $${i++}`);   values.push(role) }

    values.push(req.params.id)

    const { rows: [user] } = await app.db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, role, status`,
      values
    )
    return user
  })
}
