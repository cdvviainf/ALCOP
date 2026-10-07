import type { NivelAcceso, Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'

type PermisoInput = { funcionId: number; nivel: NivelAcceso }

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
      rows: rows.map((r) => ({ ...r, permisos: [], usuariosActivos: countMap.get(r.id) ?? 0 })),
      total,
    }
  },

  async buscarPorId(id: number) {
    return prisma.perfil.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        permisos: { select: { funcionId: true, nivel: true, funcion: { select: { codigo: true } } } },
      },
    })
  },

  async contarUsuarios(perfilId: number) {
    return prisma.usuario.count({ where: { perfilId, eliminadoEn: null } })
  },

  async crear(data: {
    nombre: string
    areaPrevencion: boolean
    areaTecnica: boolean
    permisos: PermisoInput[]
  }) {
    const perfil = await prisma.perfil.create({
      data: {
        nombre: data.nombre,
        areaPrevencion: data.areaPrevencion,
        areaTecnica: data.areaTecnica,
        permisos: { create: data.permisos.map((p) => ({ funcionId: p.funcionId, nivel: p.nivel })) },
      },
      include: {
        permisos: { select: { funcionId: true, nivel: true, funcion: { select: { codigo: true } } } },
      },
    })
    return perfil
  },

  async actualizar(
    id: number,
    data: {
      nombre?: string
      areaPrevencion?: boolean
      areaTecnica?: boolean
      permisos?: PermisoInput[]
    }
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.perfil.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(data.areaPrevencion !== undefined ? { areaPrevencion: data.areaPrevencion } : {}),
          ...(data.areaTecnica !== undefined ? { areaTecnica: data.areaTecnica } : {}),
        },
      })
      // Reemplazo completo de permisos cuando vienen en el payload.
      if (data.permisos) {
        await tx.perfilPermiso.deleteMany({ where: { perfilId: id } })
        if (data.permisos.length > 0) {
          await tx.perfilPermiso.createMany({
            data: data.permisos.map((p) => ({ perfilId: id, funcionId: p.funcionId, nivel: p.nivel })),
          })
        }
      }
      return tx.perfil.findFirstOrThrow({
        where: { id },
        include: {
          permisos: { select: { funcionId: true, nivel: true, funcion: { select: { codigo: true } } } },
        },
      })
    })
  },

  async softDelete(id: number) {
    return prisma.perfil.update({ where: { id }, data: { eliminadoEn: new Date() } })
  },
}
