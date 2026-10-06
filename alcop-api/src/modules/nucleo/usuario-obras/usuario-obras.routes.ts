import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth } from '../../../plugins/auth-guard.js'
import { usuarioObrasController } from './usuario-obras.controller.js'

/**
 * Rutas de UsuarioObra — asignación titular por rol por obra. Bajo /api/nucleo.
 * La operan Administradores (usuarios-perfiles.md §5). Reemplazar titular =
 * POST idempotente por (obraId, rolObra).
 */
export default async function usuarioObrasRoutes(app: FastifyInstance) {
  app.get(
    '/usuario-obras',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Listar asignaciones (filtra por obraId)' } },
    usuarioObrasController.listar
  )
  app.post(
    '/usuario-obras',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Asignar/reemplazar titular de un rol en una obra' } },
    usuarioObrasController.asignar
  )
  app.delete(
    '/usuario-obras/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Quitar asignación' } },
    usuarioObrasController.eliminar
  )
}
