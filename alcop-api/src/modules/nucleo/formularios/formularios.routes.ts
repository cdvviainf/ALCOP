import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { formulariosController } from './formularios.controller.js'

/**
 * Motor de Formularios (plantillas) — Docs/formularios-dinamicos.md. Montado bajo
 * /api/nucleo. Lectura/escritura del MAESTRO: autorización por Área del formulario
 * (PREV_FORMULARIOS / TEC_FORMULARIOS), validada dinámicamente en el service
 * (igual que Categorías). El picker /opciones es TRANSVERSAL y alimenta el
 * selector de Procedimientos (gateado por PROCEDIMIENTOS:LECTURA).
 */
const leerOpciones = requirePermiso('PROCEDIMIENTOS', 'LECTURA')

export default async function formulariosRoutes(app: FastifyInstance) {
  app.get(
    '/formularios',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar formularios (maestro, por área accesible)' } },
    formulariosController.listar
  )
  // Picker transversal para vincular formularios a un procedimiento (solo activos).
  app.get(
    '/formularios/opciones',
    { preHandler: [requireAuth, leerOpciones], schema: { tags: ['nucleo'], summary: 'Opciones de formulario (picker)' } },
    formulariosController.opciones
  )
  app.get(
    '/formularios/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de formulario (con preguntas)' } },
    formulariosController.obtener
  )
  app.post(
    '/formularios',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Crear formulario' } },
    formulariosController.crear
  )
  app.patch(
    '/formularios/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Actualizar formulario' } },
    formulariosController.actualizar
  )
  app.delete(
    '/formularios/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Eliminar formulario (soft delete)' } },
    formulariosController.eliminar
  )
}
