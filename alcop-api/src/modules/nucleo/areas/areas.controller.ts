import type { FastifyReply, FastifyRequest } from 'fastify'
import { listarAreasQuerySchema } from './areas.schema.js'
import { areasService } from './areas.service.js'

/** Controlador thin (CLAUDE.md §12.5). */
export const areasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    listarAreasQuerySchema.parse(request.query)
    return reply.send({ data: await areasService.listar() })
  },
}
