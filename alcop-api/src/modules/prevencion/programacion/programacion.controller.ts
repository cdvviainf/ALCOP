import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarComentarioSchema,
  agregarFormulariosSchema,
  crearProgramacionSchema,
  formularioProgramadoParamSchema,
  listarProgramacionQuerySchema,
  opcionesQuerySchema,
  programacionIdParamSchema,
} from './programacion.schema.js'
import { programacionService } from './programacion.service.js'

/** Controladores thin (CLAUDE.md §12.5). */
export const programacionController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const q = listarProgramacionQuerySchema.parse(request.query)
    return reply.send(await programacionService.listarMes(q))
  },

  async opciones(request: FastifyRequest, reply: FastifyReply) {
    const { q } = opcionesQuerySchema.parse(request.query)
    return reply.send(await programacionService.opciones(q))
  },

  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { id } = programacionIdParamSchema.parse(request.params)
    return reply.send(await programacionService.obtenerDia(id))
  },

  async crear(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const data = crearProgramacionSchema.parse(request.body)
    return reply.status(201).send(await programacionService.crear(data, request.usuarioId))
  },

  async actualizarComentario(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = programacionIdParamSchema.parse(request.params)
    const data = actualizarComentarioSchema.parse(request.body)
    return reply.send(await programacionService.actualizarComentario(id, data, request.usuarioId))
  },

  async agregarFormularios(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = programacionIdParamSchema.parse(request.params)
    const data = agregarFormulariosSchema.parse(request.body)
    return reply.status(201).send(await programacionService.agregarFormularios(id, data, request.usuarioId))
  },

  async quitarFormulario(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id, fpId } = formularioProgramadoParamSchema.parse(request.params)
    return reply.send(await programacionService.quitarFormulario(id, fpId, request.usuarioId))
  },

  async eliminar(request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuarioId) throw new UnauthorizedError()
    const { id } = programacionIdParamSchema.parse(request.params)
    await programacionService.eliminarDia(id, request.usuarioId)
    return reply.status(204).send()
  },
}
