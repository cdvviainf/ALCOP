import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const estadoObraSchema = z.enum(['SIN_INICIAR', 'EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA'])
export const rolObraSchema = z.enum(['ADMINISTRADOR', 'JEFE_DE_TERRENO', 'PREVENCIONISTA'])

/** Query de listado: paginación + búsqueda por nombre o código. */
export const listarObrasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

export const obraIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// Al crear, la obra nace en SIN_INICIAR (nucleo-compartido.md §5.1): `estado` NO
// se acepta en el alta, solo por PATCH. Los opcionales aceptan null para poder
// limpiarse (OBR-005).
const obraFields = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  mandante: z.string().trim().min(1).nullable().optional(),
  direccion: z.string().trim().min(1).nullable().optional(),
  comuna: z.string().trim().min(1).nullable().optional(),
  fechaInicio: z.coerce.date().nullable().optional(),
  fechaTerminoEstimada: z.coerce.date().nullable().optional(),
})

// Validación de fechas (OBR-004): cuando ambas vienen, el término no puede ser
// anterior al inicio.
const fechasCoherentes = (d: { fechaInicio?: Date | null; fechaTerminoEstimada?: Date | null }) =>
  !d.fechaInicio || !d.fechaTerminoEstimada || d.fechaTerminoEstimada >= d.fechaInicio
const MSG_FECHAS = {
  message: 'La fecha de término no puede ser anterior al inicio.',
  path: ['fechaTerminoEstimada'],
}

export const crearObraSchema = obraFields.refine(fechasCoherentes, MSG_FECHAS)

export const actualizarObraSchema = obraFields
  .extend({ estado: estadoObraSchema.optional() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })
  .refine(fechasCoherentes, MSG_FECHAS)

// ─── Titulares ───────────────────────────────────────────────────────────────
export const asignarTitularSchema = z.object({
  rolObra: rolObraSchema,
  usuarioId: z.string().trim().min(1),
})

export const titularParamSchema = z.object({
  id: z.coerce.number().int().positive(), // obra
  titularId: z.coerce.number().int().positive(),
})

export type CrearObraInput = z.infer<typeof crearObraSchema>
export type ActualizarObraInput = z.infer<typeof actualizarObraSchema>
export type AsignarTitularInput = z.infer<typeof asignarTitularSchema>
