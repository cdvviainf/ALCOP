import { z } from 'zod'
import { paginationQuerySchema } from '../../shared/pagination.js'

export const listarUsuariosQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
})

/** El id de Usuario es String (cuid, referencia Better Auth). */
export const usuarioIdParamSchema = z.object({
  id: z.string().trim().min(1),
})

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  perfilId: z.coerce.number().int().positive(),
})

// El email NO es editable (es el login del usuario — decisión 06-10-2026).
export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(1).optional(),
    perfilId: z.coerce.number().int().positive().optional(),
    activo: z.boolean().optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>
