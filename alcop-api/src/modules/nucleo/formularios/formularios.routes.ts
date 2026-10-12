import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { prisma } from '../../../lib/prisma.js'
import { paginate, paginationQuerySchema, toPrismaRange } from '../../../shared/pagination.js'

/**
 * Formularios de control — listado de solo lectura (Docs/formularios-dinamicos.md).
 *
 * NOTA (12-10-2026): el motor CRUD completo de Formulario/Pregunta (crear/editar
 * plantillas y responderlas) aún NO está implementado como módulo propio. Este
 * endpoint expone solo el LISTADO (de formularios ACTIVOS) que necesitan los
 * pickers (vincular formularios a un procedimiento — lotes-procedimientos.md §5.2).
 * Autorización (QA-LP-001, arbitraje ronda 2): su único consumidor es el picker
 * de Procedimientos, que es TRANSVERSAL (un procedimiento enlaza formularios de
 * cualquier área — lotes-procedimientos.md §4, dec. #4). Por eso se gatea con
 * `PROCEDIMIENTOS:LECTURA` y entrega el catálogo transversal completo, sin filtro
 * de área ni `FormularioPermiso`. Si este listado se reutiliza como el listado
 * general del motor de Formularios, deberá hacerse en OTRO endpoint que sí aplique
 * función + toggle de área + ampliaciones de `FormularioPermiso`.
 */

const listarQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

const leerFormularios = requirePermiso('PROCEDIMIENTOS', 'LECTURA')

export default async function formulariosRoutes(app: FastifyInstance) {
  app.get(
    '/formularios',
    {
      preHandler: [requireAuth, leerFormularios],
      schema: { tags: ['nucleo'], summary: 'Listar formularios activos (solo lectura, para pickers)' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { page, limit, q } = listarQuerySchema.parse(request.query)
      const where = {
        eliminadoEn: null,
        activo: true,
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' as const } },
                { codigo: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      }
      const { skip, take } = toPrismaRange({ page, limit })
      const [rows, total] = await prisma.$transaction([
        prisma.formulario.findMany({
          where,
          skip,
          take,
          orderBy: { id: 'desc' },
          select: { id: true, codigo: true, nombre: true, areaId: true, activo: true },
        }),
        prisma.formulario.count({ where }),
      ])
      return reply.send(paginate(rows, total, { page, limit }))
    }
  )
}
