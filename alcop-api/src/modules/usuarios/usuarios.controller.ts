import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../shared/errors.js'
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  listarUsuariosQuerySchema,
  usuarioIdParamSchema,
} from './usuarios.schema.js'
import { usuariosService } from './usuarios.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const usuariosController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    // requireAuth ya adjuntó usuarioId; guarda defensiva por tipos.
    if (!request.usuarioId) throw new UnauthorizedError()
    const me = await usuariosService.obtenerMe(request.usuarioId)
    return reply.send(me)
  },

  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q } = listarUsuariosQuerySchema.parse(request.query)
    return reply.send(await usuariosService.listar({ page, limit }, q))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = usuarioIdParamSchema.parse(request.params)
    return reply.send(await usuariosService.obtener(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearUsuarioSchema.parse(request.body)
    return reply.status(201).send(await usuariosService.crear(data, request.usuarioId))
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = usuarioIdParamSchema.parse(request.params)
    const data = actualizarUsuarioSchema.parse(request.body)
    return reply.send(await usuariosService.actualizar(id, data))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = usuarioIdParamSchema.parse(request.params)
    const accion = await usuariosService.eliminar(id, request.usuarioId)
    // Si tenía revisiones recientes se desactivó en vez de eliminar (§7): 200 con
    // la acción; si se eliminó, 204 sin cuerpo.
    if (accion === 'desactivado') {
      return reply.status(200).send({
        accion,
        message: 'El usuario tiene revisiones recientes: se desactivó en lugar de eliminarse.',
      })
    }
    return reply.status(204).send()
  },
}
