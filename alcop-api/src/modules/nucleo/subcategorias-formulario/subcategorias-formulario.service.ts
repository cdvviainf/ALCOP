import { Prisma, type NivelAcceso } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { slugCodigo } from '../../../shared/slug.js'
import { subcategoriasRepository } from './subcategorias-formulario.repository.js'
import type { ActualizarSubcategoriaInput, CrearSubcategoriaInput } from './subcategorias-formulario.schema.js'
import type { SubcategoriaFormularioDTO } from './subcategorias-formulario.types.js'

/** Acceso del solicitante: admin (bypass) o mapa de permisos efectivos por función. */
export type Acceso = { esAdmin?: boolean; permisos?: Record<string, NivelAcceso> }

// Las subcategorías se gobiernan con la MISMA función que las categorías del área
// (reutilizado 22-10-2026): administrar categorías ⇒ administrar sus subcategorías.
const CAT_FUNCION: Record<string, string> = {
  PREVENCION: 'PREV_CAT_CATEGORIAS',
  TECNICA: 'TEC_CAT_CATEGORIAS',
}
// El picker (alta de hallazgos) también lo necesita quien inspecciona el área.
const INSPECCION_FUNCION: Record<string, string> = {
  PREVENCION: 'PREV_INSPECCION',
  TECNICA: 'TEC_INSPECCION',
}

type FilaConCategoria = {
  id: number
  categoriaId: number
  codigo: string
  nombre: string
  activo: boolean
  creadoEn: Date
  categoria: { id: number; nombre: string; areaId: number; area: { codigo: string; nombre: string } }
}

function toDTO(row: FilaConCategoria): SubcategoriaFormularioDTO {
  return {
    id: row.id,
    categoriaId: row.categoriaId,
    categoriaNombre: row.categoria.nombre,
    areaId: row.categoria.areaId,
    areaCodigo: row.categoria.area.codigo,
    areaNombre: row.categoria.area.nombre,
    codigo: row.codigo,
    nombre: row.nombre,
    activo: row.activo,
    creadoEn: row.creadoEn.toISOString(),
  }
}

/** Nivel efectivo del solicitante sobre la función Categorías del área dada. */
function nivelCategoriasDeArea(acceso: Acceso, areaCodigo: string): NivelAcceso {
  if (acceso.esAdmin) return 'TOTAL'
  const codigo = CAT_FUNCION[areaCodigo]
  return (codigo ? acceso.permisos?.[codigo] : undefined) ?? 'SIN_ACCESO'
}

/** Mutar una subcategoría exige TOTAL en la función Categorías del Área de su categoría padre. */
function exigirTotalEnArea(acceso: Acceso, areaCodigo: string) {
  if (nivelCategoriasDeArea(acceso, areaCodigo) !== 'TOTAL') {
    throw new ForbiddenError(
      `Se requiere acceso total en el área ${areaCodigo} para administrar sus subcategorías.`
    )
  }
}

/** Traduce la violación del índice único parcial (categoriaId, codigo) a 409, por si
 *  dos altas concurrentes superan el chequeo previo (QA-OKA-002). */
function esCodigoDuplicado(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export const subcategoriasService = {
  async listar(
    pagination: PaginationQuery,
    acceso: Acceso,
    q?: string,
    categoriaId?: number,
    areaId?: number
  ): Promise<Paginated<SubcategoriaFormularioDTO>> {
    // Solo las áreas con acceso (≥ LECTURA) a sus Categorías — misma visibilidad
    // que el mantenedor de categorías (usuarios-perfiles.md §5/§6).
    const codigosArea = (['PREVENCION', 'TECNICA'] as const).filter(
      (c) => nivelCategoriasDeArea(acceso, c) !== 'SIN_ACCESO'
    )
    const { rows, total } = await subcategoriasRepository.listar(pagination, q, categoriaId, areaId, codigosArea)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async listarOpciones(
    categoriaId: number,
    acceso: Acceso
  ): Promise<Array<{ id: number; codigo: string; nombre: string }>> {
    const categoria = await subcategoriasRepository.buscarCategoria(categoriaId)
    if (!categoria) throw new NotFoundError('Categoría', String(categoriaId))
    // Puede ver las subcategorías quien administra las Categorías del área O quien
    // inspecciona el área (el alta de hallazgos las necesita). esAdmin pasa siempre.
    const areaCodigo = categoria.area.codigo
    const nivelInsp = acceso.esAdmin
      ? 'TOTAL'
      : (acceso.permisos?.[INSPECCION_FUNCION[areaCodigo]] ?? 'SIN_ACCESO')
    const puede = nivelCategoriasDeArea(acceso, areaCodigo) !== 'SIN_ACCESO' || nivelInsp !== 'SIN_ACCESO'
    if (!puede) throw new ForbiddenError('Sin acceso a las subcategorías de esta área.')
    return subcategoriasRepository.listarOpciones(categoriaId)
  },

  async obtener(id: number, acceso: Acceso): Promise<SubcategoriaFormularioDTO> {
    const row = await subcategoriasRepository.buscarPorId(id)
    if (!row) throw new NotFoundError('Subcategoría', String(id))
    // Visibilidad por área: 404 si no tiene acceso al área de la categoría padre.
    if (nivelCategoriasDeArea(acceso, row.categoria.area.codigo) === 'SIN_ACCESO') {
      throw new NotFoundError('Subcategoría', String(id))
    }
    return toDTO(row)
  },

  async crear(data: CrearSubcategoriaInput, acceso: Acceso, usuarioId: string): Promise<SubcategoriaFormularioDTO> {
    const categoria = await subcategoriasRepository.buscarCategoria(data.categoriaId)
    if (!categoria) throw new NotFoundError('Categoría', String(data.categoriaId))
    exigirTotalEnArea(acceso, categoria.area.codigo)

    const codigo = slugCodigo(data.nombre)
    if (await subcategoriasRepository.existeCodigoEnCategoria(data.categoriaId, codigo)) {
      throw new ConflictError(`Ya existe una subcategoría "${data.nombre}" en la categoría ${categoria.nombre}.`)
    }

    try {
      // Transacción con lock de la categoría padre: si una baja concurrente la
      // elimina, este alta la ve eliminada y se rechaza (QA-OKA-006).
      const row = await prisma.$transaction(async (tx) => {
        const viva = await subcategoriasRepository.lockCategoriaViva(tx, data.categoriaId)
        if (!viva) {
          throw new ConflictError('La categoría padre fue eliminada; no se puede crear la subcategoría.')
        }
        return subcategoriasRepository.crear(
          { categoriaId: data.categoriaId, codigo, nombre: data.nombre, activo: data.activo ?? true, creadoPor: usuarioId },
          tx
        )
      })
      return toDTO(row)
    } catch (err) {
      if (esCodigoDuplicado(err)) {
        throw new ConflictError(`Ya existe una subcategoría "${data.nombre}" en la categoría ${categoria.nombre}.`)
      }
      throw err
    }
  },

  async actualizar(
    id: number,
    data: ActualizarSubcategoriaInput,
    acceso: Acceso,
    actualizadoPor: string
  ): Promise<SubcategoriaFormularioDTO> {
    const existente = await subcategoriasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Subcategoría', String(id))
    exigirTotalEnArea(acceso, existente.categoria.area.codigo)

    // Si cambia el nombre, se regenera el codigo y se revalida unicidad en la categoría.
    let codigo: string | undefined
    if (data.nombre !== undefined && data.nombre !== existente.nombre) {
      codigo = slugCodigo(data.nombre)
      if (await subcategoriasRepository.existeCodigoEnCategoria(existente.categoriaId, codigo, id)) {
        throw new ConflictError(`Ya existe una subcategoría "${data.nombre}" en esa categoría.`)
      }
    }

    try {
      const row = await subcategoriasRepository.actualizar(id, { ...data, codigo, actualizadoPor })
      return toDTO(row)
    } catch (err) {
      if (esCodigoDuplicado(err)) {
        throw new ConflictError(`Ya existe una subcategoría "${data.nombre}" en esa categoría.`)
      }
      throw err
    }
  },

  async eliminar(id: number, acceso: Acceso, usuarioId: string): Promise<void> {
    const existente = await subcategoriasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Subcategoría', String(id))
    exigirTotalEnArea(acceso, existente.categoria.area.codigo)
    await subcategoriasRepository.softDelete(id, usuarioId)
  },
}
