import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarSubcategoriaInput } from './subcategorias-formulario.schema.js'

/** Cliente Prisma o de transacción (para el lock por fila de la categoría padre). */
type DbClient = Prisma.TransactionClient | typeof prisma

const categoriaInclude = {
  categoria: { select: { id: true, nombre: true, areaId: true, area: { select: { codigo: true, nombre: true } } } },
} as const

/** Acceso a datos de SubcategoriaFormulario (CLAUDE.md §12.2). */
export const subcategoriasRepository = {
  async listar(
    pagination: PaginationQuery,
    q?: string,
    categoriaId?: number,
    areaId?: number,
    codigosArea?: string[]
  ) {
    const where: Prisma.SubcategoriaFormularioWhereInput = {
      eliminadoEn: null,
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      // La categoría padre debe seguir vigente (QA-OKA-004) + filtro por área y
      // visibilidad (§5/§6), que van sobre la categoría.
      categoria: {
        eliminadoEn: null,
        ...(areaId ? { areaId } : {}),
        ...(codigosArea ? { area: { codigo: { in: codigosArea } } } : {}),
      },
    }
    const { skip, take } = toPrismaRange(pagination)

    const [rows, total] = await prisma.$transaction([
      prisma.subcategoriaFormulario.findMany({ where, skip, take, orderBy: { id: 'asc' }, include: categoriaInclude }),
      prisma.subcategoriaFormulario.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    // Exige categoría padre vigente (QA-OKA-004): una subcategoría bajo un padre
    // eliminado se trata como inexistente.
    return prisma.subcategoriaFormulario.findFirst({
      where: { id, eliminadoEn: null, categoria: { eliminadoEn: null } },
      include: categoriaInclude,
    })
  },

  /** Picker: subcategorías ACTIVAS de una categoría, proyección mínima. */
  async listarOpciones(categoriaId: number) {
    return prisma.subcategoriaFormulario.findMany({
      where: { categoriaId, eliminadoEn: null, activo: true },
      orderBy: { nombre: 'asc' },
      take: 100,
      select: { id: true, codigo: true, nombre: true },
    })
  },

  /** Categoría padre (para derivar el área y validar existencia). */
  async buscarCategoria(categoriaId: number) {
    return prisma.categoriaFormulario.findFirst({
      where: { id: categoriaId, eliminadoEn: null },
      select: { id: true, nombre: true, areaId: true, area: { select: { codigo: true, nombre: true } } },
    })
  },

  /**
   * Bloquea la fila de la categoría padre (FOR UPDATE por id) y devuelve si sigue
   * viva. Serializa el alta de subcategoría frente a la baja de la categoría, que
   * también bloquea esa fila (QA-OKA-006): la FK solo exige existencia física.
   */
  async lockCategoriaViva(tx: Prisma.TransactionClient, categoriaId: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number; eliminadoEn: Date | null }>
    >`SELECT id, "eliminadoEn" FROM "CategoriaFormulario" WHERE id = ${categoriaId} FOR UPDATE`
    const row = rows[0]
    return !!row && row.eliminadoEn === null
  },

  /** ¿Existe otra subcategoría no eliminada con el mismo (categoriaId, codigo)? */
  async existeCodigoEnCategoria(categoriaId: number, codigo: string, exceptoId?: number) {
    const existente = await prisma.subcategoriaFormulario.findFirst({
      where: { categoriaId, codigo, eliminadoEn: null, ...(exceptoId ? { id: { not: exceptoId } } : {}) },
      select: { id: true },
    })
    return existente !== null
  },

  async crear(
    data: { categoriaId: number; codigo: string; nombre: string; activo: boolean; creadoPor: string },
    db: DbClient = prisma
  ) {
    return db.subcategoriaFormulario.create({
      data: {
        categoriaId: data.categoriaId,
        codigo: data.codigo,
        nombre: data.nombre,
        activo: data.activo,
        creadoPor: data.creadoPor,
      },
      include: categoriaInclude,
    })
  },

  async actualizar(id: number, data: ActualizarSubcategoriaInput & { codigo?: string; actualizadoPor: string }) {
    return prisma.subcategoriaFormulario.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        actualizadoPor: data.actualizadoPor,
      },
      include: categoriaInclude,
    })
  },

  async softDelete(id: number, eliminadoPor: string) {
    return prisma.subcategoriaFormulario.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },
}
