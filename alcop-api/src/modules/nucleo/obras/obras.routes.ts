import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { obrasController } from './obras.controller.js'

const leerObras = requirePermiso('OBRAS', 'LECTURA')
const editarObras = requirePermiso('OBRAS', 'TOTAL')

/**
 * Rutas de Obras — raíz del núcleo (Docs/nucleo-compartido.md). Montadas bajo
 * /api/nucleo. Obra: lectura/escritura por la función OBRAS (Lectura/Total).
 * Titulares ("Permisos Obra"): solo Administrador (esAdmin).
 */
export default async function obrasRoutes(app: FastifyInstance) {
  app.get(
    '/obras',
    { preHandler: [requireAuth, leerObras], schema: { tags: ['nucleo'], summary: 'Listar obras (paginado)' } },
    obrasController.listar
  )
  app.get(
    '/obras/:id',
    { preHandler: [requireAuth, leerObras], schema: { tags: ['nucleo'], summary: 'Detalle de obra' } },
    obrasController.obtener
  )
  app.post(
    '/obras',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Crear obra' } },
    obrasController.crear
  )
  app.patch(
    '/obras/:id',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Actualizar obra' } },
    obrasController.actualizar
  )
  app.delete(
    '/obras/:id',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Eliminar obra (soft delete)' } },
    obrasController.eliminar
  )

  // Titulares de la obra (absorbe el antiguo mantenedor "Asignaciones").
  app.get(
    '/obras/:id/titulares',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Listar titulares de la obra' } },
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
