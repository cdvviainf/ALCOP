import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarFormularioSchema,
  crearFormularioSchema,
  formularioIdParamSchema,
  listarFormulariosQuerySchema,
  opcionesQuerySchema,
} from './formularios.schema.js'
import { formulariosService } from './formularios.service.js'

/** Controladores thin (CLAUDE.md §12.5). La autorización por área vive en el service. */
export const formulariosController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q, areaId, categoriaId } = listarFormulariosQuerySchema.parse(request.query)
    return reply.send(
      await formulariosService.listar(
        { page, limit },
        { esAdmin: request.esAdmin, permisos: request.permisos },
        q,
        areaId,
        categoriaId
      )
    )
  },

  async opciones(request: FastifyRequest, reply: FastifyReply) {
    const { q } = opcionesQuerySchema.parse(request.query)
    return reply.send({ data: await formulariosService.listarOpciones(q) })
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = formularioIdParamSchema.parse(request.params)
    return reply.send(
      await formulariosService.obtener(id, { esAdmin: request.esAdmin, permisos: request.permisos })
    )
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearFormularioSchema.parse(request.body)
    return reply
      .status(201)
      .send(
        await formulariosService.crear(data, { esAdmin: request.esAdmin, permisos: request.permisos }, request.usuarioId)
      )
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = formularioIdParamSchema.parse(request.params)
    const data = actualizarFormularioSchema.parse(request.body)
    return reply.send(
      await formulariosService.actualizar(id, data, { esAdmin: request.esAdmin, permisos: request.permisos })
    )
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = formularioIdParamSchema.parse(request.params)
    await formulariosService.eliminar(id, { esAdmin: request.esAdmin, permisos: request.permisos })
    return reply.status(204).send()
  },
}
