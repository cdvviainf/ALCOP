import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth } from '../../../plugins/auth-guard.js'
import { funcionesController } from './funciones.controller.js'

/**
 * Catálogo de Funciones — solo lectura, alimenta el editor de Perfiles.
 * Montado bajo /api/nucleo. Config de Accesos → solo Administrador.
 */
export default async function funcionesRoutes(app: FastifyInstance) {
  app.get(
    '/funciones',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Listar funciones' } },
    funcionesController.listar
  )
}
