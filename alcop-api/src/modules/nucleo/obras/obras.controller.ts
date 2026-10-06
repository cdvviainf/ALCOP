import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  actualizarObraSchema,
  crearObraSchema,
  listarObrasQuerySchema,
  obraIdParamSchema,
} from './obras.schema.js'
import { obrasService } from './obras.service.js'

/** Controladores thin (CLAUDE.md §12.5): validan, llaman al service, responden. */
export const obrasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarObrasQuerySchema.parse(request.query)
    const resultado = await obrasService.listar({ page, limit }, q)
    return reply.send(resultado)
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = obraIdParamSchema.parse(request.params)
    const obra = await obrasService.obtener(id)
    return reply.send(obra)
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    const data = crearObraSchema.parse(request.body)
    const obra = await obrasService.crear(data, request.usuarioId ?? 'system')
    return reply.status(201).send(obra)
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = obraIdParamSchema.parse(request.params)
    const data = actualizarObraSchema.parse(request.body)
    const obra = await obrasService.actualizar(id, data)
    return reply.send(obra)
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = obraIdParamSchema.parse(request.params)
    await obrasService.eliminar(id)
    return reply.status(204).send()
  },
}
