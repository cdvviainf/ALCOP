import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const listarSubcategoriasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  areaId: z.coerce.number().int().positive().optional(),
})

export const subcategoriaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** Query del picker de subcategorías de una categoría (para el alta de hallazgos). */
export const opcionesSubcategoriaQuerySchema = z.object({
  categoriaId: z.coerce.number().int().positive(),
})

/** El `codigo` lo genera el servicio (slug del nombre). La categoría no se cambia en update. */
export const crearSubcategoriaSchema = z.object({
  categoriaId: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  activo: z.boolean().optional(),
})

export const actualizarSubcategoriaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearSubcategoriaInput = z.infer<typeof crearSubcategoriaSchema>
export type ActualizarSubcategoriaInput = z.infer<typeof actualizarSubcategoriaSchema>
