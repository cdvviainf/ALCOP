import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../plugins/auth-guard.js'
import { usuariosController } from './usuarios.controller.js'

/**
 * Rutas de Usuarios. Montadas bajo el prefijo /api/usuarios (ver server.ts).
 */
export default async function usuariosRoutes(app: FastifyInstance) {
  app.get(
    '/me',
    { preHandler: [requireAuth], schema: { tags: ['usuarios'], summary: 'Perfil del usuario de la sesión' } },
    usuariosController.me
  )
}
