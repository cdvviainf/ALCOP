import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

/**
 * Instancia singleton de PrismaClient.
 * En desarrollo evitamos recrear el cliente en cada hot-reload de tsx watch
 * guardándolo en el objeto global.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
