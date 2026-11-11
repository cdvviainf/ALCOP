import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../plugins/auth-guard.js'
import { dashboardController } from './dashboard.controller.js'

/**
 * Dashboard (Panel de obras y resumen). Montado bajo /api/nucleo. Cualquier usuario
 * autenticado: el contenido se acota a sus obras (UsuarioObra; esAdmin ve todas) y a
 * las áreas que su perfil permite (TEC_INSPECCION / PREV_INSPECCION; agenda por
 * *_REGISTROS o *_PROGRAMACION).
 */
export default async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    '/dashboard',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Resumen del dashboard (por obras y áreas visibles)' } },
    dashboardController.obtener
  )
  app.get(
    '/dashboard/visitas-mensuales',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Visitas por mes (Técnica / Prevención), filtrable por obra' } },
    dashboardController.visitasMensuales
  )
}
