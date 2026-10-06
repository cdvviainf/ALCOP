import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

/** Query de listado: paginación + búsqueda opcional por nombre. */
export const listarObrasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

/** Param :id → entero positivo. */
export const obraIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** Body de creación. */
export const crearObraSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  comuna: z.string().trim().min(1).optional(),
  direccion: z.string().trim().min(1).optional(),
  fechaInicio: z.coerce.date().optional(),
})

/** Body de actualización parcial (al menos un campo). */
export const actualizarObraSchema = crearObraSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo a actualizar' }
)

export type ListarObrasQuery = z.infer<typeof listarObrasQuerySchema>
export type CrearObraInput = z.infer<typeof crearObraSchema>
export type ActualizarObraInput = z.infer<typeof actualizarObraSchema>
