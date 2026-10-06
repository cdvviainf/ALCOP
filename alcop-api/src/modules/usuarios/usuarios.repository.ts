import { prisma } from '../../lib/prisma.js'

/** Acceso a datos de Usuario (CLAUDE.md §12.2). */
export const usuariosRepository = {
  /** Usuario activo + su perfil, por id de dominio. Solo campos no sensibles. */
  async obtenerConPerfil(id: string) {
    return prisma.usuario.findFirst({
      where: { id, eliminadoEn: null, activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        perfil: {
          select: { id: true, nombre: true, nivelPrevencion: true, nivelTecnica: true },
        },
      },
    })
  },
}
