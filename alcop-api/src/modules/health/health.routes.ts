import { FastifyInstance } from 'fastify'

/**
 * Health check para monitoreo / orquestación (Docker healthcheck, uptime).
 * GET /health → { status: "ok" }
 */
export default async function healthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Estado del servicio',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
            },
          },
        },
      },
    },
    async () => {
      return { status: 'ok' }
    }
  )
}
