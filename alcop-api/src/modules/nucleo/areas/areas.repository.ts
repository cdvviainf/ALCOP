import { prisma } from '../../../lib/prisma.js'

/** Acceso a datos de Area (CLAUDE.md §12.2). */
export const areasRepository = {
  async listar() {
    return prisma.area.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    })
  },
}
