import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarTipoLoteSchema,
  crearTipoLoteSchema,
  listarTiposLoteQuerySchema,
  opcionesQuerySchema,
  tipoLoteIdParamSchema,
  tipoLoteProcedimientoParamSchema,
  vincularProcedimientoSchema,
} from './tipos-lote.schema.js'
import { tiposLoteService } from './tipos-lote.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const tiposLoteController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarTiposLoteQuerySchema.parse(request.query)
    return reply.send(await tiposLoteService.listar({ page, limit }, q))
  },

  async listarOpciones(request: FastifyRequest, reply: FastifyReply) {
    const { q } = opcionesQuerySchema.parse(request.query)
    return reply.send({ data: await tiposLoteService.listarOpciones(q) })
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = tipoLoteIdParamSchema.parse(request.params)
    return reply.send(await tiposLoteService.obtener(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearTipoLoteSchema.parse(request.body)
    return reply.status(201).send(await tiposLoteService.crear(data, request.usuarioId))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = tipoLoteIdParamSchema.parse(request.params)
    const data = actualizarTipoLoteSchema.parse(request.body)
    return reply.send(await tiposLoteService.actualizar(id, data, request.usuarioId))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = tipoLoteIdParamSchema.parse(request.params)
    await tiposLoteService.eliminar(id, request.usuarioId)
    return reply.status(204).send()
  },

  // ─── Procedimientos vinculados ────────────────────────────────────────────
  async listarProcedimientos(request: FastifyRequest, reply: FastifyReply) {
    const { id } = tipoLoteIdParamSchema.parse(request.params)
    return reply.send({ data: await tiposLoteService.listarProcedimientos(id) })
  },

  async vincularProcedimiento(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = tipoLoteIdParamSchema.parse(request.params)
    const { procedimientoId } = vincularProcedimientoSchema.parse(request.body)
    return reply
      .status(201)
      .send(await tiposLoteService.vincularProcedimiento(id, procedimientoId, request.usuarioId))
  },

  async desvincularProcedimiento(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, procedimientoId } = tipoLoteProcedimientoParamSchema.parse(request.params)
    await tiposLoteService.desvincularProcedimiento(id, procedimientoId)
    return reply.status(204).send()
  },
}
