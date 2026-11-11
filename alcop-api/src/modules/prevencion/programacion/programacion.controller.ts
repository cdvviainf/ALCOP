import type { AreaProgramacion } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../../../shared/errors.js'
import {
  actualizarComentarioSchema,
  actualizarVentanaSchema,
  agregarFormulariosPrevencionSchema,
  agregarFormulariosTecnicaSchema,
  crearProgramacionPrevencionSchema,
  crearProgramacionTecnicaSchema,
  formularioProgramadoParamSchema,
  listarProgramacionQuerySchema,
  opcionesQuerySchema,
  programacionIdParamSchema,
} from './programacion.schema.js'
import { programacionService } from './programacion.service.js'

/**
 * Controladores thin (CLAUDE.md §12.5), uno por área. Prevención recibe
 * `formularioIds`; Técnica recibe `formularios` con su ventana inicio/término.
 */
export function crearProgramacionController(area: AreaProgramacion) {
  const crearSchema = area === 'TECNICA' ? crearProgramacionTecnicaSchema : crearProgramacionPrevencionSchema
  const agregarSchema = area === 'TECNICA' ? agregarFormulariosTecnicaSchema : agregarFormulariosPrevencionSchema

  return {
    async listar(request: FastifyRequest, reply: FastifyReply) {
      const q = listarProgramacionQuerySchema.parse(request.query)
      return reply.send(await programacionService.listarMes(area, q))
    },

    async opciones(request: FastifyRequest, reply: FastifyReply) {
      const { q } = opcionesQuerySchema.parse(request.query)
      return reply.send(await programacionService.opciones(area, q))
    },

    async obtener(request: FastifyRequest, reply: FastifyReply) {
      const { id } = programacionIdParamSchema.parse(request.params)
      return reply.send(await programacionService.obtenerDia(area, id))
    },

    async crear(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const data = crearSchema.parse(request.body)
      return reply.status(201).send(await programacionService.crear(area, data, request.usuarioId))
    },

    async actualizarComentario(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const { id } = programacionIdParamSchema.parse(request.params)
      const data = actualizarComentarioSchema.parse(request.body)
      return reply.send(await programacionService.actualizarComentario(area, id, data, request.usuarioId))
    },

    async agregarFormularios(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const { id } = programacionIdParamSchema.parse(request.params)
      const data = agregarSchema.parse(request.body)
      return reply.status(201).send(await programacionService.agregarFormularios(area, id, data, request.usuarioId))
    },

    async actualizarVentana(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const { id, fpId } = formularioProgramadoParamSchema.parse(request.params)
      const data = actualizarVentanaSchema.parse(request.body)
      return reply.send(await programacionService.actualizarVentana(area, id, fpId, data))
    },

    async quitarFormulario(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const { id, fpId } = formularioProgramadoParamSchema.parse(request.params)
      return reply.send(await programacionService.quitarFormulario(area, id, fpId, request.usuarioId))
    },

    async eliminar(request: FastifyRequest, reply: FastifyReply) {
      if (!request.usuarioId) throw new UnauthorizedError()
      const { id } = programacionIdParamSchema.parse(request.params)
      await programacionService.eliminarDia(area, id, request.usuarioId)
      return reply.status(204).send()
    },
  }
}
