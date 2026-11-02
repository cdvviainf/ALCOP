import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CalidadImagen } from '@prisma/client'
import { UnauthorizedError } from '../../../shared/errors.js'
import { parseMultipart } from '../../prevencion/registros/registros.controller.js'
import { calidadImagenSchema } from '../../prevencion/visitas/visitas.schema.js'
import {
  aplicarFormularioSchema,
  cerrarRegistroSchema,
  fotoIdParamSchema,
  guardarRespuestasSchema,
  listarRegistrosQuerySchema,
  preguntaParamSchema,
  registroIdParamSchema,
} from './registros.schema.js'
import { registrosTecnicaService as service } from './registros.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const registrosTecnicaController = {
  async opciones(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ data: await service.formulariosOpciones() })
  },

  async aplicar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = aplicarFormularioSchema.parse(request.body)
    const res = await service.aplicar(data, request.usuarioId)
    return reply.status(res.reanudado ? 200 : 201).send(res)
  },

  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, obraId, estado } = listarRegistrosQuerySchema.parse(request.query)
    return reply.send(await service.listar({ page, limit }, obraId, estado))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = registroIdParamSchema.parse(request.params)
    return reply.send(await service.obtener(id))
  },

  async guardar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = registroIdParamSchema.parse(request.params)
    const data = guardarRespuestasSchema.parse(request.body)
    return reply.send(await service.guardar(id, data, request.usuarioId))
  },

  async cerrar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = registroIdParamSchema.parse(request.params)
    const data = cerrarRegistroSchema.parse(request.body)
    return reply.send(await service.cerrar(id, data, request.usuarioId))
  },

  async agregarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, preguntaId } = preguntaParamSchema.parse(request.params)
    const { campos, archivo } = await parseMultipart(request)
    let calidad: CalidadImagen | null = null
    if (campos.calidad) calidad = calidadImagenSchema.parse(campos.calidad)
    return reply.status(201).send(await service.agregarFoto(id, preguntaId, archivo, calidad, request.usuarioId))
  },

  async descargarFoto(request: FastifyRequest, reply: FastifyReply) {
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    const { datos, mimetype } = await service.descargarFoto(fotoId)
    reply.header('Content-Type', mimetype)
    reply.header('Cache-Control', 'private, max-age=86400')
    return reply.send(datos)
  },

  async quitarFoto(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { fotoId } = fotoIdParamSchema.parse(request.params)
    await service.quitarFoto(fotoId)
    return reply.status(204).send()
  },

  async reportePdf(request: FastifyRequest, reply: FastifyReply) {
    const { id } = registroIdParamSchema.parse(request.params)
    const { pdf, obraCodigo } = await service.generarReportePdf(id)
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="registro-tecnico-${obraCodigo}-${id}.pdf"`)
    return reply.send(pdf)
  },
}
