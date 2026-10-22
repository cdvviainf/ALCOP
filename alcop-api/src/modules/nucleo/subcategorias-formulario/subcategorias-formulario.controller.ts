import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarSubcategoriaSchema,
  crearSubcategoriaSchema,
  listarSubcategoriasQuerySchema,
  opcionesSubcategoriaQuerySchema,
  subcategoriaIdParamSchema,
} from './subcategorias-formulario.schema.js'
import { subcategoriasService } from './subcategorias-formulario.service.js'

/** Controladores thin (CLAUDE.md §12.5). La autz por área vive en el service. */
export const subcategoriasController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, q, categoriaId, areaId } = listarSubcategoriasQuerySchema.parse(request.query)
    return reply.send(
      await subcategoriasService.listar(
        { page, limit },
        { esAdmin: request.esAdmin, permisos: request.permisos },
        q,
        categoriaId,
        areaId
      )
    )
  },

  async listarOpciones(request: FastifyRequest, reply: FastifyReply) {
    const { categoriaId } = opcionesSubcategoriaQuerySchema.parse(request.query)
    return reply.send({
      data: await subcategoriasService.listarOpciones(categoriaId, {
        esAdmin: request.esAdmin,
        permisos: request.permisos,
      }),
    })
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = subcategoriaIdParamSchema.parse(request.params)
    return reply.send(await subcategoriasService.obtener(id, { esAdmin: request.esAdmin, permisos: request.permisos }))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearSubcategoriaSchema.parse(request.body)
    const sub = await subcategoriasService.crear(data, { esAdmin: request.esAdmin, permisos: request.permisos }, request.usuarioId)
    return reply.status(201).send(sub)
  },

  async actualizar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = subcategoriaIdParamSchema.parse(request.params)
    const data = actualizarSubcategoriaSchema.parse(request.body)
    const sub = await subcategoriasService.actualizar(
      id,
      data,
      { esAdmin: request.esAdmin, permisos: request.permisos },
      request.usuarioId
    )
    return reply.send(sub)
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = subcategoriaIdParamSchema.parse(request.params)
    await subcategoriasService.eliminar(id, { esAdmin: request.esAdmin, permisos: request.permisos }, request.usuarioId)
    return reply.status(204).send()
  },
}
