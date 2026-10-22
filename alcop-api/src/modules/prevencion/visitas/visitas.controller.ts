import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CalidadImagen } from '@prisma/client'
import { BusinessError, UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarHallazgoSchema,
  actualizarVisitaSchema,
  calidadImagenSchema,
  crearHallazgoSchema,
  crearVisitaSchema,
  finalizarVisitaSchema,
  fotoIdParamSchema,
  hallazgoIdParamSchema,
  hallazgoParamSchema,
  listarVisitasQuerySchema,
  visitaIdParamSchema,
} from './visitas.schema.js'
import { visitasService } from './visitas.service.js'

/** Máximo de fotos por alta de hallazgo (override del límite global `files: 1`). */
const MAX_FOTOS_ALTA = 10

/** Extrae campos + el (único) archivo de un request multipart (foto del hallazgo). */
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

/** Variante multi-archivo para el alta de hallazgo (fotos son parte del hallazgo). */
async function parseMultipartMulti(
  request: FastifyRequest
): Promise<{ campos: Record<string, string>; archivos: Buffer[] }> {
  if (!request.isMultipart()) {
    throw new BusinessError('CONTENT_TYPE_INVALIDO', 'El contenido debe enviarse como multipart/form-data.', 415)
  }
  const campos: Record<string, string> = {}
  const archivos: Buffer[] = []
  try {
    for await (const part of request.parts({ limits: { files: MAX_FOTOS_ALTA } })) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer()
        if (part.file.truncated) {
          throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', 'La imagen supera el tamaño máximo permitido.', 413)
        }
        if (buffer.length > 0) archivos.push(buffer)
      } else {
        campos[part.fieldname] = String(part.value)
      }
    }
  } catch (err) {
    if (err instanceof BusinessError) throw err
    const code = (err as { code?: string }).code
    if (code === 'FST_FILES_LIMIT') {
      throw new BusinessError('DEMASIADAS_FOTOS', `Máximo ${MAX_FOTOS_ALTA} fotos por registro.`, 413)
    }
    if (code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', 'La imagen supera el tamaño máximo permitido.', 413)
    }
    throw err
  }
  return { campos, archivos }
}

/** Controladores thin (CLAUDE.md §12.5). */
export const visitasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q, obraId, usuarioId, estado, orden, dir } = listarVisitasQuerySchema.parse(request.query)
    return reply.send(await visitasService.listar({ page, limit }, { q, obraId, usuarioId, estado, orden, dir }))
  },

  async listarInspectores(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ data: await visitasService.listarInspectores() })
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = visitaIdParamSchema.parse(request.params)
    return reply.send(await visitasService.obtener(id))
  },

  async reportePdf(request: FastifyRequest, reply: FastifyReply) {
    const { id } = visitaIdParamSchema.parse(request.params)
    const { pdf, obraCodigo } = await visitasService.generarReportePdf(id)
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="reporte-prevencion-${obraCodigo}-visita-${id}.pdf"`)
    return reply.send(pdf)
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearVisitaSchema.parse(request.body)
    return reply.status(201).send(await visitasService.crear(data, request.usuarioId))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = visitaIdParamSchema.parse(request.params)
    const data = actualizarVisitaSchema.parse(request.body)
    return reply.send(await visitasService.actualizar(id, data, request.usuarioId))
  },

  async finalizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = visitaIdParamSchema.parse(request.params)
    const data = finalizarVisitaSchema.parse(request.body)
    return reply.send(await visitasService.finalizar(id, data, request.usuarioId))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = visitaIdParamSchema.parse(request.params)
    await visitasService.eliminar(id, request.usuarioId)
    return reply.status(204).send()
  },

  // ─── Hallazgos ──────────────────────────────────────────────────────────────
  async agregarHallazgo(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = visitaIdParamSchema.parse(request.params)
    const { campos, archivos } = await parseMultipartMulti(request)
    const data = crearHallazgoSchema.parse({
      categoriaId: campos.categoriaId,
      subcategoriaId: campos.subcategoriaId,
      nivelRiesgoId: campos.nivelRiesgoId,
      plazoValor: campos.plazoValor,
      plazoUnidad: campos.plazoUnidad,
      comentario: campos.comentario,
    })
    let calidad: CalidadImagen | null = null
    if (campos.calidad) calidad = calidadImagenSchema.parse(campos.calidad)
    return reply.status(201).send(await visitasService.agregarHallazgo(id, data, archivos, calidad, request.usuarioId))
  },

  async actualizarHallazgo(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, hallazgoId } = hallazgoParamSchema.parse(request.params)
    const data = actualizarHallazgoSchema.parse(request.body)
    return reply.send(await visitasService.actualizarHallazgo(id, hallazgoId, data, request.usuarioId))
  },

  async quitarHallazgo(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, hallazgoId } = hallazgoParamSchema.parse(request.params)
    await visitasService.quitarHallazgo(id, hallazgoId, request.usuarioId)
    return reply.status(204).send()
  },

  // ─── Fotos ────────────────────────────────────────────────────────────────
  async agregarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { hallazgoId } = hallazgoIdParamSchema.parse(request.params)
    const { campos, archivo } = await parseMultipart(request)
    let calidad: CalidadImagen | null = null
    if (campos.calidad) calidad = calidadImagenSchema.parse(campos.calidad)
    return reply.status(201).send(await visitasService.agregarFoto(hallazgoId, archivo, calidad))
  },

  async descargarFoto(request: FastifyRequest, reply: FastifyReply) {
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    const { datos, mimetype } = await visitasService.descargarFoto(fotoId)
    reply.header('Content-Type', mimetype)
    reply.header('Cache-Control', 'private, max-age=86400')
    return reply.send(datos)
  },

  async quitarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    await visitasService.quitarFoto(fotoId)
    return reply.status(204).send()
  },
}
