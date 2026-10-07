import type { FastifyReply, FastifyRequest } from 'fastify'
import { listarFuncionesQuerySchema } from './funciones.schema.js'
import { funcionesService } from './funciones.service.js'

/** Controlador thin (CLAUDE.md §12.5). */
export const funcionesController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    listarFuncionesQuerySchema.parse(request.query)
    return reply.send({ data: await funcionesService.listar() })
  },
}
