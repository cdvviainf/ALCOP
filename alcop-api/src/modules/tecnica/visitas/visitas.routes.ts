import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { visitasController } from './visitas.controller.js'

const leer = requirePermiso('TEC_INSPECCION', 'LECTURA')
const editar = requirePermiso('TEC_INSPECCION', 'TOTAL')

/**
 * Visitas Técnicas (Docs/tecnica.md). Montadas bajo /api/tecnica. Lectura/escritura
 * por la función TEC_INSPECCION. La foto se sube como multipart; la descarga
 * streamea el binario desde la BD.
 */
export default async function visitasRoutes(app: FastifyInstance) {
  app.get(
    '/visitas',
    { preHandler: [requireAuth, leer], schema: { tags: ['tecnica'], summary: 'Listar visitas (paginado, filtros y orden)' } },
    visitasController.listar
  )
  app.get(
    '/visitas/inspectores',
    { preHandler: [requireAuth, leer], schema: { tags: ['tecnica'], summary: 'Inspectores con visitas (para filtro)' } },
    visitasController.listarInspectores
  )
  app.get(
    '/visitas/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['tecnica'], summary: 'Detalle de visita (con hallazgos)' } },
    visitasController.obtener
  )
  app.get(
    '/visitas/:id/reporte.pdf',
    { preHandler: [requireAuth, leer], schema: { tags: ['tecnica'], summary: 'Reporte de la visita (HTML→PDF)' } },
    visitasController.reportePdf
  )
  app.post(
    '/visitas',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Crear visita' } },
    visitasController.crear
  )
  app.patch(
    '/visitas/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Actualizar visita (EN_CURSO)' } },
    visitasController.actualizar
  )
  app.post(
    '/visitas/:id/finalizar',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Finalizar visita' } },
    visitasController.finalizar
  )
  app.delete(
    '/visitas/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Eliminar visita (soft delete)' } },
    visitasController.eliminar
  )

  // Hallazgos (sub-recurso de la visita).
  app.post(
    '/visitas/:id/hallazgos',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Agregar hallazgo' } },
    visitasController.agregarHallazgo
  )
  app.patch(
    '/visitas/:id/hallazgos/:hallazgoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Actualizar hallazgo' } },
    visitasController.actualizarHallazgo
  )
  app.delete(
    '/visitas/:id/hallazgos/:hallazgoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Quitar hallazgo' } },
    visitasController.quitarHallazgo
  )

  // Fotos (sub-recurso del hallazgo).
  app.post(
    '/hallazgos/:hallazgoId/fotos',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Subir foto (multipart; se optimiza y guarda en BD)' } },
    visitasController.agregarFoto
  )
  app.get(
    '/fotos/:fotoId',
    { preHandler: [requireAuth, leer], schema: { tags: ['tecnica'], summary: 'Descargar la imagen de una foto' } },
    visitasController.descargarFoto
  )
  app.delete(
    '/fotos/:fotoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['tecnica'], summary: 'Quitar foto' } },
    visitasController.quitarFoto
  )
}
