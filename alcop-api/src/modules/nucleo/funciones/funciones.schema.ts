import { z } from 'zod'

/** El GET no acepta parámetros funcionales; la validación es obligatoria igual. */
export const listarFuncionesQuerySchema = z.object({})
