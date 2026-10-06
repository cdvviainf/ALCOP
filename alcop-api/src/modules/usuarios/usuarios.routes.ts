import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth } from '../../plugins/auth-guard.js'
import { usuariosController } from './usuarios.controller.js'

/**
 * Rutas de Usuarios. Montadas bajo /api/usuarios (ver server.ts).
 * `/me` lo usa cualquier usuario autenticado; el CRUD lo opera el Administrador
 * (TOTAL en ambas áreas). El alta pública está deshabilitada (ver server.ts).
 */
export default async function usuariosRoutes(app: FastifyInstance) {
  app.get(
    '/me',
    { preHandler: [requireAuth], schema: { tags: ['usuarios'], summary: 'Perfil del usuario de la sesión' } },
    usuariosController.me
  )
  app.get(
    '/',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['usuarios'], summary: 'Listar usuarios (paginado)' } },
    usuariosController.listar
  )
  app.get(
    '/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['usuarios'], summary: 'Detalle de usuario' } },
    usuariosController.obtener
  )
  app.post(
    '/',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['usuarios'], summary: 'Crear usuario (alta por admin)' } },
    usuariosController.crear
  )
  app.patch(
    '/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['usuarios'], summary: 'Actualizar usuario' } },
    usuariosController.actualizar
  )
  app.delete(
    '/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['usuarios'], summary: 'Eliminar usuario (soft delete)' } },
    usuariosController.eliminar
  )
}
