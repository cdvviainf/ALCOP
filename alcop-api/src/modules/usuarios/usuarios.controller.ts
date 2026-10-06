import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../shared/errors.js'
import { usuariosService } from './usuarios.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const usuariosController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    // requireAuth ya adjuntó usuarioId; guarda defensiva por tipos.
    if (!request.usuarioId) throw new UnauthorizedError()
    const me = await usuariosService.obtenerMe(request.usuarioId)
    return reply.send(me)
  },
}
