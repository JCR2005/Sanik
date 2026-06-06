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
}