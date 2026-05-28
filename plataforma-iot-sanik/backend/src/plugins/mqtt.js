import fp from 'fastify-plugin'
import mqtt from 'mqtt'

async function mqttPlugin(app) {
  const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST || 'localhost'}:${process.env.MQTT_PORT || 1883}`)

  client.on('connect', () => {
    app.log.info('✅ Conectado al broker MQTT (EMQX)')
    // Escuchar datos de TODOS los dispositivos
    client.subscribe('/v1/devices/+/data', { qos: 1 })
  })

  client.on('error', (err) => {
    app.log.error('❌ Error MQTT:', err.message)
  })

  // Cuando llega un dato del ESP32
  client.on('message', async (topic, message) => {
    try {
      // topic ejemplo: /v1/devices/TOKEN_DEL_DEVICE/data
      const parts = topic.split('/')
      const deviceToken = parts[3]
      const payload = JSON.parse(message.toString())

      // Buscar el dispositivo por token
      const { rows } = await app.db.query(
        'SELECT id FROM devices WHERE token = $1',
        [deviceToken]
      )

      if (!rows.length) {
        app.log.warn(`Token desconocido: ${deviceToken}`)
        return
      }

      const deviceId = rows[0].id
      const now = new Date()

      // Guardar cada variable en TimescaleDB
      for (const [variable, value] of Object.entries(payload)) {
        if (typeof value !== 'number') continue

        await app.db.query(
          'INSERT INTO dots (time, device_id, variable, value) VALUES ($1, $2, $3, $4)',
          [now, deviceId, variable, value]
        )

        // Actualizar último valor en Redis (para tiempo real)
        await app.redis.set(
          `last:${deviceId}:${variable}`,
          JSON.stringify({ value, time: now }),
          { EX: 86400 } // expira en 24 horas
        )

        // Actualizar last_value en la tabla variables
        await app.db.query(`
          UPDATE variables
          SET last_value = $1, last_time = $2
          WHERE device_id = $3 AND label = $4
        `, [value, now, deviceId, variable])
      }

      // Actualizar last_seen del dispositivo
      await app.db.query(
        'UPDATE devices SET last_seen = $1 WHERE id = $2',
        [now, deviceId]
      )

      app.log.info(`📡 Datos guardados — device: ${deviceId}`)

    } catch (err) {
      app.log.error('Error procesando mensaje MQTT:', err.message)
    }
  })

  app.decorate('mqtt', client)

  app.addHook('onClose', async () => {
    client.end()
  })
}

export default fp(mqttPlugin)
