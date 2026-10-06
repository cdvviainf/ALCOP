import { z } from 'zod'

/**
 * Query del listado de áreas. El endpoint no acepta parámetros funcionales hoy,
 * pero la validación es obligatoria para todo endpoint (CLAUDE.md §12.1): el
 * schema rechaza/ignora cualquier entrada no esperada.
 */
export const listarAreasQuerySchema = z.object({})

export type ListarAreasQuery = z.infer<typeof listarAreasQuerySchema>
