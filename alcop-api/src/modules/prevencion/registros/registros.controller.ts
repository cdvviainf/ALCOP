import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CalidadImagen } from '@prisma/client'
import { BusinessError, UnauthorizedError } from '../../../shared/errors.js'
import { calidadImagenSchema } from '../visitas/visitas.schema.js'
import {
  cerrarRegistroSchema,
  fotoIdParamSchema,
  guardarRespuestasSchema,
  listarRegistrosQuerySchema,
  preguntaParamSchema,
  registroIdParamSchema,
} from './registros.schema.js'
import { registrosService } from './registros.service.js'

/** Extrae campos + el (único) archivo de un request multipart (foto de respuesta). */
async function parseMultipart(
  request: FastifyRequest
): Promise<{ campos: Record<string, string>; archivo: { buffer: Buffer } | null }> {
  if (!request.isMultipart()) {
    throw new BusinessError('CONTENT_TYPE_INVALIDO', 'El contenido debe enviarse como multipart/form-data.', 415)
  }
  const campos: Record<string, string> = {}
  let archivo: { buffer: Buffer } | null = null
  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer()
      if (part.file.truncated) {
        throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', 'La imagen supera el tamaño máximo permitido.', 413)
      }
      if (!archivo) archivo = { buffer }
    } else {
      campos[part.fieldname] = String(part.value)
    }
  }
  return { campos, archivo }
}

/** Controladores thin (CLAUDE.md §12.5). */
export const registrosController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, obraId, estado } = listarRegistrosQuerySchema.parse(request.query)
    return reply.send(await registrosService.listar({ page, limit }, obraId, estado))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = registroIdParamSchema.parse(request.params)
    return reply.send(await registrosService.obtener(id))
  },

  async guardar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = registroIdParamSchema.parse(request.params)
    const data = guardarRespuestasSchema.parse(request.body)
    return reply.send(await registrosService.guardar(id, data, request.usuarioId))
  },

  async cerrar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = registroIdParamSchema.parse(request.params)
    const data = cerrarRegistroSchema.parse(request.body)
    return reply.send(await registrosService.cerrar(id, data, request.usuarioId))
  },

  async agregarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, preguntaId } = preguntaParamSchema.parse(request.params)
    const { campos, archivo } = await parseMultipart(request)
    let calidad: CalidadImagen | null = null
    if (campos.calidad) calidad = calidadImagenSchema.parse(campos.calidad)
    return reply.status(201).send(await registrosService.agregarFoto(id, preguntaId, archivo, calidad, request.usuarioId))
  },

  async descargarFoto(request: FastifyRequest, reply: FastifyReply) {
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    const { datos, mimetype } = await registrosService.descargarFoto(fotoId)
    reply.header('Content-Type', mimetype)
    reply.header('Cache-Control', 'private, max-age=86400')
    return reply.send(datos)
  },

  async quitarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    await registrosService.quitarFoto(fotoId)
    return reply.status(204).send()
  },

  async reportePdf(request: FastifyRequest, reply: FastifyReply) {
    const { id } = registroIdParamSchema.parse(request.params)
    const { pdf, obraCodigo } = await registrosService.generarReportePdf(id)
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="registro-${obraCodigo}-${id}.pdf"`)
    return reply.send(pdf)
  },
}
