import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import 'dotenv/config'

import dbPlugin    from './plugins/db.js'
import redisPlugin from './plugins/redis.js'
import mqttPlugin  from './plugins/mqtt.js'

import authRoutes          from './routes/auth.js'
import devicesRoutes       from './routes/devices.js'
import variablesRoutes     from './routes/variables.js'
import dotsRoutes          from './routes/dots.js'
import alertsRoutes        from './routes/alerts.js'
import organizationsRoutes from './routes/organizations.js'
import paymentsRoutes      from './routes/payments.js'
import requestsRoutes      from './routes/requests.js'
import incidentsRoutes     from './routes/incidents.js'
import reportsRoutes       from './routes/reports.js'

const app = Fastify({ logger: true })

// ── Plugins globales ──────────────────────────
await app.register(cors, { 
  origin: [
    'https://voluble-creponne-e6c74f.netlify.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: true
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'sanik_secret_key'
})

// Decorador de autenticación
app.decorate('authenticate', async function (req, reply) {
  try {
    await req.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'No autorizado' })
  }
})

await app.register(websocket)

// ── Servicios ──────────────────────────────────
await app.register(dbPlugin)
await app.register(redisPlugin)
await app.register(mqttPlugin)

// ── Rutas ──────────────────────────────────────
await app.register(authRoutes,          { prefix: '/api/auth' })
await app.register(devicesRoutes,       { prefix: '/api/devices' })
await app.register(variablesRoutes,     { prefix: '/api/variables' })
await app.register(dotsRoutes,          { prefix: '/api/dots' })
await app.register(alertsRoutes,        { prefix: '/api/alerts' })
await app.register(organizationsRoutes, { prefix: '/api/organizations' })
await app.register(paymentsRoutes,      { prefix: '/api/payments' })
await app.register(requestsRoutes,      { prefix: '/api/requests' })
await app.register(incidentsRoutes,     { prefix: '/api/incidents' })
await app.register(reportsRoutes,       { prefix: '/api/reports' })

// ── WebSocket tiempo real ──────────────────────
app.get('/ws', { websocket: true }, (socket) => {
  app.log.info('Cliente WebSocket conectado')
  socket.on('message', (msg) => socket.send(`echo: ${msg}`))
})

// ── Healthcheck ────────────────────────────────
app.get('/health', () => ({ status: 'ok', service: 'sanik-backend', version: '2.0' }))

// ── Arrancar ───────────────────────────────────
try {
  await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}