import type { FastifyInstance } from 'fastify'
import { requireAnyArea, requireAuth } from '../../../plugins/auth-guard.js'
import { obrasController } from './obras.controller.js'

/**
 * Rutas de Obras — Panel de obras del núcleo compartido.
 * Montadas bajo el prefijo /api/nucleo (ver server.ts).
 *
 * Lectura: cualquier usuario activo (núcleo compartido). Escritura: requiere
 * nivel TOTAL en CUALQUIER área (provisional — la gestión de obras se define en
 * nucleo-compartido.md).
 */
export default async function obrasRoutes(app: FastifyInstance) {
  app.get(
    '/obras',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar obras (paginado)' } },
    obrasController.listar
  )

  app.get(
    '/obras/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de obra' } },
    obrasController.obtener
  )

  app.post(
    '/obras',
    {
      preHandler: [requireAuth, requireAnyArea('TOTAL')],
      schema: { tags: ['nucleo'], summary: 'Crear obra' },
    },
    obrasController.crear
  )

  app.patch(
    '/obras/:id',
    {
      preHandler: [requireAuth, requireAnyArea('TOTAL')],
      schema: { tags: ['nucleo'], summary: 'Actualizar obra' },
    },
    obrasController.actualizar
  )

  app.delete(
    '/obras/:id',
    {
      preHandler: [requireAuth, requireAnyArea('TOTAL')],
      schema: { tags: ['nucleo'], summary: 'Eliminar obra (soft delete)' },
    },
    obrasController.eliminar
  )
}
