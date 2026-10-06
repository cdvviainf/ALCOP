import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarCategoriaSchema,
  categoriaIdParamSchema,
  crearCategoriaSchema,
  listarCategoriasQuerySchema,
} from './categorias-formulario.schema.js'
import { categoriasService } from './categorias-formulario.service.js'

/** Controladores thin (CLAUDE.md §12.5). La autz por área vive en el service. */
export const categoriasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q, areaId } = listarCategoriasQuerySchema.parse(request.query)
    return reply.send(await categoriasService.listar({ page, limit }, q, areaId))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = categoriaIdParamSchema.parse(request.params)
    return reply.send(await categoriasService.obtener(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearCategoriaSchema.parse(request.body)
    const categoria = await categoriasService.crear(data, request.niveles, request.usuarioId)
    return reply.status(201).send(categoria)
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = categoriaIdParamSchema.parse(request.params)
    const data = actualizarCategoriaSchema.parse(request.body)
    const categoria = await categoriasService.actualizar(id, data, request.niveles)
    return reply.send(categoria)
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = categoriaIdParamSchema.parse(request.params)
    await categoriasService.eliminar(id, request.niveles, request.usuarioId)
    return reply.status(204).send()
  },
}
