import { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'

/**
 * CORS. El origen permitido se controla por env (CORS_ORIGIN) — por defecto
 * el frontend alcop-web en http://localhost:3010.
 */
export async function registerCors(app: FastifyInstance) {
  await app.register(import('@fastify/cors'), {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  })
}
