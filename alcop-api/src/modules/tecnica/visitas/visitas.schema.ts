import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (formato HH:MM)')

const horasCoherentes = (d: { horaInicio?: string | null; horaTermino?: string | null }) =>
  !d.horaInicio || !d.horaTermino || d.horaTermino >= d.horaInicio
const MSG_HORAS = { message: 'La hora de término no puede ser anterior al inicio.', path: ['horaTermino'] }

export const estadoVisitaSchema = z.enum(['EN_CURSO', 'FINALIZADA'])
export const calidadImagenSchema = z.enum(['ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA'])
export const tipoRegistroSchema = z.enum(['HALLAZGO', 'NOTA_TECNICA'])

export const listarVisitasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  obraId: z.coerce.number().int().positive().optional(),
  usuarioId: z.string().trim().min(1).optional(),
  estado: estadoVisitaSchema.optional(),
  orden: z.enum(['fecha', 'obra', 'inspector']).optional().default('fecha'),
  dir: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const visitaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const hallazgoParamSchema = z.object({
  id: z.coerce.number().int().positive(), // visita
  hallazgoId: z.coerce.number().int().positive(),
})

export const fotoIdParamSchema = z.object({
  fotoId: z.coerce.number().int().positive(),
})

export const hallazgoIdParamSchema = z.object({
  hallazgoId: z.coerce.number().int().positive(),
})

export const crearVisitaSchema = z
  .object({
    obraId: z.coerce.number().int().positive(),
    fecha: z.coerce.date(),
    horaInicio: horaSchema.nullable().optional(),
    horaTermino: horaSchema.nullable().optional(),
  })
  .refine(horasCoherentes, MSG_HORAS)

export const actualizarVisitaSchema = z
  .object({
    fecha: z.coerce.date().optional(),
    horaInicio: horaSchema.nullable().optional(),
    horaTermino: horaSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' })
  .refine(horasCoherentes, MSG_HORAS)

export const finalizarVisitaSchema = z.object({
  resumenFinal: z.string().trim().min(1).nullable().optional(),
})

// Tipo de registro (tecnica.md §7): HALLAZGO exige tipo de hallazgo + comentario
// + foto (la foto se valida al finalizar); NOTA_TECNICA exige solo comentario.
export const crearHallazgoSchema = z
  .object({
    loteUnidadId: z.coerce.number().int().positive(),
    tipoRegistro: tipoRegistroSchema,
    tipoHallazgoId: z.coerce.number().int().positive().nullable().optional(),
    comentario: z.string().trim().min(1, 'El comentario es obligatorio'),
  })
  .superRefine((data, ctx) => {
    if (data.tipoRegistro === 'HALLAZGO' && !data.tipoHallazgoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El tipo de hallazgo es obligatorio.',
        path: ['tipoHallazgoId'],
      })
    }
  })

export const actualizarHallazgoSchema = z
  .object({
    loteUnidadId: z.coerce.number().int().positive().optional(),
    tipoRegistro: tipoRegistroSchema.optional(),
    tipoHallazgoId: z.coerce.number().int().positive().nullable().optional(),
    comentario: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' })

export type CrearVisitaInput = z.infer<typeof crearVisitaSchema>
export type ActualizarVisitaInput = z.infer<typeof actualizarVisitaSchema>
export type FinalizarVisitaInput = z.infer<typeof finalizarVisitaSchema>
export type CrearHallazgoInput = z.infer<typeof crearHallazgoSchema>
export type ActualizarHallazgoInput = z.infer<typeof actualizarHallazgoSchema>
