import type { FastifyInstance } from 'fastify'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { registrosTecnicaController as c } from './registros.controller.js'

const leer = requirePermiso('TEC_REGISTROS', 'LECTURA')
const editar = requirePermiso('TEC_REGISTROS', 'TOTAL')
const tags = ['tecnica']

/** Registro Técnico (Docs/registros-tecnica.md). Montado bajo /api/tecnica. */
export default async function registrosTecnicaRoutes(app: FastifyInstance) {
  app.get('/registros/formularios-opciones', { preHandler: [requireAuth, leer], schema: { tags, summary: 'Formularios técnicos aplicables (picker)' } }, c.opciones)
  app.get('/registros', { preHandler: [requireAuth, leer], schema: { tags, summary: 'Listar registros de una obra' } }, c.listar)
  app.post('/registros', { preHandler: [requireAuth, editar], schema: { tags, summary: 'Aplicar un formulario en una obra (o retomar su borrador)' } }, c.aplicar)
  app.get('/registros/:id', { preHandler: [requireAuth, leer], schema: { tags, summary: 'Detalle de un registro' } }, c.obtener)
  app.get('/registros/:id/reporte.pdf', { preHandler: [requireAuth, leer], schema: { tags, summary: 'Reporte PDF (cerrado)' } }, c.reportePdf)
  app.put('/registros/:id/respuestas', { preHandler: [requireAuth, editar], schema: { tags, summary: 'Guardar respuestas (parcial)' } }, c.guardar)
  app.post('/registros/:id/cerrar', { preHandler: [requireAuth, editar], schema: { tags, summary: 'Cerrar el registro' } }, c.cerrar)
  app.post('/registros/:id/preguntas/:preguntaId/fotos', { preHandler: [requireAuth, editar], schema: { tags, summary: 'Subir foto a una respuesta (multipart)' } }, c.agregarFoto)
  app.get('/registros/fotos/:fotoId', { preHandler: [requireAuth, leer], schema: { tags, summary: 'Descargar la imagen de una respuesta' } }, c.descargarFoto)
  app.delete('/registros/fotos/:fotoId', { preHandler: [requireAuth, editar], schema: { tags, summary: 'Quitar una foto de respuesta' } }, c.quitarFoto)
}
