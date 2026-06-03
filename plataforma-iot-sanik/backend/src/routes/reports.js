export default async function reportsRoutes(app) {
  app.addHook('onRequest', app.authenticate)

  // ── 1. ESTADÍSTICAS GLOBALES PARA DASHBOARD ──
  app.get('/stats', async (req) => {
    const { rows: [stats] } = await app.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE slug != 'sanik-internal') as total_clients,
        (SELECT COUNT(*) FROM devices) as total_devices,
        (SELECT COUNT(*) FROM devices WHERE last_seen > NOW() - INTERVAL '5 minutes') as active_devices,
        (SELECT COUNT(*) FROM requests WHERE status = 'pending') as pending_requests
    `)
    return stats
  })

  // ── 2. DATOS PARA MAPA DE CALOR (ISLAS DE CALOR) ──
  app.get('/heatmap', async (req) => {
    let { orgId, start, end } = req.query
    
    // Si es cliente, forzar su orgId
    if (req.user.role === 'client') {
      orgId = req.user.orgId
    }

    let query = `
      SELECT 
        d.id, d.name, d.lat, d.lng, 
        AVG(CASE WHEN dot.variable = 'temperatura' THEN dot.value END) as avg_temp,
        AVG(CASE WHEN dot.variable = 'humedad' THEN dot.value END) as avg_hum,
        MAX(CASE WHEN dot.variable = 'temperatura' THEN dot.value END) as max_temp,
        MIN(CASE WHEN dot.variable = 'temperatura' THEN dot.value END) as min_temp
      FROM devices d
      JOIN dots dot ON dot.device_id = d.id
      WHERE dot.variable IN ('temperatura', 'humedad')
    `
    const params = []
    let i = 1

    if (orgId) {
      query += ` AND d.org_id = $${i++}`
      params.push(orgId)
    }
    if (start) {
      query += ` AND dot.time >= $${i++}`
      params.push(start)
    }
    if (end) {
      query += ` AND dot.time <= $${i++}`
      params.push(end)
    }

    query += ` GROUP BY d.id, d.name, d.lat, d.lng`

    const { rows } = await app.db.query(query, params)
    return rows
  })

  // ── 3. REPORTE DE RIESGO RESPIRATORIO ──
  app.get('/respiratory-risk', async (req) => {
    let { orgId, start, end } = req.query

    // Si es cliente, forzar su orgId
    if (req.user.role === 'client') {
      orgId = req.user.orgId
    }

    let query = `
      SELECT 
        d.id, d.name, dot.variable,
        AVG(dot.value) as avg_value,
        MAX(dot.value) as max_value,
        COUNT(*) as samples
      FROM devices d
      JOIN dots dot ON dot.device_id = d.id
      WHERE dot.variable ANY(ARRAY['pm25', 'pm10', 'so2', 'nox', 'o3'])
    `
    const params = []
    let i = 1

    if (orgId) {
      query += ` AND d.org_id = $${i++}`
      params.push(orgId)
    }
    if (start) {
      query += ` AND dot.time >= $${i++}`
      params.push(start)
    }
    if (end) {
      query += ` AND dot.time <= $${i++}`
      params.push(end)
    }

    query += ` GROUP BY d.id, d.name, dot.variable`

    // Cambiamos a ANY para el array de variables
    const finalQuery = query.replace("dot.variable ANY(ARRAY['pm25', 'pm10', 'so2', 'nox', 'o3'])", 
                                   "dot.variable = ANY($"+(i++)+")")
    params.push(['pm25', 'pm10', 'so2', 'nox', 'o3'])

    const { rows } = await app.db.query(finalQuery, params)

    // Agrupar por dispositivo
    const devices = {}
    rows.forEach(row => {
      if (!devices[row.id]) {
        devices[row.id] = { id: row.id, name: row.name, variables: {} }
      }
      devices[row.id].variables[row.variable] = {
        avg: parseFloat(row.avg_value),
        max: parseFloat(row.max_value)
      }
    })

    // Calcular nivel de riesgo basado en umbrales (Simplificado)
    const report = Object.values(devices).map(dev => {
      let riskScore = 0
      let criticalVar = null
      
      // PM2.5: Bueno (0-12), Moderado (13-35), Riesgoso (>35)
      if (dev.variables.pm25) {
        const val = dev.variables.pm25.avg
        if (val > 35) { riskScore = Math.max(riskScore, 3); criticalVar = 'PM2.5' }
        else if (val > 12) riskScore = Math.max(riskScore, 2)
        else riskScore = Math.max(riskScore, 1)
      }

      // PM10: Bueno (0-54), Moderado (55-154), Riesgoso (>154)
      if (dev.variables.pm10) {
        const val = dev.variables.pm10.avg
        if (val > 154) { riskScore = Math.max(riskScore, 3); criticalVar = 'PM10' }
        else if (val > 54) riskScore = Math.max(riskScore, 2)
        else riskScore = Math.max(riskScore, 1)
      }

      // SO2: Bueno (0-75), Moderado (76-185), Riesgoso (>185)
      if (dev.variables.so2) {
        const val = dev.variables.so2.avg
        if (val > 185) { riskScore = Math.max(riskScore, 3); criticalVar = 'SO₂' }
        else if (val > 75) riskScore = Math.max(riskScore, 2)
        else riskScore = Math.max(riskScore, 1)
      }

      const riskLevels = ['Indeterminado', 'Bajo', 'Moderado', 'Alto']
      return {
        ...dev,
        riskLevel: riskLevels[riskScore],
        criticalVar,
        conclusion: riskScore >= 3 
          ? 'Calidad del aire deficiente. Se recomienda limitar actividades al aire libre para grupos vulnerables.'
          : 'Calidad del aire dentro de niveles aceptables para la población general.'
      }
    })

    return report
  })
}
