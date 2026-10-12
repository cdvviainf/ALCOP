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

  // Lotes de la obra (Docs/lotes-procedimientos.md §5.3) — gobernados por la
  // función OBRAS (Lectura para ver, Total para configurar).
  app.get(
    '/obras/:id/lotes',
    { preHandler: [requireAuth, leerObras], schema: { tags: ['nucleo'], summary: 'Listar lotes de la obra' } },
    obrasController.listarLotes
  )
  app.post(
    '/obras/:id/lotes',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Agregar lote a la obra' } },
    obrasController.agregarLote
  )
  app.patch(
    '/obras/:id/lotes/:loteId',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Actualizar cantidad de un lote' } },
    obrasController.actualizarLote
  )
  app.delete(
    '/obras/:id/lotes/:loteId',
    { preHandler: [requireAuth, editarObras], schema: { tags: ['nucleo'], summary: 'Quitar lote de la obra' } },
    obrasController.quitarLote
  )

  // Formularios de control aplicables a la obra (derivado de la cadena de lotes).
  app.get(
    '/obras/:id/formularios-aplicables',
    { preHandler: [requireAuth, leerObras], schema: { tags: ['nucleo'], summary: 'Formularios de control aplicables a la obra' } },
    obrasController.formulariosAplicables
  )
}
