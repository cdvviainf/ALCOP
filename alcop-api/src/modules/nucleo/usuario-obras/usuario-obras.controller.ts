import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  asignarUsuarioObraSchema,
  listarUsuarioObrasQuerySchema,
  usuarioObraIdParamSchema,
} from './usuario-obras.schema.js'
import { usuarioObrasService } from './usuario-obras.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const usuarioObrasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, obraId } = listarUsuarioObrasQuerySchema.parse(request.query)
    return reply.send(await usuarioObrasService.listar({ page, limit }, obraId))
  },

  async asignar(request: FastifyRequest, reply: FastifyReply) {
    const data = asignarUsuarioObraSchema.parse(request.body)
    return reply.status(201).send(await usuarioObrasService.asignar(data))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = usuarioObraIdParamSchema.parse(request.params)
    await usuarioObrasService.eliminar(id)
    return reply.status(204).send()
  },
}
