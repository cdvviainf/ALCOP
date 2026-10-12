import type { FastifyInstance } from 'fastify'
import { requireAlguno, requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { tiposLoteController } from './tipos-lote.controller.js'

const leer = requirePermiso('TIPOS_LOTE', 'LECTURA')
const editar = requirePermiso('TIPOS_LOTE', 'TOTAL')
// El picker /opciones (proyección mínima, solo activos) alimenta el selector de
// la pantalla Lotes de Obra (OBRAS): se abre a cualquiera de las dos funciones
// (QA-LP-008/010). El LISTADO del maestro sigue estricto bajo TIPOS_LOTE.
const leerOpciones = requireAlguno(['TIPOS_LOTE', 'OBRAS'], 'LECTURA')

/**
 * Maestro de Tipos de Lote (Docs/lotes-procedimientos.md §5.1). Montado bajo
 * /api/nucleo. Función TIPOS_LOTE (Lectura/Total). Incluye la vinculación M:N
 * con procedimientos.
 */
export default async function tiposLoteRoutes(app: FastifyInstance) {
  app.get(
    '/tipos-lote',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Listar tipos de lote (paginado)' } },
    tiposLoteController.listar
  )
  // Picker para el selector de Lotes de Obra (solo activos, proyección mínima).
  app.get(
    '/tipos-lote/opciones',
    { preHandler: [requireAuth, leerOpciones], schema: { tags: ['nucleo'], summary: 'Opciones de tipo de lote (picker)' } },
    tiposLoteController.listarOpciones
  )
  app.get(
    '/tipos-lote/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Detalle de tipo de lote' } },
    tiposLoteController.obtener
  )
  app.post(
    '/tipos-lote',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Crear tipo de lote' } },
    tiposLoteController.crear
  )
  app.patch(
    '/tipos-lote/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Actualizar tipo de lote' } },
    tiposLoteController.actualizar
  )
  app.delete(
    '/tipos-lote/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Eliminar tipo de lote (soft delete)' } },
    tiposLoteController.eliminar
  )

  // Procedimientos vinculados al tipo de lote (M:N).
  app.get(
    '/tipos-lote/:id/procedimientos',
    { preHandler: [requireAuth, leer], schema: { tags: ['nucleo'], summary: 'Procedimientos del tipo de lote' } },
    tiposLoteController.listarProcedimientos
  )
  app.post(
    '/tipos-lote/:id/procedimientos',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Vincular procedimiento al tipo de lote' } },
    tiposLoteController.vincularProcedimiento
  )
  app.delete(
    '/tipos-lote/:id/procedimientos/:procedimientoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['nucleo'], summary: 'Desvincular procedimiento del tipo de lote' } },
    tiposLoteController.desvincularProcedimiento
  )
}
