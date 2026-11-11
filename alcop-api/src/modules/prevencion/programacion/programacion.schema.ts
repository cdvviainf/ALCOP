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

const MSG_VENTANA = 'La fecha de término no puede ser anterior a la de inicio.'
const ventanaCoherente = (v: { fechaInicio?: string; fechaTermino?: string }) =>
  !v.fechaInicio || !v.fechaTermino || v.fechaTermino >= v.fechaInicio

/** Línea a agendar. Las fechas solo aplican a TECNICA (por defecto = fecha del día). */
const lineaSchema = z
  .object({
    formularioId: z.coerce.number().int().positive(),
    fechaInicio: diaSchema.optional(),
    fechaTermino: diaSchema.optional(),
  })
  .refine(ventanaCoherente, { message: MSG_VENTANA, path: ['fechaTermino'] })

/** Prevención: lista de ids (sin fechas por formulario) → se normaliza a líneas. */
const formularioIdsSchema = z
  .array(z.coerce.number().int().positive())
  .min(1, 'Selecciona al menos un formulario')
  .transform((ids) => Array.from(new Set(ids)).map((formularioId) => ({ formularioId })))

/** Técnica: líneas con ventana; un formulario no se repite en el mismo envío. */
const lineasTecnicaSchema = z
  .array(lineaSchema)
  .min(1, 'Selecciona al menos un formulario')
  .refine((ls) => new Set(ls.map((l) => l.formularioId)).size === ls.length, 'Hay formularios repetidos.')

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

const comentarioSchema = z.string().trim().min(1).max(2000).nullable().optional()

export const crearProgramacionPrevencionSchema = z
  .object({ obraId: z.coerce.number().int().positive(), fecha: diaSchema, comentario: comentarioSchema, formularioIds: formularioIdsSchema })
  .transform(({ formularioIds, ...rest }) => ({ ...rest, formularios: formularioIds }))

export const crearProgramacionTecnicaSchema = z.object({
  obraId: z.coerce.number().int().positive(),
  fecha: diaSchema,
  comentario: comentarioSchema,
  formularios: lineasTecnicaSchema,
})

export const actualizarComentarioSchema = z.object({
  comentario: z.string().trim().min(1).max(2000).nullable(),
})

export const agregarFormulariosPrevencionSchema = z
  .object({ formularioIds: formularioIdsSchema })
  .transform(({ formularioIds }) => ({ formularios: formularioIds }))

export const agregarFormulariosTecnicaSchema = z.object({ formularios: lineasTecnicaSchema })

/** Edición de la ventana de un formulario técnico agendado. */
export const actualizarVentanaSchema = z
  .object({ fechaInicio: diaSchema, fechaTermino: diaSchema })
  .refine(ventanaCoherente, { message: MSG_VENTANA, path: ['fechaTermino'] })

/** Línea normalizada (ambas áreas). */
export interface LineaInput {
  formularioId: number
  fechaInicio?: string
  fechaTermino?: string
}

export type ListarProgramacionQuery = z.infer<typeof listarProgramacionQuerySchema>
export interface CrearProgramacionInput {
  obraId: number
  fecha: string
  comentario?: string | null
  formularios: LineaInput[]
}
export type ActualizarComentarioInput = z.infer<typeof actualizarComentarioSchema>
export interface AgregarFormulariosInput {
  formularios: LineaInput[]
}
export type ActualizarVentanaInput = z.infer<typeof actualizarVentanaSchema>
