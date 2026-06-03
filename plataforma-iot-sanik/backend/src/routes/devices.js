import crypto from 'crypto'
const SANIK_ROLES = ['superadmin', 'admin', 'worker']

export default async function devicesRoutes(app) {

  // Middleware de autenticación para todas las rutas
  app.addHook('onRequest', app.authenticate)

  // ── NUEVA RUTA: Obtener el catálogo global de variables para el Modal ──
  app.get('/catalog', async (req) => {
    const { rows } = await app.db.query(
      `SELECT label, name, unit, icon, description, data_type 
       FROM variable_catalog 
       ORDER BY name ASC`
    )
    return rows
  })

  // ── Listar dispositivos de la organización ─────
  app.get('/', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows } = await app.db.query(
      `SELECT d.*,
              COUNT(dv.variable_label) as variable_count,
              CASE WHEN d.last_seen > NOW() - INTERVAL '5 minutes'
                   THEN 'online' ELSE 'offline' END as status
       FROM devices d
       LEFT JOIN device_variables dv ON dv.device_id = d.id
       WHERE d.org_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [targetOrgId]
    )
    return rows
  })

  // ── Crear dispositivo ──────────────────────────
  app.post('/', async (req, reply) => {
    const { label, name, lat, lng, orgId, description, icon, tags, selectedVariables } = req.body
    
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && orgId)
      ? orgId
      : req.user.orgId

    try {
      const { rows: [device] } = await app.db.query(
        `INSERT INTO devices (org_id, label, name, lat, lng, description, icon, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          targetOrgId, 
          label, 
          name, 
          lat, 
          lng, 
          description || null, 
          icon || 'map-pin',           
          tags ? JSON.stringify(tags) : '[]' 
        ]
      )

      const token = crypto.randomBytes(24).toString('hex')
      await app.db.query('UPDATE devices SET token = $1 WHERE id = $2', [token, device.id])
      device.token = token

      // Guardamos únicamente las relaciones elegidas por el cliente
      if (Array.isArray(selectedVariables)) {
        for (const labelKey of selectedVariables) {
          await app.db.query(
            `INSERT INTO device_variables (device_id, variable_label)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [device.id, labelKey]
          )
        }
      }

      return device

    } catch (err) {
      if (err.code === '23505') {
        return reply.code(400).send({ error: 'Ya existe una estación con este nombre o identificador (Label) en esta organización.' })
      }
      req.log.error(err)
      return reply.code(500).send({ error: 'Error interno al crear el dispositivo.' })
    }
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
    
    const { name, label, lat, lng, status, description, icon, tags, selectedVariables } = req.body

    const { rows } = await app.db.query(
      `UPDATE devices SET
         name = COALESCE($1, name),
         label = COALESCE($2, label),
         lat = COALESCE($3, lat),
         lng = COALESCE($4, lng),
         status = COALESCE($5, status),
         description = COALESCE($6, description),
         icon = COALESCE($7, icon),
         tags = COALESCE($8, tags)
       WHERE id = $9 AND org_id = $10
       RETURNING *`,
      [name, label, lat, lng, status, description, icon, tags ? JSON.stringify(tags) : null, req.params.id, targetOrgId]
    )

    if (!rows.length) return reply.code(404).send({ error: 'Dispositivo no encontrado' })

    // Sincronización inteligente de variables
    if (Array.isArray(selectedVariables)) {
      await app.db.query(
        `DELETE FROM device_variables WHERE device_id = $1 AND NOT (variable_label = ANY($2))`,
        [req.params.id, selectedVariables]
      )

      for (const labelKey of selectedVariables) {
        await app.db.query(
          `INSERT INTO device_variables (device_id, variable_label)
           VALUES ($1, $2)
           ON CONFLICT (device_id, variable_label) DO NOTHING`, 
          [req.params.id, labelKey]
        )
      }
    }

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

  // ── Variables del dispositivo (Trayendo metadatos desde el catálogo maestro) ──
  app.get('/:id/variables', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId
    const { rows } = await app.db.query(
      `SELECT vc.label, vc.name, vc.unit, vc.icon, vc.description, dv.created_at
       FROM device_variables dv
       JOIN variable_catalog vc ON vc.label = dv.variable_label
       JOIN devices d ON d.id = dv.device_id
       WHERE dv.device_id = $1 AND d.org_id = $2
       ORDER BY vc.name`,
      [req.params.id, targetOrgId]
    )
    return rows
  })

 app.get('/:id/last-values', async (req) => {
    const targetOrgId = (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId

    const { rows: variables } = await app.db.query(
      `SELECT vc.label, vc.name, vc.unit, vc.icon
       FROM device_variables dv
       JOIN variable_catalog vc ON vc.label = dv.variable_label
       JOIN devices d ON d.id = dv.device_id
       WHERE dv.device_id = $1 AND d.org_id = $2`,
      [req.params.id, targetOrgId]
    )

    // ¡LA MAGIA FALTANTE! Buscar el valor real en Redis para cada variable
    for (const v of variables) {
      if (app.redis) {
        const redisData = await app.redis.get(`last:${req.params.id}:${v.label}`)
        if (redisData) {
          const parsed = JSON.parse(redisData)
          v.last_value = parsed.value
        } else {
          v.last_value = null
        }
      }
    }

    return variables
  })

  
app.get('/:id/aqi', async (req, reply) => {
  const targetOrgId =
    (SANIK_ROLES.includes(req.user.role) && req.query.orgId)
      ? req.query.orgId
      : req.user.orgId

  // Verificar acceso al dispositivo
  const { rows: [device] } = await app.db.query(
    `
    SELECT id
    FROM devices
    WHERE id = $1
      AND org_id = $2
    `,
    [req.params.id, targetOrgId]
  )

  if (!device) {
    return reply.code(403).send({
      error: 'Sin acceso'
    })
  }

  // Variables consideradas para el AQI
  const AQI_VARS = [
    'co',
    'co2',
    'nh3',
    'nox',
    'no2',
    'o3',
    'so2',
    'pm25',
    'pm10'
  ]

  // Último dato de cada variable
  const { rows: latestDots } = await app.db.query(
    `
    SELECT DISTINCT ON (variable)
      variable,
      value,
      time
    FROM dots
    WHERE device_id = $1
      AND variable = ANY($2)
      AND time > NOW() - INTERVAL '1 hour'
    ORDER BY variable, time DESC
    `,
    [req.params.id, AQI_VARS]
  )

  if (!latestDots.length) {
    return {
      aqi: null,
      category: 'Sin datos',
      dominantPollutant: null,
      dominantValue: null,
      variables: {}
    }
  }

  const variableScores = {}

  let totalScore = 0
  let totalWeight = 0

  let dominant = {
    label: null,
    score: -1,
    value: null
  }

  for (const dot of latestDots) {

    const { rows: [range] } = await app.db.query(
      `
      SELECT
        score,
        category,
        weight
      FROM air_quality_ranges
      WHERE variable_label = $1
        AND min_value <= $2
        AND (
          max_value IS NULL
          OR max_value > $2
        )
      LIMIT 1
      `,
      [dot.variable, dot.value]
    )

    if (!range) continue

    variableScores[dot.variable] = {
      value: Number(dot.value),
      score: Number(range.score),
      category: range.category,
      weight: Number(range.weight)
    }

    // Promedio ponderado
    totalScore += Number(range.score) * Number(range.weight)
    totalWeight += Number(range.weight)

    // Contaminante dominante
    if (Number(range.score) > dominant.score) {
      dominant = {
        label: dot.variable,
        score: Number(range.score),
        value: Number(dot.value)
      }
    }
  }

  // AQI ponderado
  let weightedAQI =
    totalWeight > 0
      ? totalScore / totalWeight
      : 0

  // Penalización por contaminante dominante
  const maxScore = Math.max(
    ...Object.values(variableScores).map(v => v.score),
    0
  )

  let aqi = Math.round(
    weightedAQI * 0.7 +
    maxScore * 0.3
  )

  // Limitar 0-100
  aqi = Math.max(
    0,
    Math.min(100, aqi)
  )

  let category = 'Excelente'

  if (aqi <= 20) {
    category = 'Excelente'
  } else if (aqi <= 40) {
    category = 'Buena'
  } else if (aqi <= 60) {
    category = 'Precaución'
  } else if (aqi <= 80) {
    category = 'Mala'
  } else {
    category = 'Peligrosa'
  }

  return {
    aqi,
    category,

    dominantPollutant: dominant.label,
    dominantValue: dominant.value,

    variables: variableScores,

    metadata: {
      variablesUsed: Object.keys(variableScores).length,
      weightedAverage: Math.round(weightedAQI),
      worstScore: maxScore
    }
  }
})
}