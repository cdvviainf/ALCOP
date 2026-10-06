import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const rolObraSchema = z.enum(['ADMINISTRADOR', 'JEFE_DE_TERRENO', 'PREVENCIONISTA'])

export const listarUsuarioObrasQuerySchema = paginationQuerySchema.extend({
  obraId: z.coerce.number().int().positive().optional(),
})

export const usuarioObraIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/**
 * Asignar (o reemplazar) el titular de un RolObra en una obra. Idempotente por
 * (obraId, rolObra): si ya había titular, lo reemplaza (usuarios-perfiles.md §5).
 */
export const asignarUsuarioObraSchema = z.object({
  obraId: z.coerce.number().int().positive(),
  rolObra: rolObraSchema,
  usuarioId: z.string().trim().min(1),
})

export type AsignarUsuarioObraInput = z.infer<typeof asignarUsuarioObraSchema>
