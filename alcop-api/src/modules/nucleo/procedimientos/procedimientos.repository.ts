import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarProcedimientoInput } from './procedimientos.schema.js'

/** Acceso a datos de Procedimiento y sus formularios de control (CLAUDE.md §12.2). */
export const procedimientosRepository = {
  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.ProcedimientoWhereInput = {
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
      prisma.procedimiento.findMany({ where, skip, take, orderBy: { id: 'desc' } }),
      prisma.procedimiento.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.procedimiento.findFirst({ where: { id, eliminadoEn: null } })
  },

  /**
   * Picker: procedimientos ACTIVOS, proyección mínima (id/codigo/nombre). Para el
   * selector del maestro Tipos de Lote (consumido por TIPOS_LOTE) sin exponer el
   * maestro completo, inactivos ni la URL del PDF (QA-LP-010).
   */
  async listarOpciones(q?: string) {
    const where: Prisma.ProcedimientoWhereInput = {
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
    return prisma.procedimiento.findMany({
      where,
      take: 100,
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    })
  },

  async buscarConFormularios(id: number) {
    return prisma.procedimiento.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        formularios: {
          where: { formulario: { eliminadoEn: null } },
          orderBy: { id: 'asc' },
          include: {
            formulario: { select: { id: true, codigo: true, nombre: true, areaId: true, activo: true } },
          },
        },
      },
    })
  },

  async crear(
    data: { codigo: string; nombre: string; vigenciaDesde: Date; vigenciaHasta: Date | null },
    archivoUrl: string,
    creadoPor: string
  ) {
    return prisma.procedimiento.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        vigenciaDesde: data.vigenciaDesde,
        vigenciaHasta: data.vigenciaHasta,
        archivoUrl,
        creadoPor,
      },
    })
  },

  async actualizar(id: number, data: ActualizarProcedimientoInput, actualizadoPor: string) {
    return prisma.procedimiento.update({
      where: { id },
      data: {
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.vigenciaDesde !== undefined ? { vigenciaDesde: data.vigenciaDesde } : {}),
        ...(data.vigenciaHasta !== undefined ? { vigenciaHasta: data.vigenciaHasta } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        actualizadoPor,
      },
    })
  },

  async actualizarArchivo(id: number, archivoUrl: string, actualizadoPor: string) {
    return prisma.procedimiento.update({ where: { id }, data: { archivoUrl, actualizadoPor } })
  },

  async softDelete(id: number, eliminadoPor: string) {
    return prisma.procedimiento.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  async buscarPorCodigo(codigo: string, exceptoId?: number) {
    return prisma.procedimiento.findFirst({
      where: { codigo, eliminadoEn: null, ...(exceptoId ? { id: { not: exceptoId } } : {}) },
      select: { id: true },
    })
  },

  /**
   * Cuenta los tipos de lote ACTIVOS que usan este procedimiento (bloquea el
   * borrado). Spec §6: solo un TipoLote activo bloquea; los inactivos no (QA-LP-006).
   */
  async contarUsoEnTiposLote(procedimientoId: number) {
    return prisma.tipoLoteProcedimiento.count({
      where: { procedimientoId, tipoLote: { eliminadoEn: null, activo: true } },
    })
  },

  // ─── Formularios de control vinculados ────────────────────────────────────
  async listarFormularios(procedimientoId: number) {
    return prisma.procedimientoFormulario.findMany({
      where: { procedimientoId, formulario: { eliminadoEn: null } },
      orderBy: { id: 'asc' },
      include: { formulario: { select: { id: true, codigo: true, nombre: true, areaId: true, activo: true } } },
    })
  },

  async formularioActivo(formularioId: number) {
    return prisma.formulario.findFirst({
      where: { id: formularioId, eliminadoEn: null, activo: true },
      select: { id: true },
    })
  },

  async existeVinculo(procedimientoId: number, formularioId: number) {
    const v = await prisma.procedimientoFormulario.findFirst({
      where: { procedimientoId, formularioId },
      select: { id: true },
    })
    return v !== null
  },

  async vincularFormulario(procedimientoId: number, formularioId: number, creadoPor: string) {
    return prisma.procedimientoFormulario.create({ data: { procedimientoId, formularioId, creadoPor } })
  },

  async desvincularFormulario(procedimientoId: number, formularioId: number) {
    await prisma.procedimientoFormulario.deleteMany({ where: { procedimientoId, formularioId } })
  },
}
