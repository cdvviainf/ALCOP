import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarObraSchema,
  asignarTitularSchema,
  crearObraSchema,
  listarObrasQuerySchema,
  obraIdParamSchema,
  titularParamSchema,
} from './obras.schema.js'
import { obrasService } from './obras.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const obrasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarObrasQuerySchema.parse(request.query)
    return reply.send(await obrasService.listar({ page, limit }, q))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = obraIdParamSchema.parse(request.params)
    return reply.send(await obrasService.obtener(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearObraSchema.parse(request.body)
    return reply.status(201).send(await obrasService.crear(data, request.usuarioId))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = obraIdParamSchema.parse(request.params)
    const data = actualizarObraSchema.parse(request.body)
    return reply.send(await obrasService.actualizar(id, data, request.usuarioId))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = obraIdParamSchema.parse(request.params)
    await obrasService.eliminar(id, request.usuarioId)
    return reply.status(204).send()
  },

  // ─── Titulares ──────────────────────────────────────────────────────────
  async listarTitulares(request: FastifyRequest, reply: FastifyReply) {
    const { id } = obraIdParamSchema.parse(request.params)
    return reply.send({ data: await obrasService.listarTitulares(id) })
  },

  async asignarTitular(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = obraIdParamSchema.parse(request.params)
    const data = asignarTitularSchema.parse(request.body)
    return reply.status(201).send(await obrasService.asignarTitular(id, data, request.usuarioId))
  },

  async quitarTitular(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, titularId } = titularParamSchema.parse(request.params)
    await obrasService.quitarTitular(id, titularId, request.usuarioId)
    return reply.status(204).send()
  },
}
