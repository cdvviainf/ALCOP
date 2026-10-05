import { z } from 'zod'

/**
 * Query estándar de paginación (CLAUDE.md §6):
 *   ?page=1&limit=20
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

/** Traduce page/limit a skip/take para Prisma. */
export function toPrismaRange({ page, limit }: PaginationQuery): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit }
}

/** Arma la respuesta paginada estándar. */
export function paginate<T>(data: T[], total: number, { page, limit }: PaginationQuery): Paginated<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}
