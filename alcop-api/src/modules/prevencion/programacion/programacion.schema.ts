import { z } from 'zod'

/** Día calendario YYYY-MM-DD (date-only; sin componente horario). */
const diaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato YYYY-MM-DD)')
  // Date.parse normaliza fechas inexistentes (2026-02-30 → marzo); exigimos que
  // año/mes/día reconstruidos coincidan EXACTAMENTE con lo enviado (QA-PP-001).
  .refine((s) => {
    const [y, m, d] = s.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  }, 'Fecha inexistente')

/** Lista de formularios a agendar (ids únicos, al menos uno). */
const formularioIdsSchema = z
  .array(z.coerce.number().int().positive())
  .min(1, 'Selecciona al menos un formulario')
  .transform((ids) => Array.from(new Set(ids)))

export const listarProgramacionQuerySchema = z.object({
  obraId: z.coerce.number().int().positive(),
  anio: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
})

export const opcionesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
})

export const programacionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const formularioProgramadoParamSchema = z.object({
  id: z.coerce.number().int().positive(), // programación (día)
  fpId: z.coerce.number().int().positive(), // formulario programado
})

export const crearProgramacionSchema = z.object({
  obraId: z.coerce.number().int().positive(),
  fecha: diaSchema,
  comentario: z.string().trim().min(1).max(2000).nullable().optional(),
  formularioIds: formularioIdsSchema,
})

export const actualizarComentarioSchema = z.object({
  comentario: z.string().trim().min(1).max(2000).nullable(),
})

export const agregarFormulariosSchema = z.object({
  formularioIds: formularioIdsSchema,
})

export type ListarProgramacionQuery = z.infer<typeof listarProgramacionQuerySchema>
export type CrearProgramacionInput = z.infer<typeof crearProgramacionSchema>
export type ActualizarComentarioInput = z.infer<typeof actualizarComentarioSchema>
export type AgregarFormulariosInput = z.infer<typeof agregarFormulariosSchema>
