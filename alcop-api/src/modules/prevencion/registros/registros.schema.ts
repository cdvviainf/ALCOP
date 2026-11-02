import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'
import { guardarRespuestasSchema, type GuardarRespuestasInput, type RespuestaItemInput } from '../../../shared/respuestas-formulario.js'

export { guardarRespuestasSchema }
export type { GuardarRespuestasInput, RespuestaItemInput }

/** Día calendario YYYY-MM-DD existente (mismo criterio que programación). */
export const diaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato YYYY-MM-DD)')
  .refine((s) => {
    const [y, m, d] = s.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  }, 'Fecha inexistente')

export const estadoRegistroSchema = z.enum(['POR_APLICAR', 'VIGENTE', 'ATRASADO', 'COMPLETADO'])

export const listarRegistrosQuerySchema = paginationQuerySchema.extend({
  obraId: z.coerce.number().int().positive(),
  estado: estadoRegistroSchema.optional(),
})

export const registroIdParamSchema = z.object({
  id: z.coerce.number().int().positive(), // FormularioProgramado
})

export const preguntaParamSchema = z.object({
  id: z.coerce.number().int().positive(), // registro (FormularioProgramado)
  preguntaId: z.coerce.number().int().positive(),
})

export const fotoIdParamSchema = z.object({
  fotoId: z.coerce.number().int().positive(),
})

export const cerrarRegistroSchema = z.object({
  fechaRevision: diaSchema,
})

export type ListarRegistrosQuery = z.infer<typeof listarRegistrosQuerySchema>
export type CerrarRegistroInput = z.infer<typeof cerrarRegistroSchema>
