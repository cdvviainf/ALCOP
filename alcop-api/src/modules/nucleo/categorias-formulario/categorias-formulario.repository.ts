import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarCategoriaInput } from './categorias-formulario.schema.js'

/** Cliente Prisma o de transacción (para el lock por fila en la baja). */
type DbClient = Prisma.TransactionClient | typeof prisma

/** Acceso a datos de CategoriaFormulario (CLAUDE.md §12.2). */
export const categoriasRepository = {
  async listar(pagination: PaginationQuery, q?: string, areaId?: number, codigosArea?: string[]) {
    const where: Prisma.CategoriaFormularioWhereInput = {
      eliminadoEn: null,
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
      ...(areaId ? { areaId } : {}),
      // Restringe a las áreas accesibles del solicitante (visibilidad §5/§6).
      ...(codigosArea ? { area: { codigo: { in: codigosArea } } } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)

    const [rows, total] = await prisma.$transaction([
      prisma.categoriaFormulario.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'asc' },
        include: { area: { select: { codigo: true, nombre: true } } },
      }),
      prisma.categoriaFormulario.count({ where }),
    ])

    // Conteo de formularios no eliminados por categoría, sin N+1.
    const ids = rows.map((r) => r.id)
    const counts = ids.length
      ? await prisma.formulario.groupBy({
          by: ['categoriaId'],
          where: { categoriaId: { in: ids }, eliminadoEn: null },
          _count: { _all: true },
        })
      : []
    const countMap = new Map(counts.map((c) => [c.categoriaId, c._count._all]))

    return {
      rows: rows.map((r) => ({ ...r, formulariosCount: countMap.get(r.id) ?? 0 })),
      total,
    }
  },

  async buscarPorId(id: number) {
    return prisma.categoriaFormulario.findFirst({
      where: { id, eliminadoEn: null },
      include: { area: { select: { codigo: true, nombre: true } } },
    })
  },

  /** Picker: categorías ACTIVAS de un área, proyección mínima (id/codigo/nombre). */
  async listarOpciones(areaId: number) {
    return prisma.categoriaFormulario.findMany({
      where: { areaId, eliminadoEn: null, activo: true },
      orderBy: { nombre: 'asc' },
      take: 100,
      select: { id: true, codigo: true, nombre: true },
    })
  },

  async buscarArea(areaId: number) {
    return prisma.area.findUnique({ where: { id: areaId }, select: { id: true, codigo: true, nombre: true } })
  },

  /** ¿Existe otra categoría no eliminada con el mismo (areaId, codigo)? */
  async existeCodigoEnArea(areaId: number, codigo: string, exceptoId?: number) {
    const existente = await prisma.categoriaFormulario.findFirst({
      where: { areaId, codigo, eliminadoEn: null, ...(exceptoId ? { id: { not: exceptoId } } : {}) },
      select: { id: true },
    })
    return existente !== null
  },

  /** Bloquea la fila de la categoría (FOR UPDATE) para serializar la baja frente
   *  al alta de subcategorías, que bloquea esa misma fila (QA-OKA-006). */
  async lockCategoria(tx: Prisma.TransactionClient, id: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number }>
    >`SELECT id FROM "CategoriaFormulario" WHERE id = ${id} AND "eliminadoEn" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  async contarFormularios(categoriaId: number, db: DbClient = prisma) {
    return db.formulario.count({ where: { categoriaId, eliminadoEn: null } })
  },

  async contarSubcategorias(categoriaId: number, db: DbClient = prisma) {
    return db.subcategoriaFormulario.count({ where: { categoriaId, eliminadoEn: null } })
  },

  async crear(data: { areaId: number; codigo: string; nombre: string; activo: boolean; creadoPor: string }) {
    return prisma.categoriaFormulario.create({
      data: {
        areaId: data.areaId,
        codigo: data.codigo,
        nombre: data.nombre,
        activo: data.activo,
        creadoPor: data.creadoPor,
      },
      include: { area: { select: { codigo: true, nombre: true } } },
    })
  },

  async actualizar(id: number, data: ActualizarCategoriaInput & { codigo?: string }) {
    return prisma.categoriaFormulario.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
      },
      include: { area: { select: { codigo: true, nombre: true } } },
    })
  },

  async softDelete(id: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.categoriaFormulario.update({
      where: { id },
      data: { eliminadoEn: new Date(), eliminadoPor },
    })
  },
}
