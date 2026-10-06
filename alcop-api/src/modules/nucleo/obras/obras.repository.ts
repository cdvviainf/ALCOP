import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarObraInput, CrearObraInput } from './obras.schema.js'

/** Acceso a datos de Obra (CLAUDE.md §12.2: toda query Prisma vive aquí). */
export const obrasRepository = {
  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.ObraWhereInput = {
      eliminadoEn: null,
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)

    const [rows, total] = await prisma.$transaction([
      prisma.obra.findMany({ where, skip, take, orderBy: { id: 'desc' } }),
      prisma.obra.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.obra.findFirst({ where: { id, eliminadoEn: null } })
  },

  async crear(data: CrearObraInput, creadoPor: string) {
    return prisma.obra.create({
      data: {
        nombre: data.nombre,
        comuna: data.comuna ?? null,
        direccion: data.direccion ?? null,
        fechaInicio: data.fechaInicio ?? null,
        creadoPor,
      },
    })
  },

  async actualizar(id: number, data: ActualizarObraInput) {
    return prisma.obra.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.comuna !== undefined ? { comuna: data.comuna } : {}),
        ...(data.direccion !== undefined ? { direccion: data.direccion } : {}),
        ...(data.fechaInicio !== undefined ? { fechaInicio: data.fechaInicio } : {}),
      },
    })
  },

  async softDelete(id: number) {
    // Obra (provisional) no tiene columna eliminadoPor todavía — solo eliminadoEn.
    return prisma.obra.update({
      where: { id },
      data: { eliminadoEn: new Date() },
    })
  },
}
