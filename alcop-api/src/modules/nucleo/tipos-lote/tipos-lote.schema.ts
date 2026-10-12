import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

/** Query de listado: paginación + búsqueda por nombre. */
export const listarTiposLoteQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

export const tipoLoteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** Query del picker de opciones (solo búsqueda). */
export const opcionesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
})

export const tipoLoteProcedimientoParamSchema = z.object({
  id: z.coerce.number().int().positive(), // tipo de lote
  procedimientoId: z.coerce.number().int().positive(),
})

export const crearTipoLoteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  orden: z.number().int().min(0).optional(),
})

export const actualizarTipoLoteSchema = z
  .object({
    nombre: z.string().trim().min(1).optional(),
    orden: z.number().int().min(0).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

/** Vincular un procedimiento a un tipo de lote. */
export const vincularProcedimientoSchema = z.object({
  procedimientoId: z.coerce.number().int().positive(),
})

export type CrearTipoLoteInput = z.infer<typeof crearTipoLoteSchema>
export type ActualizarTipoLoteInput = z.infer<typeof actualizarTipoLoteSchema>
export type VincularProcedimientoInput = z.infer<typeof vincularProcedimientoSchema>
