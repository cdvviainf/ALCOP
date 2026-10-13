import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { requireAdmin, requireAuth } from '../../../plugins/auth-guard.js'
import { configuracionService } from './configuracion.service.js'

const calidadSchema = z.object({
  valor: z.enum(['ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA']),
})

/**
 * Configuración del sistema (Docs/tecnica.md §6). Se separa administración de
 * consulta operativa (QA-OLA-B-001): **cambiar** la calidad por defecto es solo del
 * Administrador; **consultarla** la hace cualquier usuario autenticado, para que el
 * inspector la vea preseleccionada al subir una foto.
 */
export default async function configuracionRoutes(app: FastifyInstance) {
  app.get(
    '/configuracion/calidad-imagen',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Calidad de imagen por defecto' } },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ calidadImagenDefault: await configuracionService.obtenerCalidadImagen() })
    }
  )

  app.patch(
    '/configuracion/calidad-imagen',
    { preHandler: [requireAuth, requireAdmin], schema: { tags: ['nucleo'], summary: 'Cambiar calidad de imagen por defecto' } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { valor } = calidadSchema.parse(request.body)
      return reply.send(await configuracionService.setCalidadImagen(valor))
    }
  )
}
