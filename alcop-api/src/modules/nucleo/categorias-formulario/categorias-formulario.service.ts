import type { NivelAcceso } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { slugCodigo } from '../../../shared/slug.js'
import { categoriasRepository } from './categorias-formulario.repository.js'
import type { ActualizarCategoriaInput, CrearCategoriaInput } from './categorias-formulario.schema.js'
import type { CategoriaFormularioDTO } from './categorias-formulario.types.js'

/** Acceso del solicitante: admin (bypass) o mapa de permisos efectivos por función. */
export type Acceso = { esAdmin?: boolean; permisos?: Record<string, NivelAcceso> }

const CAT_FUNCION: Record<string, string> = {
  PREVENCION: 'PREV_CAT_CATEGORIAS',
  TECNICA: 'TEC_CAT_CATEGORIAS',
}

type FilaConArea = {
  id: number
  areaId: number
  codigo: string
  nombre: string
  activo: boolean
  creadoEn: Date
  area: { codigo: string; nombre: string }
  formulariosCount?: number
}

function toDTO(row: FilaConArea): CategoriaFormularioDTO {
  return {
    id: row.id,
    areaId: row.areaId,
    areaCodigo: row.area.codigo,
    areaNombre: row.area.nombre,
    codigo: row.codigo,
    nombre: row.nombre,
    activo: row.activo,
    formularios: row.formulariosCount ?? 0,
    creadoEn: row.creadoEn.toISOString(),
  }
}

/** Nivel efectivo del solicitante sobre la función Categorías del área dada. */
function nivelCategoriasDeArea(acceso: Acceso, areaCodigo: string): NivelAcceso {
  if (acceso.esAdmin) return 'TOTAL'
  const codigo = CAT_FUNCION[areaCodigo]
  return (codigo ? acceso.permisos?.[codigo] : undefined) ?? 'SIN_ACCESO'
}

/**
 * Autorización dinámica (formularios-dinamicos.md §2): mutar una categoría exige
 * nivel TOTAL en la función Categorías del Área de esa categoría. El área sale del
 * dato (areaId del body al crear, o de la categoría existente al editar/borrar).
 */
function exigirTotalEnArea(acceso: Acceso, areaCodigo: string) {
  if (nivelCategoriasDeArea(acceso, areaCodigo) !== 'TOTAL') {
    throw new ForbiddenError(
      `Se requiere acceso total en el área ${areaCodigo} para administrar sus categorías.`
    )
  }
}

export const categoriasService = {
  async listar(
    pagination: PaginationQuery,
    acceso: Acceso,
    q?: string,
    areaId?: number
  ): Promise<Paginated<CategoriaFormularioDTO>> {
    // Solo las áreas donde el solicitante tiene acceso (≥ LECTURA). Un usuario de
    // una sola área ve únicamente sus categorías (usuarios-perfiles.md §5/§6).
    const codigosArea = (['PREVENCION', 'TECNICA'] as const).filter(
      (c) => nivelCategoriasDeArea(acceso, c) !== 'SIN_ACCESO'
    )
    const { rows, total } = await categoriasRepository.listar(pagination, q, areaId, codigosArea)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async obtener(id: number, acceso: Acceso): Promise<CategoriaFormularioDTO> {
    const row = await categoriasRepository.buscarPorId(id)
    if (!row) throw new NotFoundError('Categoría de formulario', String(id))
    // Visibilidad por área (FAD-003): si el solicitante no tiene acceso al área de
    // la categoría, se responde 404 (no se revela que existe en otra área).
    if (nivelCategoriasDeArea(acceso, row.area.codigo) === 'SIN_ACCESO') {
      throw new NotFoundError('Categoría de formulario', String(id))
    }
    return toDTO(row)
  },

  async crear(data: CrearCategoriaInput, acceso: Acceso, usuarioId: string): Promise<CategoriaFormularioDTO> {
    const area = await categoriasRepository.buscarArea(data.areaId)
    if (!area) throw new NotFoundError('Área', String(data.areaId))
    exigirTotalEnArea(acceso, area.codigo)

    const codigo = slugCodigo(data.nombre)
    if (await categoriasRepository.existeCodigoEnArea(data.areaId, codigo)) {
      throw new ConflictError(`Ya existe una categoría "${data.nombre}" en el área ${area.nombre}.`)
    }

    const row = await categoriasRepository.crear({
      areaId: data.areaId,
      codigo,
      nombre: data.nombre,
      activo: data.activo ?? true,
      creadoPor: usuarioId,
    })
    return toDTO(row)
  },

  async actualizar(
    id: number,
    data: ActualizarCategoriaInput,
    acceso: Acceso
  ): Promise<CategoriaFormularioDTO> {
    const existente = await categoriasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Categoría de formulario', String(id))
    exigirTotalEnArea(acceso, existente.area.codigo)

    // Si cambia el nombre, se regenera el codigo y se revalida unicidad en el área.
    let codigo: string | undefined
    if (data.nombre !== undefined && data.nombre !== existente.nombre) {
      codigo = slugCodigo(data.nombre)
      if (await categoriasRepository.existeCodigoEnArea(existente.areaId, codigo, id)) {
        throw new ConflictError(`Ya existe una categoría "${data.nombre}" en esa área.`)
      }
    }

    const row = await categoriasRepository.actualizar(id, { ...data, codigo })
    return toDTO(row)
  },

  async eliminar(id: number, acceso: Acceso, usuarioId: string): Promise<void> {
    const existente = await categoriasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Categoría de formulario', String(id))
    exigirTotalEnArea(acceso, existente.area.codigo)

    const formularios = await categoriasRepository.contarFormularios(id)
    if (formularios > 0) {
      throw new ConflictError(
        `No se puede eliminar: la categoría tiene ${formularios} formulario(s). Muévelos o elimínalos primero.`
      )
    }
    await categoriasRepository.softDelete(id, usuarioId)
  },
}
