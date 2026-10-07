import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const nivelAccesoSchema = z.enum(['SIN_ACCESO', 'LECTURA', 'TOTAL'])

export const listarPerfilesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

export const perfilIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const permisoInputSchema = z.object({
  funcionId: z.coerce.number().int().positive(),
  nivel: nivelAccesoSchema,
})

// Sin funciones duplicadas en el arreglo de permisos.
const permisosSchema = z
  .array(permisoInputSchema)
  .refine((arr) => new Set(arr.map((p) => p.funcionId)).size === arr.length, {
    message: 'Hay funciones duplicadas en los permisos.',
  })

export const crearPerfilSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  areaPrevencion: z.boolean().optional(),
  areaTecnica: z.boolean().optional(),
  permisos: permisosSchema.optional(),
})

export const actualizarPerfilSchema = crearPerfilSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearPerfilInput = z.infer<typeof crearPerfilSchema>
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>
