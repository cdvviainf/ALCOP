import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarTipoLoteInput, CrearTipoLoteInput } from './tipos-lote.schema.js'

/** Acceso a datos de TipoLote y sus procedimientos (CLAUDE.md §12.2). */
export const tiposLoteRepository = {
  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.TipoLoteWhereInput = {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.tipoLote.findMany({ where, skip, take, orderBy: [{ orden: 'asc' }, { id: 'asc' }] }),
      prisma.tipoLote.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.tipoLote.findFirst({ where: { id, eliminadoEn: null } })
  },

  /**
   * Picker: tipos de lote ACTIVOS, proyección mínima (id/codigo/nombre). Para el
   * selector de la pantalla Lotes de Obra (consumido por OBRAS) sin exponer el
   * maestro completo ni registros inactivos (QA-LP-010).
   */
  async listarOpciones(q?: string) {
    const where: Prisma.TipoLoteWhereInput = {
      eliminadoEn: null,
      activo: true,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    return prisma.tipoLote.findMany({
      where,
      take: 100,
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
      select: { id: true, codigo: true, nombre: true },
    })
  },

  async buscarConProcedimientos(id: number) {
    return prisma.tipoLote.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        procedimientos: {
          where: { procedimiento: { eliminadoEn: null } },
          orderBy: { id: 'asc' },
          include: {
            procedimiento: { select: { id: true, codigo: true, nombre: true, activo: true } },
          },
        },
      },
    })
  },

  async buscarPorCodigo(codigo: string) {
    return prisma.tipoLote.findFirst({ where: { codigo, eliminadoEn: null }, select: { id: true } })
  },

  async crear(data: CrearTipoLoteInput, codigo: string, creadoPor: string) {
    return prisma.tipoLote.create({
      data: { codigo, nombre: data.nombre, orden: data.orden ?? 0, creadoPor },
    })
  },

  async actualizar(id: number, data: ActualizarTipoLoteInput, codigo: string | undefined, actualizadoPor: string) {
    return prisma.tipoLote.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(codigo !== undefined ? { codigo } : {}),
        ...(data.orden !== undefined ? { orden: data.orden } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        actualizadoPor,
      },
    })
  },

  async softDelete(id: number, eliminadoPor: string) {
    return prisma.tipoLote.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  /** Cuenta las obras que usan este tipo de lote (bloquea el borrado). */
  async contarUsoEnObras(tipoLoteId: number) {
    return prisma.obraLote.count({ where: { tipoLoteId, eliminadoEn: null } })
  },

  // ─── Procedimientos vinculados ────────────────────────────────────────────
  async listarProcedimientos(tipoLoteId: number) {
    return prisma.tipoLoteProcedimiento.findMany({
      where: { tipoLoteId, procedimiento: { eliminadoEn: null } },
      orderBy: { id: 'asc' },
      include: { procedimiento: { select: { id: true, codigo: true, nombre: true, activo: true } } },
    })
  },

  async procedimientoActivo(procedimientoId: number) {
    return prisma.procedimiento.findFirst({
      where: { id: procedimientoId, eliminadoEn: null, activo: true },
      select: { id: true },
    })
  },

  async existeVinculo(tipoLoteId: number, procedimientoId: number) {
    const v = await prisma.tipoLoteProcedimiento.findFirst({
      where: { tipoLoteId, procedimientoId },
      select: { id: true },
    })
    return v !== null
  },

  async vincularProcedimiento(tipoLoteId: number, procedimientoId: number, creadoPor: string) {
    return prisma.tipoLoteProcedimiento.create({ data: { tipoLoteId, procedimientoId, creadoPor } })
  },

  async desvincularProcedimiento(tipoLoteId: number, procedimientoId: number) {
    // Arista M:N: borrado físico (no es entidad de negocio).
    await prisma.tipoLoteProcedimiento.deleteMany({ where: { tipoLoteId, procedimientoId } })
  },
}
