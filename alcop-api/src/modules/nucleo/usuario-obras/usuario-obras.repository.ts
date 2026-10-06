import type { Prisma, RolObra } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'

const include = {
  obra: { select: { nombre: true } },
  usuario: { select: { id: true, nombre: true, email: true } },
} as const

/** Acceso a datos de UsuarioObra (CLAUDE.md §12.2). */
export const usuarioObrasRepository = {
  async listar(pagination: PaginationQuery, obraId?: number) {
    const where: Prisma.UsuarioObraWhereInput = { ...(obraId ? { obraId } : {}) }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.usuarioObra.findMany({
        where,
        skip,
        take,
        orderBy: [{ obraId: 'asc' }, { rolObra: 'asc' }],
        include,
      }),
      prisma.usuarioObra.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.usuarioObra.findUnique({ where: { id }, include })
  },

  /** Upsert por la clave compuesta (obraId, rolObra): reemplaza al titular. */
  async asignar(obraId: number, rolObra: RolObra, usuarioId: string) {
    return prisma.usuarioObra.upsert({
      where: { obraId_rolObra: { obraId, rolObra } },
      update: { usuarioId },
      create: { obraId, rolObra, usuarioId },
      include,
    })
  },

  async eliminar(id: number) {
    // No hay soft delete: la asignación es un estado actual, no un registro
    // histórico (el historial de notificaciones vive en el módulo alertas).
    return prisma.usuarioObra.delete({ where: { id } })
  },

  async buscarObra(obraId: number) {
    return prisma.obra.findFirst({ where: { id: obraId, eliminadoEn: null }, select: { id: true } })
  },

  async buscarUsuarioConNiveles(usuarioId: string) {
    return prisma.usuario.findFirst({
      where: { id: usuarioId, eliminadoEn: null, activo: true },
      select: {
        id: true,
        perfil: { select: { nivelPrevencion: true, nivelTecnica: true } },
      },
    })
  },
}
