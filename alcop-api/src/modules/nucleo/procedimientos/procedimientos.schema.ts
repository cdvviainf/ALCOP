import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

/** Query de listado: paginación + búsqueda por nombre o código. */
export const listarProcedimientosQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

export const procedimientoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** Query del picker de opciones (solo búsqueda). */
export const opcionesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
})

export const procedimientoFormularioParamSchema = z.object({
  id: z.coerce.number().int().positive(), // procedimiento
  formularioId: z.coerce.number().int().positive(),
})

// Validación de vigencia (lotes-procedimientos.md §7): si viene `vigenciaHasta`,
// no puede ser anterior a `vigenciaDesde`.
const vigenciaCoherente = (d: { vigenciaDesde?: Date | null; vigenciaHasta?: Date | null }) =>
  !d.vigenciaDesde || !d.vigenciaHasta || d.vigenciaHasta >= d.vigenciaDesde
const MSG_VIGENCIA = {
  message: 'La fecha de término de vigencia no puede ser anterior al inicio.',
  path: ['vigenciaHasta'],
}

/** Metadatos del alta — se parsean desde los campos del multipart (el PDF va aparte). */
export const crearProcedimientoSchema = z
  .object({
    codigo: z.string().trim().min(1, 'El código es obligatorio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    vigenciaDesde: z.coerce.date(),
    vigenciaHasta: z.coerce.date().nullable().optional(),
  })
  .refine(vigenciaCoherente, MSG_VIGENCIA)

/** Edición de metadatos (JSON). El PDF se reemplaza por un endpoint aparte. */
export const actualizarProcedimientoSchema = z
  .object({
    codigo: z.string().trim().min(1).optional(),
    nombre: z.string().trim().min(1).optional(),
    vigenciaDesde: z.coerce.date().optional(),
    vigenciaHasta: z.coerce.date().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })
  .refine(vigenciaCoherente, MSG_VIGENCIA)

/** Vincular un formulario de control al procedimiento. */
export const vincularFormularioSchema = z.object({
  formularioId: z.coerce.number().int().positive(),
})

export type CrearProcedimientoInput = z.infer<typeof crearProcedimientoSchema>
export type ActualizarProcedimientoInput = z.infer<typeof actualizarProcedimientoSchema>
export type VincularFormularioInput = z.infer<typeof vincularFormularioSchema>
