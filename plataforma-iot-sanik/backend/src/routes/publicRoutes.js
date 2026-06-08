import { calculateRespiratoryRisk } from '../utils/reportCalculations.js'
import { analyzeEnvironmentalImpact } from '../utils/environmentalAnalysis.js'

export default async function publicRoutes(app) {

  // ── 1. LISTAR TODOS LOS DISPOSITIVOS PÚBLICOS CON COORDENADAS ──
  app.get('/devices', async (req, reply) => {
    try {
      const { rows } = await app.db.query(
        `SELECT id, name, lat, lng, description, status 
         FROM devices 
         WHERE lat IS NOT NULL AND lng IS NOT NULL
         ORDER BY name ASC`
      )
      return rows
    } catch (err) {
      app.log.error(err)
      return reply.code(500).send({ error: 'Error interno al obtener los dispositivos públicos.' })
    }
  })

  // ── 2. OBTENER EL AQI Y MÉTRICAS EN TIEMPO REAL ──
  app.get('/devices/:id/aqi', async (req, reply) => {
    // ... (existing implementation)
    // Variables exclusivas para la fórmula del AQI
    const AQI_VARS = ['co', 'co2', 'nh3', 'nox', 'no2', 'o3', 'so2', 'pm25', 'pm10']
    // Arreglo completo que incluye métricas meteorológicas
    const ALL_VARS = [...AQI_VARS, 'temperatura', 'temperature', 'humedad', 'humidity']

    try {
      // Ampliamos el margen a 24 horas para dar tolerancia al retraso de envío del hardware
      const { rows: latestDots } = await app.db.query(
        `SELECT DISTINCT ON (variable) variable, value, time
         FROM dots
         WHERE device_id = $1 AND variable = ANY($2) AND time > NOW() - INTERVAL '24 hours'
         ORDER BY variable, time DESC`,
        [req.params.id, ALL_VARS]
      )

      if (!latestDots.length) {
        return { aqi: null, category: 'Sin datos', variables: {} }
      }

      const variableScores = {}
      let totalScore = 0
      let totalWeight = 0
      let hasAqiData = false

      for (const dot of latestDots) {
        // Almacenamos el valor en tiempo real para TODAS las variables
        variableScores[dot.variable] = {
          value: Number(dot.value),
          time: dot.time
        }

        // Solo calculamos el rango de AQI si pertenece a los gases contaminantes
        if (AQI_VARS.includes(dot.variable)) {
          const { rows: [range] } = await app.db.query(
            `SELECT score, category, weight
             FROM air_quality_ranges
             WHERE variable_label = $1 AND min_value <= $2 AND (max_value IS NULL OR max_value > $2)
             LIMIT 1`,
            [dot.variable, dot.value]
          )

          if (range) {
            variableScores[dot.variable].score = Number(range.score)
            variableScores[dot.variable].category = range.category
            
            totalScore += Number(range.score) * Number(range.weight)
            totalWeight += Number(range.weight)
            hasAqiData = true
          }
        }
      }

      // Si el dispositivo solo tiene datos de clima pero no de AQI
      if (!hasAqiData) {
        return { aqi: null, category: 'Sin datos', variables: variableScores }
      }

      let weightedAQI = totalWeight > 0 ? totalScore / totalWeight : 0
      
      // Filtramos únicamente los scores válidos para evitar generar un NaN
      const scoredValues = Object.values(variableScores)
        .map(v => v.score)
        .filter(score => score !== undefined)

      const maxScore = scoredValues.length > 0 ? Math.max(...scoredValues) : 0
      let aqi = Math.round(weightedAQI * 0.7 + maxScore * 0.3)
      aqi = Math.max(0, Math.min(100, aqi))

      let category = 'Excelente'
      if (aqi <= 20) category = 'Excelente'
      else if (aqi <= 40) category = 'Buena'
      else if (aqi <= 60) category = 'Precaución'
      else if (aqi <= 80) category = 'Mala'
      else category = 'Peligrosa'

      return { aqi, category, variables: variableScores }

    } catch (err) {
      app.log.error(err)
      return reply.code(500).send({ error: 'Error al calcular el AQI público.' })
    }
  })

  // ── 3. REPORTES GLOBALES PÚBLICOS ──
  
  // Estadísticas globales
  app.get('/reports/stats', async () => {
    const { rows: [stats] } = await app.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE slug != 'sanik-internal') as total_clients,
        (SELECT COUNT(*) FROM devices) as total_devices,
        (SELECT COUNT(*) FROM devices WHERE last_seen > NOW() - INTERVAL '5 minutes') as active_devices,
        (SELECT COUNT(*) FROM requests WHERE status = 'pending') as pending_requests
    `)
    return stats
  })

  // Heatmap global
  app.get('/reports/heatmap', async (req) => {
    let { start, end } = req.query
    let query = `
      SELECT 
        d.id, d.name, d.lat, d.lng, 
        AVG(CASE WHEN dot.variable IN ('temperatura', 'temperature') THEN dot.value END) as avg_temp,
        AVG(CASE WHEN dot.variable IN ('humedad', 'humidity') THEN dot.value END) as avg_hum,
        MAX(CASE WHEN dot.variable IN ('temperatura', 'temperature') THEN dot.value END) as max_temp,
        MIN(CASE WHEN dot.variable IN ('temperatura', 'temperature') THEN dot.value END) as min_temp
      FROM devices d
      JOIN dots dot ON dot.device_id = d.id
      WHERE dot.variable IN ('temperatura', 'temperature', 'humedad', 'humidity')
    `
    const params = []
    let i = 1
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

  // Riesgo respiratorio global
  app.get('/reports/respiratory-risk', async (req) => {
    let { start, end } = req.query
    const targetVars = ['pm25', 'pm10', 'so2', 'nox', 'o3', 'temperatura', 'temperature', 'humedad', 'humidity']
    let query = `
      SELECT 
        d.id, d.name, dot.variable,
        AVG(dot.value) as avg_value,
        MAX(dot.value) as max_value,
        COUNT(*) as samples
      FROM devices d
      JOIN dots dot ON dot.device_id = d.id
      WHERE dot.variable = ANY($1)
    `
    const params = [targetVars]
    let i = 2
    if (start) {
      query += ` AND dot.time >= $${i++}`
      params.push(start)
    }
    if (end) {
      query += ` AND dot.time <= $${i++}`
      params.push(end)
    }
    query += ` GROUP BY d.id, d.name, dot.variable`
    const { rows } = await app.db.query(query, params)
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
    return calculateRespiratoryRisk(devices)
    })

    // Reporte de contaminación ambiental global
    app.get('/reports/environmental', async (req) => {
    let { start, end } = req.query
    const targetVars = ['pm25', 'pm10', 'co', 'o3', 'so2', 'nox', 'h2s']
    let query = `
      SELECT 
        d.id, d.name, d.lat, d.lng, dot.variable,
        AVG(dot.value) as avg_value
      FROM devices d
      JOIN dots dot ON dot.device_id = d.id
      WHERE dot.variable = ANY($1)
    `
    const params = [targetVars]
    let i = 2
    if (start) {
      query += ` AND dot.time >= $${i++}`
      params.push(start)
    }
    if (end) {
      query += ` AND dot.time <= $${i++}`
      params.push(end)
    }
    query += ` GROUP BY d.id, d.name, d.lat, d.lng, dot.variable`
    const { rows } = await app.db.query(query, params)

    const devices = {}
    rows.forEach(row => {
      if (!devices[row.id]) {
        devices[row.id] = { id: row.id, name: row.name, lat: row.lat, lng: row.lng, variables: {} }
      }
      devices[row.id].variables[row.variable] = {
        avg: parseFloat(row.avg_value)
      }
    })
    return analyzeEnvironmentalImpact(devices)
    })
    }