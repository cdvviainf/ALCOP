import type { FastifyReply, FastifyRequest } from 'fastify'
import { alcanceDe } from '../../../shared/obra-alcance.js'
import { dashboardQuerySchema, visitasMensualesQuerySchema } from './dashboard.schema.js'
import { dashboardService } from './dashboard.service.js'

/** Controlador thin (CLAUDE.md §12.5). */
export const dashboardController = {
  async obtener(request: FastifyRequest, reply: FastifyReply) {
    const { dias } = dashboardQuerySchema.parse(request.query)
    const data = await dashboardService.obtener({ alcance: alcanceDe(request), permisos: request.permisos ?? {} }, dias)
    return reply.send(data)
  },

  async visitasMensuales(request: FastifyRequest, reply: FastifyReply) {
    const { obraId, meses } = visitasMensualesQuerySchema.parse(request.query)
    const ctx = { alcance: alcanceDe(request), permisos: request.permisos ?? {} }
    return reply.send(await dashboardService.visitasMensuales(ctx, meses, obraId))
  },
}
