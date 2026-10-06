import type { FastifyInstance } from 'fastify'
import { prisma } from '../../../lib/prisma.js'
import { requireAuth } from '../../../plugins/auth-guard.js'

/**
 * Áreas — catálogo fijo de 2 filas (Prevención, Técnica). Solo lectura: llena
 * selects (p. ej. el alta de CategoriaFormulario). Montado bajo /api/nucleo.
 */
export default async function areasRoutes(app: FastifyInstance) {
  app.get(
    '/areas',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar áreas' } },
    async (_request, reply) => {
      const areas = await prisma.area.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, codigo: true, nombre: true },
      })
      return reply.send({ data: areas })
    }
  )
}
