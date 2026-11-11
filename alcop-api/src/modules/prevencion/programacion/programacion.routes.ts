import type { AreaProgramacion } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { crearProgramacionController } from './programacion.controller.js'

/** Función de permiso que gobierna el calendario de cada área. */
const FUNCION: Record<AreaProgramacion, string> = {
  PREVENCION: 'PREV_PROGRAMACION',
  TECNICA: 'TEC_PROGRAMACION',
}

/**
 * Programación (Docs/programacion-prevencion.md v0.2). Se monta dos veces: bajo
 * /api/prevencion (area PREVENCION, función PREV_PROGRAMACION) y bajo /api/tecnica
 * (area TECNICA, función TEC_PROGRAMACION). Calendario de agendamiento por obra:
 * cada día (obra, fecha, área) agrupa uno o más formularios del área + un
 * comentario. En Técnica cada formulario tiene ventana inicio/término. No se
 * permite programar/editar fechas pasadas.
 */
export function programacionRoutes(area: AreaProgramacion) {
  return async function (app: FastifyInstance) {
    const leer = requirePermiso(FUNCION[area], 'LECTURA')
    const editar = requirePermiso(FUNCION[area], 'TOTAL')
    const c = crearProgramacionController(area)
    const tags = [area === 'TECNICA' ? 'tecnica' : 'prevencion']

    app.get(
      '/programacion',
      { preHandler: [requireAuth, leer], schema: { tags, summary: 'Agendamientos de una obra en un mes (calendario)' } },
      c.listar
    )
    app.get(
      '/programacion/formularios-opciones',
      { preHandler: [requireAuth, leer], schema: { tags, summary: 'Formularios agendables del área (picker)' } },
      c.opciones
    )
    app.get(
      '/programacion/:id',
      { preHandler: [requireAuth, leer], schema: { tags, summary: 'Detalle de un día de programación' } },
      c.obtener
    )
    app.post(
      '/programacion',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Agendar formularios en una fecha' } },
      c.crear
    )
    app.patch(
      '/programacion/:id',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Editar el comentario del día' } },
      c.actualizarComentario
    )
    app.post(
      '/programacion/:id/formularios',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Anexar formularios al día' } },
      c.agregarFormularios
    )
    app.patch(
      '/programacion/:id/formularios/:fpId',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Cambiar inicio/término de un formulario (Técnica)' } },
      c.actualizarVentana
    )
    app.delete(
      '/programacion/:id/formularios/:fpId',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Quitar un formulario del día' } },
      c.quitarFormulario
    )
    app.delete(
      '/programacion/:id',
      { preHandler: [requireAuth, editar], schema: { tags, summary: 'Eliminar el día (soft delete)' } },
      c.eliminar
    )
  }
}
