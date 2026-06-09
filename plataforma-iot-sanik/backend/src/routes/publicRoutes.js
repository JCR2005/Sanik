export default async function publicRoutes(app) {

  // ── 1. LISTAR TODOS LOS DISPOSITIVOS PÚBLICOS CON COORDENADAS ──
  app.get('/devices', async (req, reply) => {
    try {
      const { rows } = await app.db.query(
        `SELECT id, name, lat, lng, description, 
                CASE WHEN last_seen > NOW() - INTERVAL '10 minutes' 
                     THEN 'online' ELSE 'offline' END as status
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

  // ── 2. OBTENER EL AQI Y MÉTRICAS EN TIEMPO REAL DE UN DISPOSITIVO ──
  app.get('/devices/:id/aqi', async (req, reply) => {
    const AQI_VARS = ['co', 'co2', 'nh3', 'nox', 'no2', 'o3', 'so2', 'pm25', 'pm10']
    const ALL_VARS = [...AQI_VARS, 'temperatura', 'temperature', 'humedad', 'humidity']

    try {
      const { rows: latestDots } = await app.db.query(
        `SELECT DISTINCT ON (variable) variable, value, time
         FROM dots
         WHERE device_id = $1::uuid AND variable = ANY($2) AND time > NOW() - INTERVAL '24 hours'
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
        variableScores[dot.variable] = { value: Number(dot.value), time: dot.time }

        if (AQI_VARS.includes(dot.variable)) {
          const { rows: [range] } = await app.db.query(
            `SELECT score, category, weight
             FROM air_quality_ranges
             WHERE variable_label = $1 AND min_value <= $2 AND (max_value IS NULL OR max_value > $2)
             LIMIT 1`,
            [dot.variable, dot.value]
          )
          if (range) {
            variableScores[dot.variable].score    = Number(range.score)
            variableScores[dot.variable].category = range.category
            totalScore  += Number(range.score) * Number(range.weight)
            totalWeight += Number(range.weight)
            hasAqiData = true
          }
        }
      }

      if (!hasAqiData) return { aqi: null, category: 'Sin datos', variables: variableScores }

      let weightedAQI = totalWeight > 0 ? totalScore / totalWeight : 0
      const scoredValues = Object.values(variableScores)
        .map(v => v.score)
        .filter(score => score !== undefined)
      const maxScore = scoredValues.length > 0 ? Math.max(...scoredValues) : 0
      let aqi = Math.round(weightedAQI * 0.7 + maxScore * 0.3)
      aqi = Math.max(0, Math.min(100, aqi))

      let category = 'Excelente'
      if      (aqi <= 20) category = 'Excelente'
      else if (aqi <= 40) category = 'Buena'
      else if (aqi <= 60) category = 'Precaución'
      else if (aqi <= 80) category = 'Mala'
      else                category = 'Peligrosa'

      return { aqi, category, variables: variableScores }

    } catch (err) {
      app.log.error(err)
      return reply.code(500).send({ error: 'Error al calcular el AQI público.' })
    }
  })

  // ── 3. RESUMEN COMPLETO DE UNA ZONA ─────────────────────────────────────────
  // GET /zones/aqi?ids=1,2,5
  //
  // Devuelve por cada dispositivo: AQI individual + últimas lecturas de clima.
  // A nivel zona devuelve promedios de todo.
  //
  // Respuesta:
  //   aqi_promedio   → promedio AQI de dispositivos con datos
  //   aqi_max        → peor AQI de la zona
  //   category       → categoría del promedio
  //   clima          → { temp_promedio, hum_promedio, co2_promedio, co_promedio }
  //   online_count   → dispositivos con datos
  //   total_count    → IDs recibidos
  //   devices        → [ { id, aqi, category, hasData, temp, hum, co2, co } ]
  // ────────────────────────────────────────────────────────────────────────────
  app.get('/zones/aqi', async (req, reply) => {
    const AQI_VARS   = ['co', 'co2', 'nh3', 'nox', 'no2', 'o3', 'so2', 'pm25', 'pm10']
    const CLIMA_VARS = ['temperatura', 'temperature', 'humedad', 'humidity', 'co2', 'co']
    const ALL_VARS   = [...new Set([...AQI_VARS, ...CLIMA_VARS])]

    const rawIds = req.query.ids
    if (!rawIds) {
      return reply.code(400).send({ error: 'Parámetro "ids" requerido. Ejemplo: ?ids=1,2,5' })
    }

    // Los IDs son UUIDs (strings) — NO usar parseInt
    const deviceIds = rawIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)

    if (!deviceIds.length) {
      return reply.code(400).send({ error: 'No se recibieron IDs válidos.' })
    }

    // Función auxiliar: extrae el valor numérico de una variable priorizando
    // el nombre en español sobre el inglés (ej: temperatura > temperature)
    const pickVar = (map, ...keys) => {
      for (const k of keys) {
        if (map[k] !== undefined) return Number(map[k])
      }
      return null
    }

    try {
      const deviceResults = await Promise.all(
        deviceIds.map(async (deviceId) => {
          try {
            const { rows: latestDots } = await app.db.query(
              `SELECT DISTINCT ON (variable) variable, value, time
               FROM dots
               WHERE device_id = $1::uuid AND variable = ANY($2) AND time > NOW() - INTERVAL '1 hour'
               ORDER BY variable, time DESC`,
              [deviceId, ALL_VARS]
            )

            if (!latestDots.length) {
              return { id: deviceId, aqi: null, category: 'Sin datos', hasData: false, temp: null, hum: null, co2: null, co: null }
            }

            // Mapa variable → valor
            const varMap = {}
            latestDots.forEach(d => { varMap[d.variable] = d.value })

            // ── Calcular AQI ────────────────────────────────────────────────
            let totalScore  = 0
            let totalWeight = 0
            let hasAqiData  = false
            const scores    = []

            for (const dot of latestDots) {
              if (!AQI_VARS.includes(dot.variable)) continue
              const { rows: [range] } = await app.db.query(
                `SELECT score, category, weight
                 FROM air_quality_ranges
                 WHERE variable_label = $1 AND min_value <= $2 AND (max_value IS NULL OR max_value > $2)
                 LIMIT 1`,
                [dot.variable, dot.value]
              )
              if (range) {
                totalScore  += Number(range.score) * Number(range.weight)
                totalWeight += Number(range.weight)
                scores.push(Number(range.score))
                hasAqiData = true
              }
            }

            // ── Variables de clima ──────────────────────────────────────────
            const temp = pickVar(varMap, 'temperatura', 'temperature')
            const hum  = pickVar(varMap, 'humedad',     'humidity')
            const co2  = pickVar(varMap, 'co2')
            const co   = pickVar(varMap, 'co')

            if (!hasAqiData) {
              return { id: deviceId, aqi: null, category: 'Sin datos', hasData: false, temp, hum, co2, co }
            }

            const weightedAQI = totalWeight > 0 ? totalScore / totalWeight : 0
            const maxScore    = scores.length > 0 ? Math.max(...scores) : 0
            let aqi = Math.round(weightedAQI * 0.7 + maxScore * 0.3)
            aqi = Math.max(0, Math.min(100, aqi))

            let category = 'Excelente'
            if      (aqi <= 20) category = 'Excelente'
            else if (aqi <= 40) category = 'Buena'
            else if (aqi <= 60) category = 'Precaución'
            else if (aqi <= 80) category = 'Mala'
            else                category = 'Peligrosa'

            return { id: deviceId, aqi, category, hasData: true, temp, hum, co2, co }

          } catch (_) {
            return { id: deviceId, aqi: null, category: 'Sin datos', hasData: false, temp: null, hum: null, co2: null, co: null }
          }
        })
      )

      // ── Agregar a nivel de zona ─────────────────────────────────────────────
      const withAqi   = deviceResults.filter(d => d.hasData && d.aqi !== null)
      const onlineCount = withAqi.length

      // Promedios de clima — solo dispositivos que tienen el valor
      const avg = (arr, key) => {
        const vals = arr.map(d => d[key]).filter(v => v !== null && v !== undefined)
        return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
      }

      const allWithClima = deviceResults.filter(d => d.temp !== null || d.hum !== null || d.co2 !== null || d.co !== null)

      const clima = {
        temp_promedio: avg(allWithClima, 'temp'),
        hum_promedio:  avg(allWithClima, 'hum'),
        co2_promedio:  avg(allWithClima, 'co2'),
        co_promedio:   avg(allWithClima, 'co'),
      }

      if (!onlineCount) {
        return {
          aqi_promedio:  null,
          aqi_max:       null,
          category:      'Sin datos',
          clima,
          online_count:  0,
          total_count:   deviceIds.length,
          devices:       deviceResults,
        }
      }

      const aqiValues   = withAqi.map(d => d.aqi)
      const aqiPromedio = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length)
      const aqiMax      = Math.max(...aqiValues)

      let category = 'Excelente'
      if      (aqiPromedio <= 20) category = 'Excelente'
      else if (aqiPromedio <= 40) category = 'Buena'
      else if (aqiPromedio <= 60) category = 'Precaución'
      else if (aqiPromedio <= 80) category = 'Mala'
      else                        category = 'Peligrosa'

      return {
        aqi_promedio: aqiPromedio,
        aqi_max:      aqiMax,
        category,
        clima,
        online_count:  onlineCount,
        total_count:   deviceIds.length,
        devices:       deviceResults,
      }

    } catch (err) {
      app.log.error(err)
      return reply.code(500).send({ error: 'Error al calcular el resumen de la zona.' })
    }
  })
}