import type { FastifyInstance } from 'fastify'
import { requireAlguno, requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { procedimientosController } from './procedimientos.controller.js'

const leer = requirePermiso('PROCEDIMIENTOS', 'LECTURA')
const editar = requirePermiso('PROCEDIMIENTOS', 'TOTAL')
// El picker /opciones (proyección mínima, solo activos) alimenta el selector del
// maestro Tipos de Lote (TIPOS_LOTE): se abre a cualquiera de las dos funciones
// (QA-LP-008/010). El LISTADO del maestro sigue estricto bajo PROCEDIMIENTOS.
const leerOpciones = requireAlguno(['PROCEDIMIENTOS', 'TIPOS_LOTE'], 'LECTURA')

/**
 * Maestro de Procedimientos constructivos (Docs/lotes-procedimientos.md §5.2).
 * Montado bajo /api/nucleo. Función PROCEDIMIENTOS (Lectura/Total). El alta y el
 * reemplazo del PDF son multipart/form-data; el resto JSON.
 */
export default async function procedimientosRoutes(app: FastifyInstance) {
  app.get(
    '/procedimientos',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Listar procedimientos (paginado)' } },
    procedimientosController.listar
  )
  // Picker para el selector del maestro Tipos de Lote (solo activos, proyección mínima).
  app.get(
    '/procedimientos/opciones',
    { preHandler: [requireAuth, leerOpciones], schema: { tags: ['nucleo'], summary: 'Opciones de procedimiento (picker)' } },
    procedimientosController.listarOpciones
  )
  app.get(
    '/procedimientos/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Detalle de procedimiento' } },
    procedimientosController.obtener
  )
  app.get(
    '/procedimientos/:id/archivo',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Descargar el PDF del procedimiento' } },
    procedimientosController.descargarArchivo
  )
  app.post(
    '/procedimientos',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Crear procedimiento (multipart: metadatos + PDF)' } },
    procedimientosController.crear
  )
  app.patch(
    '/procedimientos/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Actualizar metadatos del procedimiento' } },
    procedimientosController.actualizar
  )
  app.put(
    '/procedimientos/:id/archivo',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Reemplazar el PDF del procedimiento' } },
    procedimientosController.reemplazarArchivo
  )
  app.delete(
    '/procedimientos/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Eliminar procedimiento (soft delete)' } },
    procedimientosController.eliminar
  )

  // Formularios de control vinculados (M:N).
  app.get(
    '/procedimientos/:id/formularios',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Formularios de control del procedimiento' } },
    procedimientosController.listarFormularios
  )
  app.post(
    '/procedimientos/:id/formularios',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Vincular formulario de control' } },
    procedimientosController.vincularFormulario
  )
  app.delete(
    '/procedimientos/:id/formularios/:formularioId',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Desvincular formulario de control' } },
    procedimientosController.desvincularFormulario
  )
}
