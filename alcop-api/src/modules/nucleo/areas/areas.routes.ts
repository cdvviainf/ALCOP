import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../plugins/auth-guard.js'
import { areasController } from './areas.controller.js'

/**
 * Áreas — catálogo fijo de 2 filas (Prevención, Técnica). Solo lectura: llena
 * selects (p. ej. el alta de CategoriaFormulario). Montado bajo /api/nucleo.
 */
export default async function areasRoutes(app: FastifyInstance) {
  app.get(
    '/areas',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar áreas' } },
    areasController.listar
  )
}
