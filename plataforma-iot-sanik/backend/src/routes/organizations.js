import bcrypt from 'bcrypt'

const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function (app) {

  // ── 1. LISTAR TODAS LAS ORGANIZACIONES ──
  app.get('/', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { rows } = await app.db.query(`
      SELECT 
        o.id, o.name, o.slug, o.location, o.plan, o.status, o.paid_until, 
        o.nit, o.contact_name, o.notes, o.phone,
        MAX(u.email) as email,
        COUNT(DISTINCT d.id)::int as device_count,
        COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END)::int as active_devices
      FROM organizations o
      LEFT JOIN users u ON u.org_id = o.id AND u.role = 'client'
      LEFT JOIN devices d ON d.org_id = o.id
      WHERE o.slug != 'sanik-internal'
      GROUP BY o.id
      ORDER BY o.name ASC
    `)
    return rows
  })

  // ── 2. OBTENER UNA ORGANIZACIÓN ──
  app.get('/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { rows: [org] } = await app.db.query(`
      SELECT o.*, u.email
      FROM organizations o
      LEFT JOIN users u ON u.org_id = o.id AND u.role = 'client'
      WHERE o.id = $1
      LIMIT 1
    `, [req.params.id])
    if (!org) return reply.code(404).send({ error: 'Organización no encontrada' })
    return org
  })

  // ── 3. CREAR ORGANIZACIÓN ──
  app.post('/', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = req.body || {}
    const name        = body.name || body.organizationName || body.orgName
    const email       = body.email || body.clientEmail
    const phone       = body.phone || ''
    const location    = body.location || ''
    const plan        = body.plan || 'free'
    const contactName = body.contactName || body.contact_name || ''
    const nit         = body.nit || ''
    const notes       = body.notes || ''

    if (!name) {
      return reply.code(400).send({ error: 'El nombre de la organización es obligatorio' })
    }

    // Generar slug único a partir del nombre
    const baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')

    // Verificar que el slug no exista, si existe agregar sufijo numérico
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { rows } = await app.db.query(
        'SELECT id FROM organizations WHERE slug = $1', [slug]
      )
      if (!rows.length) break
      slug = `${baseSlug}-${counter++}`
    }

    const client = await app.db.connect()
    try {
      await client.query('BEGIN')

      // Verificar correo si fue proporcionado
      if (email) {
        const { rows: [existingUser] } = await client.query(
          'SELECT id FROM users WHERE email = $1', [email]
        )
        if (existingUser) {
          await client.query('ROLLBACK')
          return reply.code(400).send({ error: 'El correo electrónico ya está registrado' })
        }
      }

      // Crear organización
      const { rows: [org] } = await client.query(`
        INSERT INTO organizations (name, slug, location, plan, status, nit, contact_name, notes, phone)
        VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
        RETURNING *
      `, [name, slug, location, plan, nit, contactName, notes, phone])

      // Generar contraseña automática
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let autoPassword = 'Sanik-'
      for (let i = 0; i < 6; i++) {
        autoPassword += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      const passwordHash = await bcrypt.hash(autoPassword, 10)

      // Usar correo o generar uno interno
      const clientEmail = email || `${slug}@sanik.local`

      await client.query(`
        INSERT INTO users (email, password_hash, temp_password, role, org_id, status)
        VALUES ($1, $2, $3, 'client', $4, 'active')
      `, [clientEmail, passwordHash, autoPassword, org.id])

      await client.query('COMMIT')

      org.email = clientEmail
      org.credentials = { username: clientEmail, password: autoPassword }
      return reply.code(201).send(org)

    } catch (err) {
      await client.query('ROLLBACK')
      req.log.error(err)
      return reply.code(500).send({ error: 'Error interno al registrar el cliente' })
    } finally {
      client.release()
    }
  })

  // ── 4. ACTUALIZAR ORGANIZACIÓN ──
  app.put('/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { name, location, plan, status, paidUntil, nit, contactName, notes, phone, email } = req.body

    const client = await app.db.connect()
    try {
      await client.query('BEGIN')

      const { rows: [updatedOrg] } = await client.query(`
        UPDATE organizations SET
          name         = COALESCE($1, name),
          location     = COALESCE($2, location),
          plan         = COALESCE($3, plan),
          status       = COALESCE($4, status),
          paid_until   = COALESCE($5, paid_until),
          nit          = COALESCE($6, nit),
          contact_name = COALESCE($7, contact_name),
          notes        = COALESCE($8, notes),
          phone        = COALESCE($9, phone)
        WHERE id = $10
        RETURNING *
      `, [name, location, plan, status, paidUntil, nit, contactName, notes, phone, req.params.id])

      if (!updatedOrg) {
        await client.query('ROLLBACK')
        return reply.code(404).send({ error: 'Organización no encontrada' })
      }

      if (email !== undefined) {
        const result = await client.query(`
          UPDATE users SET email = $1
          WHERE org_id = $2 AND role = 'client'
        `, [email, req.params.id])

        if (result.rowCount === 0 && email) {
          const tempPass = 'Sanik-' + Math.random().toString(36).slice(2, 8)
          const hash = await bcrypt.hash(tempPass, 10)
          await client.query(`
            INSERT INTO users (email, password_hash, temp_password, role, org_id, status)
            VALUES ($1, $2, $3, 'client', $4, 'active')
          `, [email, hash, tempPass, req.params.id])
        }
        updatedOrg.email = email
      }

      await client.query('COMMIT')
      return updatedOrg

    } catch (err) {
      await client.query('ROLLBACK')
      req.log.error(err)
      return reply.code(500).send({ error: 'Error interno al actualizar el cliente' })
    } finally {
      client.release()
    }
  })

  // ── 5. SUSPENDER / ACTIVAR ──
  app.patch('/:id/status', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { status } = req.body
    const { rows: [org] } = await app.db.query(
      'UPDATE organizations SET status = $1 WHERE id = $2 RETURNING id, name, status',
      [status, req.params.id]
    )
    return org
  })

  // ── 6. REVELAR CREDENCIALES ──
  app.post('/:id/reveal-credentials', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { adminPassword } = req.body
    const adminUserId = req.user?.id || req.user?.userId

    if (!adminPassword) return reply.code(400).send({ error: 'La contraseña de administrador es requerida' })

    const { rows: [adminUser] } = await app.db.query(
      'SELECT password_hash, role FROM users WHERE id = $1', [adminUserId]
    )

    if (!adminUser || !SANIK_ROLES.includes(adminUser.role))
      return reply.code(403).send({ error: 'Sin permisos' })

    const valid = await bcrypt.compare(adminPassword, adminUser.password_hash)
    if (!valid) return reply.code(401).send({ error: 'Contraseña incorrecta' })

    const { rows: [clientUser] } = await app.db.query(
      "SELECT email, temp_password FROM users WHERE org_id = $1 AND role = 'client' LIMIT 1",
      [req.params.id]
    )

    if (!clientUser) return reply.code(404).send({ error: 'Cliente sin usuario creado' })

    return {
      email: clientUser.email,
      password: clientUser.temp_password || 'Contraseña ya modificada por el cliente'
    }
  })

  // ── 7. RESETEAR CONTRASEÑA ──
  app.post('/:id/reset-client-password', { onRequest: [app.authenticate] }, async (req, reply) => {
    if (!SANIK_ROLES.includes(req.user?.role))
      return reply.code(403).send({ error: 'Sin permisos' })

    const { rows: [clientUser] } = await app.db.query(
      "SELECT id, email FROM users WHERE org_id = $1 AND role = 'client' LIMIT 1",
      [req.params.id]
    )

    if (!clientUser) return reply.code(404).send({ error: 'No se encontró usuario cliente' })

    const newPassword = 'Sanik-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const hash = await bcrypt.hash(newPassword, 10)

    await app.db.query(
      "UPDATE users SET password_hash = $1, temp_password = $2, status = 'active' WHERE id = $3",
      [hash, newPassword, clientUser.id]
    )

    return { email: clientUser.email, password: newPassword }
  })
}