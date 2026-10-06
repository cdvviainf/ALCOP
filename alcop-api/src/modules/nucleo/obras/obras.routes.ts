import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth } from '../../../plugins/auth-guard.js'
import { obrasController } from './obras.controller.js'

/**
 * Rutas de Obras — raíz del núcleo (Docs/nucleo-compartido.md). Montadas bajo
 * /api/nucleo. Lectura: cualquier usuario activo. Escritura (obra y titulares):
 * Administrador (TOTAL en ambas áreas).
 */
export default async function obrasRoutes(app: FastifyInstance) {
  app.get(
    '/obras',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar obras (paginado)' } },
    obrasController.listar
  )
  app.get(
    '/obras/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de obra' } },
    obrasController.obtener
  )
  app.post(
    '/obras',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Crear obra' } },
    obrasController.crear
  )
  app.patch(
    '/obras/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Actualizar obra' } },
    obrasController.actualizar
  )
  app.delete(
    '/obras/:id',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Eliminar obra (soft delete)' } },
    obrasController.eliminar
  )

  // Titulares de la obra (absorbe el antiguo mantenedor "Asignaciones").
  app.get(
    '/obras/:id/titulares',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar titulares de la obra' } },
    obrasController.listarTitulares
  )
  app.post(
    '/obras/:id/titulares',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Asignar titular a la obra' } },
    obrasController.asignarTitular
  )
  app.delete(
    '/obras/:id/titulares/:titularId',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Quitar titular de la obra' } },
    obrasController.quitarTitular
  )
}
