import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  actualizarPerfilSchema,
  crearPerfilSchema,
  listarPerfilesQuerySchema,
  perfilIdParamSchema,
} from './perfiles.schema.js'
import { perfilesService } from './perfiles.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const perfilesController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarPerfilesQuerySchema.parse(request.query)
    return reply.send(await perfilesService.listar({ page, limit }, q))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = perfilIdParamSchema.parse(request.params)
    return reply.send(await perfilesService.obtener(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    const data = crearPerfilSchema.parse(request.body)
    return reply.status(201).send(await perfilesService.crear(data))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = perfilIdParamSchema.parse(request.params)
    const data = actualizarPerfilSchema.parse(request.body)
    return reply.send(await perfilesService.actualizar(id, data))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = perfilIdParamSchema.parse(request.params)
    await perfilesService.eliminar(id)
    return reply.status(204).send()
  },
}
