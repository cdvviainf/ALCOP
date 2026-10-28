import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { registrosController } from './registros.controller.js'

const leer = requirePermiso('PREV_REGISTROS', 'LECTURA')
const editar = requirePermiso('PREV_REGISTROS', 'TOTAL')

/**
 * Registro de Prevención (Docs/registros-prevencion.md). Montado bajo /api/prevencion.
 * Llenado de los formularios agendados en el calendario: guardado parcial, fotos en
 * la BD por pregunta, y cierre que exige todas las obligatorias (respuestas + fotos)
 * y una fecha de revisión. Lectura/escritura por la función PREV_REGISTROS.
 */
export default async function registrosPrevencionRoutes(app: FastifyInstance) {
  app.get(
    '/registros',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Listar registros de una obra (por estado)' } },
    registrosController.listar
  )
  app.get(
    '/registros/:id',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Detalle de un registro (preguntas + respuestas)' } },
    registrosController.obtener
  )
  app.get(
    '/registros/:id/reporte.pdf',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Reporte PDF del registro (cerrado)' } },
    registrosController.reportePdf
  )
  app.put(
    '/registros/:id/respuestas',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Guardar respuestas (parcial)' } },
    registrosController.guardar
  )
  app.post(
    '/registros/:id/cerrar',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Cerrar el registro (valida obligatorias)' } },
    registrosController.cerrar
  )
  app.post(
    '/registros/:id/preguntas/:preguntaId/fotos',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Subir foto a una respuesta (multipart)' } },
    registrosController.agregarFoto
  )
  app.get(
    '/registros/fotos/:fotoId',
    { preHandler: [requireAuth, leer], schema: { tags: ['prevencion'], summary: 'Descargar la imagen de una respuesta' } },
    registrosController.descargarFoto
  )
  app.delete(
    '/registros/fotos/:fotoId',
    { preHandler: [requireAuth, editar], schema: { tags: ['prevencion'], summary: 'Quitar una foto de respuesta' } },
    registrosController.quitarFoto
  )
}
