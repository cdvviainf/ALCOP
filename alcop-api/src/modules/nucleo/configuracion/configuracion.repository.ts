import { prisma } from '../../../lib/prisma.js'

/** Acceso a datos de Configuracion (clave/valor) — CLAUDE.md §12.2. */
export const configuracionRepository = {
  async obtenerValor(clave: string) {
    return prisma.configuracion.findUnique({ where: { clave }, select: { valor: true } })
  },

  async setValor(clave: string, valor: string) {
    return prisma.configuracion.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor },
    })
  },
}
