import 'dotenv/config' // carga .env en desarrollo local; no-op en Docker/prod (env inyectada por el entorno)
import Fastify from 'fastify'
import { env } from './config/env.js'
import { errorHandler } from './plugins/error-handler.js'
import { registerCors } from './plugins/cors.plugin.js'
import { registerSwagger } from './plugins/swagger.plugin.js'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// Plugins base
await registerCors(app)
await app.register(import('@fastify/helmet'), {
  // Swagger UI necesita estilos/scripts inline; relajamos CSP solo en dev.
  contentSecurityPolicy: env.NODE_ENV === 'production',
})
await registerSwagger(app)
await errorHandler(app)

// Rutas
await app.register(import('./modules/health/health.routes.js'))
// await app.register(import('./plugins/auth.plugin.js'))  // TODO: Better Auth (stub por ahora)
// await app.register(import('./modules/auth/auth.routes.js'), { prefix: '/api/auth' })

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`ALCOP API corriendo en http://localhost:${env.PORT} (docs en /docs)`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
