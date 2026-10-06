import 'dotenv/config' // carga .env en desarrollo local; no-op en Docker/prod (env inyectada por el entorno)
import Fastify from 'fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from './config/env.js'
import { auth } from './lib/auth.js'
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

// ─── Better Auth ────────────────────────────────────────────────────────────
// Better Auth necesita el body crudo; el resto de la API usa JSON parseado.
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  if (req.url?.startsWith('/api/auth')) {
    done(null, body)
    return
  }
  try {
    done(null, body.length ? JSON.parse(body.toString('utf8')) : undefined)
  } catch (err) {
    done(err as Error, undefined)
  }
})

// Construye el Request web estándar que espera Better Auth desde el request Fastify.
function construirWebRequest(req: FastifyRequest): Request {
  const protocol = req.protocol ?? 'http'
  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.url, `${protocol}://${host}`)

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue
    if (Array.isArray(val)) for (const v of val) headers.append(key, v)
    else headers.set(key, val)
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody && req.body instanceof Buffer ? req.body : undefined
  return new Request(url, { method: req.method, headers, body })
}

// Puente Fastify → Better Auth (handler web estándar).
async function forwardToBetterAuth(req: FastifyRequest, reply: FastifyReply) {
  const webRes = await auth.handler(construirWebRequest(req))
  reply.status(webRes.status)
  webRes.headers.forEach((value, key) => reply.header(key, value))
  return reply.send(await webRes.text())
}

// El registro público está deshabilitado: el alta de usuarios la hace un
// administrador. Debe declararse ANTES del catch-all app.all('/api/auth/*').
app.post('/api/auth/sign-up/email', async (_req, reply) => {
  reply.status(403).send({
    error: {
      code: 'REGISTRATION_DISABLED',
      message: 'El registro público está deshabilitado. El alta de usuarios la realiza un administrador.',
    },
  })
})

app.all('/api/auth/*', forwardToBetterAuth)

// Rutas
await app.register(import('./modules/health/health.routes.js'))
await app.register(import('./modules/usuarios/usuarios.routes.js'), { prefix: '/api/usuarios' })
await app.register(import('./modules/nucleo/obras/obras.routes.js'), { prefix: '/api/nucleo' })
await app.register(import('./modules/nucleo/areas/areas.routes.js'), { prefix: '/api/nucleo' })
await app.register(import('./modules/nucleo/perfiles/perfiles.routes.js'), { prefix: '/api/nucleo' })
await app.register(import('./modules/nucleo/categorias-formulario/categorias-formulario.routes.js'), {
  prefix: '/api/nucleo',
})
await app.register(import('./modules/nucleo/usuario-obras/usuario-obras.routes.js'), {
  prefix: '/api/nucleo',
})
await app.register(import('./modules/prevencion/niveles-riesgo/niveles-riesgo.routes.js'), {
  prefix: '/api/prevencion',
})
await app.register(import('./modules/tecnica/tipos-hallazgo/tipos-hallazgo.routes.js'), {
  prefix: '/api/tecnica',
})
await app.register(import('./modules/tecnica/etapas-constructivas/etapas-constructivas.routes.js'), {
  prefix: '/api/tecnica',
})
await app.register(import('./modules/tecnica/etapas-nido/etapas-nido.routes.js'), {
  prefix: '/api/tecnica',
})

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`ALCOP API corriendo en http://localhost:${env.PORT} (docs en /docs)`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
