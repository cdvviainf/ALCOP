import type { FastifyInstance } from 'fastify'
import { requireAdmin, requireAlguno, requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { obrasController } from './obras.controller.js'

const leerObras = requirePermiso('OBRAS', 'LECTURA')
const editarObras = requirePermiso('OBRAS', 'TOTAL')
// Las unidades de lote las lee también el inspector técnico (selector de hallazgos).
const leerUnidades = requireAlguno(['OBRAS', 'TEC_INSPECCION'], 'LECTURA')

/**
 * Rutas de Obras — raíz del núcleo (Docs/nucleo-compartido.md). Montadas bajo
 * /api/nucleo. Obra: lectura/escritura por la función OBRAS (Lectura/Total).
 * Titulares ("Permisos Obra"): solo Administrador (esAdmin).
 */
export default async function obrasRoutes(app: FastifyInstance) {
  // Lectura del listado: cualquier usuario autenticado (nucleo-compartido.md §95;
  // alimenta selectores de obra, p. ej. Nueva visita técnica — QA-OLA-B-005).
  app.get(
    '/obras',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar obras (paginado)' } },
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

  // Acceso de usuarios a la obra (pertenencia, sin rol) — solo Administrador.
  app.get(
    '/obras/:id/accesos',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Listar usuarios con acceso a la obra' } },
    obrasController.listarAccesos
  )
  app.post(
    '/obras/:id/accesos',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Conceder acceso a un usuario' } },
    obrasController.agregarAcceso
  )
  app.delete(
    '/obras/:id/accesos/:accesoId',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Revocar acceso de un usuario' } },
    obrasController.quitarAcceso
  )

  // Titulares por rol de la obra (notificaciones). Se eligen entre quienes tienen acceso.
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

  // Unidades de lote de la obra (autogeneradas; para el selector de hallazgos).
  app.get(
    '/obras/:id/unidades',
    { preHandler: [requireAuth, leerUnidades], schema: { tags: ['nucleo'], summary: 'Listar unidades de lote de la obra' } },
    obrasController.listarUnidades
  )

  // Formularios de control aplicables a la obra (derivado de la cadena de lotes).
  app.get(
    '/obras/:id/formularios-aplicables',
    { preHandler: [requireAuth, leerObras], schema: { tags: ['nucleo'], summary: 'Formularios de control aplicables a la obra' } },
    obrasController.formulariosAplicables
  )
}
