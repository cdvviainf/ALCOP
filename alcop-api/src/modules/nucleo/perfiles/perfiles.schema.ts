import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

/** Niveles de acceso por Área (enum NivelAcceso de Prisma). */
export const nivelAccesoSchema = z.enum(['SIN_ACCESO', 'LECTURA', 'TOTAL'])

export const listarPerfilesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

export const perfilIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const crearPerfilSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  nivelPrevencion: nivelAccesoSchema.default('SIN_ACCESO'),
  nivelTecnica: nivelAccesoSchema.default('SIN_ACCESO'),
})

export const actualizarPerfilSchema = crearPerfilSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearPerfilInput = z.infer<typeof crearPerfilSchema>
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>
