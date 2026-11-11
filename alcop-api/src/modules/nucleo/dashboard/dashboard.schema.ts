import { z } from 'zod'

/** GET /dashboard — horizonte de la agenda en días (por defecto 15). */
export const dashboardQuerySchema = z
  .object({
    dias: z.coerce.number().int().min(1).max(60).default(15),
  })
  .strict()

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>

/** GET /dashboard/visitas-mensuales — serie mensual; `obraId` opcional (todas las visibles). */
export const visitasMensualesQuerySchema = z
  .object({
    obraId: z.coerce.number().int().positive().optional(),
    meses: z.coerce.number().int().min(3).max(36).default(12),
  })
  .strict()
