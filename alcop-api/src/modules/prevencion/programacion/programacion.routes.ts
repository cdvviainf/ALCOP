import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { programacionController } from './programacion.controller.js'

const leer = requirePermiso('PREV_PROGRAMACION', 'LECTURA')
const editar = requirePermiso('PREV_PROGRAMACION', 'TOTAL')

/**
 * Programación de Prevención (Docs/programacion-prevencion.md). Montada bajo
 * /api/prevencion. Calendario de agendamiento por obra: cada día (obra, fecha)
 * agrupa uno o más formularios de Prevención + un comentario. Lectura/escritura
 * por la función PREV_PROGRAMACION. No se permite programar/editar fechas pasadas.
 */
export default async function programacionPrevencionRoutes(app: FastifyInstance) {
  app.get(
    '/programacion',
    {
      preHandler: [requireAuth, leer],
      schema: { tags: ['prevencion'], summary: 'Agendamientos de una obra en un mes (calendario)' },
    },
    programacionController.listar
  )
  app.get(
    '/programacion/formularios-opciones',
    {
      preHandler: [requireAuth, leer],
      schema: { tags: ['prevencion'], summary: 'Formularios de Prevención agendables (picker)' },
    },
    programacionController.opciones
  )
  app.get(
    '/programacion/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Detalle de un día de programación' } },
    programacionController.obtener
  )
  app.post(
    '/programacion',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Agendar formularios en una fecha' } },
    programacionController.crear
  )
  app.patch(
    '/programacion/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Editar el comentario del día' } },
    programacionController.actualizarComentario
  )
  app.post(
    '/programacion/:id/formularios',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Anexar formularios al día' } },
    programacionController.agregarFormularios
  )
  app.delete(
    '/programacion/:id/formularios/:fpId',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Quitar un formulario del día' } },
    programacionController.quitarFormulario
  )
  app.delete(
    '/programacion/:id',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Eliminar el día (soft delete)' } },
    programacionController.eliminar
  )
}
