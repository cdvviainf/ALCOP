import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarPerfilInput, CrearPerfilInput } from './perfiles.schema.js'

/** Acceso a datos de Perfil (CLAUDE.md §12.2). */
export const perfilesRepository = {
  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.PerfilWhereInput = {
      eliminadoEn: null,
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)

    const [rows, total] = await prisma.$transaction([
      prisma.perfil.findMany({ where, skip, take, orderBy: { id: 'asc' } }),
      prisma.perfil.count({ where }),
    ])

    // Conteo de usuarios activos por perfil en una sola query (sin N+1).
    const ids = rows.map((r) => r.id)
    const counts = ids.length
      ? await prisma.usuario.groupBy({
          by: ['perfilId'],
          where: { perfilId: { in: ids }, eliminadoEn: null },
          _count: { _all: true },
        })
      : []
    const countMap = new Map(counts.map((c) => [c.perfilId, c._count._all]))

    return {
      rows: rows.map((r) => ({ ...r, usuariosActivos: countMap.get(r.id) ?? 0 })),
      total,
    }
  },

  async buscarPorId(id: number) {
    return prisma.perfil.findFirst({ where: { id, eliminadoEn: null } })
  },

  /** Usuarios no eliminados que referencian este perfil (para el guard de borrado). */
  async contarUsuarios(perfilId: number) {
    return prisma.usuario.count({ where: { perfilId, eliminadoEn: null } })
  },

  async crear(data: CrearPerfilInput) {
    return prisma.perfil.create({
      data: {
        nombre: data.nombre,
        nivelPrevencion: data.nivelPrevencion,
        nivelTecnica: data.nivelTecnica,
      },
    })
  },

  async actualizar(id: number, data: ActualizarPerfilInput) {
    return prisma.perfil.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.nivelPrevencion !== undefined ? { nivelPrevencion: data.nivelPrevencion } : {}),
        ...(data.nivelTecnica !== undefined ? { nivelTecnica: data.nivelTecnica } : {}),
      },
    })
  },

  async softDelete(id: number) {
    return prisma.perfil.update({ where: { id }, data: { eliminadoEn: new Date() } })
  },
}
