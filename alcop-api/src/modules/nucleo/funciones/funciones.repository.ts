import { prisma } from '../../../lib/prisma.js'

/** Acceso a datos de Funcion (CLAUDE.md §12.2). */
export const funcionesRepository = {
  async listar() {
    return prisma.funcion.findMany({
      orderBy: [{ area: 'asc' }, { orden: 'asc' }],
      select: { id: true, codigo: true, nombre: true, area: true, orden: true },
    })
  },
}
