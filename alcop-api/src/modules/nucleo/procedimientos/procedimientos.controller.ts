import type { FastifyReply, FastifyRequest } from 'fastify'
import { BusinessError, UnauthorizedError } from '../../../shared/errors.js'
import { streamArchivo } from '../../../shared/archivos.js'
import {
  actualizarProcedimientoSchema,
  crearProcedimientoSchema,
  listarProcedimientosQuerySchema,
  opcionesQuerySchema,
  procedimientoFormularioParamSchema,
  procedimientoIdParamSchema,
  vincularFormularioSchema,
} from './procedimientos.schema.js'
import { procedimientosService } from './procedimientos.service.js'
import type { ArchivoPdf } from './procedimientos.types.js'

/**
 * Extrae los campos de texto y el (único) archivo de un request multipart.
 * Consume por completo cada parte (toBuffer) antes de avanzar, como exige
 * @fastify/multipart. Lanza 413 si el archivo excede el límite configurado.
 */
async function parseMultipart(
  request: FastifyRequest
): Promise<{ campos: Record<string, string>; archivo: ArchivoPdf | null }> {
  if (!request.isMultipart()) {
    throw new BusinessError('CONTENT_TYPE_INVALIDO', 'El contenido debe enviarse como multipart/form-data.', 415)
  }
  const campos: Record<string, string> = {}
  let archivo: ArchivoPdf | null = null

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      // Solo se conserva el primer archivo; el resto se drena para no colgar el stream.
      const buffer = await part.toBuffer()
      if (part.file.truncated) {
        throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', 'El PDF supera el tamaño máximo permitido.', 413)
      }
      if (!archivo) archivo = { buffer, mimetype: part.mimetype, filename: part.filename }
    } else {
      campos[part.fieldname] = String(part.value)
    }
  }
  return { campos, archivo }
}

/** Controladores thin (CLAUDE.md §12.5). */
export const procedimientosController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarProcedimientosQuerySchema.parse(request.query)
    return reply.send(await procedimientosService.listar({ page, limit }, q))
  },

  async listarOpciones(request: FastifyRequest, reply: FastifyReply) {
    const { q } = opcionesQuerySchema.parse(request.query)
    return reply.send({ data: await procedimientosService.listarOpciones(q) })
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = procedimientoIdParamSchema.parse(request.params)
    return reply.send(await procedimientosService.obtener(id))
  },

  async descargarArchivo(request: FastifyRequest, reply: FastifyReply) {
    const { id } = procedimientoIdParamSchema.parse(request.params)
    const { archivoUrl, codigo } = await procedimientosService.obtenerArchivoKey(id)
    const stream = streamArchivo(archivoUrl)
    if (!stream) throw new BusinessError('ARCHIVO_NO_ENCONTRADO', 'El PDF del procedimiento no está disponible.', 404)
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="${codigo}.pdf"`)
    return reply.send(stream)
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { campos, archivo } = await parseMultipart(request)
    const data = crearProcedimientoSchema.parse(campos)
    return reply.status(201).send(await procedimientosService.crear(data, archivo, request.usuarioId))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = procedimientoIdParamSchema.parse(request.params)
    const data = actualizarProcedimientoSchema.parse(request.body)
    return reply.send(await procedimientosService.actualizar(id, data, request.usuarioId))
  },

  async reemplazarArchivo(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = procedimientoIdParamSchema.parse(request.params)
    const { archivo } = await parseMultipart(request)
    return reply.send(await procedimientosService.reemplazarArchivo(id, archivo, request.usuarioId))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = procedimientoIdParamSchema.parse(request.params)
    await procedimientosService.eliminar(id, request.usuarioId)
    return reply.status(204).send()
  },

  // ─── Formularios de control vinculados ────────────────────────────────────
  async listarFormularios(request: FastifyRequest, reply: FastifyReply) {
    const { id } = procedimientoIdParamSchema.parse(request.params)
    return reply.send({ data: await procedimientosService.listarFormularios(id) })
  },

  async vincularFormulario(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = procedimientoIdParamSchema.parse(request.params)
    const { formularioId } = vincularFormularioSchema.parse(request.body)
    return reply.status(201).send(await procedimientosService.vincularFormulario(id, formularioId, request.usuarioId))
  },

  async desvincularFormulario(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, formularioId } = procedimientoFormularioParamSchema.parse(request.params)
    await procedimientosService.desvincularFormulario(id, formularioId)
    return reply.status(204).send()
  },
}
