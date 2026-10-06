import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth } from '../../../plugins/auth-guard.js'
import { perfilesController } from './perfiles.controller.js'

/**
 * Rutas de Perfiles — config de núcleo. Montadas bajo /api/nucleo (ver server.ts).
 * Lectura: cualquier usuario activo (alimenta selects de perfil). Escritura:
 * Administrador (TOTAL en ambas áreas) — Docs/plan-mantenedores.md §0.
 */
export default async function perfilesRoutes(app: FastifyInstance) {
  app.get(
    '/perfiles',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar perfiles (paginado)' } },
    perfilesController.listar
  )
  app.get(
    '/perfiles/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de perfil' } },
    perfilesController.obtener
  )
  app.post(
    '/perfiles',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Crear perfil' } },
    perfilesController.crear
  )
  app.patch(
    '/perfiles/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Actualizar perfil' } },
    perfilesController.actualizar
  )
  app.delete(
    '/perfiles/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Eliminar perfil (soft delete)' } },
    perfilesController.eliminar
  )
}
