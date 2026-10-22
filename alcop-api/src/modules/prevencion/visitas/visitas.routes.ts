import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { visitasController } from './visitas.controller.js'

const leer = requirePermiso('PREV_INSPECCION', 'LECTURA')
const editar = requirePermiso('PREV_INSPECCION', 'TOTAL')

/**
 * Visitas de Prevención (Docs/prevencion.md). Montadas bajo /api/prevencion.
 * Lectura/escritura por la función PREV_INSPECCION. Las fotos van en el alta del
 * hallazgo (multipart); la descarga streamea el binario desde la BD.
 */
export default async function visitasPrevencionRoutes(app: FastifyInstance) {
  app.get(
    '/visitas',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Listar visitas (paginado, filtros y orden)' } },
    visitasController.listar
  )
  app.get(
    '/visitas/inspectores',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Inspectores con visitas (para filtro)' } },
    visitasController.listarInspectores
  )
  app.get(
    '/visitas/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Detalle de visita (con hallazgos)' } },
    visitasController.obtener
  )
  app.get(
    '/visitas/:id/reporte.pdf',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Reporte de la visita (HTML→PDF)' } },
    visitasController.reportePdf
  )
  app.post(
    '/visitas',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Crear visita' } },
    visitasController.crear
  )
  app.patch(
    '/visitas/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Actualizar visita (EN_CURSO)' } },
    visitasController.actualizar
  )
  app.post(
    '/visitas/:id/finalizar',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Finalizar visita' } },
    visitasController.finalizar
  )
  app.delete(
    '/visitas/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Eliminar visita (soft delete)' } },
    visitasController.eliminar
  )

  // Hallazgos (sub-recurso de la visita). El alta es multipart (campos + fotos).
  app.post(
    '/visitas/:id/hallazgos',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Agregar hallazgo (multipart: campos + fotos)' } },
    visitasController.agregarHallazgo
  )
  app.patch(
    '/visitas/:id/hallazgos/:hallazgoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Actualizar hallazgo' } },
    visitasController.actualizarHallazgo
  )
  app.delete(
    '/visitas/:id/hallazgos/:hallazgoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Quitar hallazgo' } },
    visitasController.quitarHallazgo
  )

  // Fotos (sub-recurso del hallazgo).
  app.post(
    '/hallazgos/:hallazgoId/fotos',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Subir foto adicional (multipart)' } },
    visitasController.agregarFoto
  )
  app.get(
    '/fotos/:fotoId',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Descargar la imagen de una foto' } },
    visitasController.descargarFoto
  )
  app.delete(
    '/fotos/:fotoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Quitar foto' } },
    visitasController.quitarFoto
  )
}
