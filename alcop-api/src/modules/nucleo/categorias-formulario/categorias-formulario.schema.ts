import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const listarCategoriasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  areaId: z.coerce.number().int().positive().optional(),
})

export const categoriaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** El `codigo` lo genera el servicio (slug del nombre). El área no se cambia en update. */
export const crearCategoriaSchema = z.object({
  areaId: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  activo: z.boolean().optional(),
})

export const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>
export type ActualizarCategoriaInput = z.infer<typeof actualizarCategoriaSchema>
