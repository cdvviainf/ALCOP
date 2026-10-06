import { z } from 'zod'

/** Body de creación. `codigo` lo genera el factory (slug del nombre). */
export const crearNivelRiesgoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  orden: z.coerce.number().int().min(0).optional(),
  activo: z.boolean().optional(),
})

/** Body de actualización parcial (al menos un campo). */
export const actualizarNivelRiesgoSchema = crearNivelRiesgoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type CrearNivelRiesgoInput = z.infer<typeof crearNivelRiesgoSchema>
export type ActualizarNivelRiesgoInput = z.infer<typeof actualizarNivelRiesgoSchema>
