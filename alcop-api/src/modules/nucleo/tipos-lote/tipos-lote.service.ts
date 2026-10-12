import { Prisma, type TipoLote } from '@prisma/client'
import { ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { slugCodigo } from '../../../shared/slug.js'
import { tiposLoteRepository } from './tipos-lote.repository.js'
import type { ActualizarTipoLoteInput, CrearTipoLoteInput } from './tipos-lote.schema.js'
import type { ProcedimientoVinculadoDTO, TipoLoteDTO, TipoLoteDetalleDTO } from './tipos-lote.types.js'

function toDTO(row: TipoLote): TipoLoteDTO {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    orden: row.orden,
    activo: row.activo,
    creadoEn: row.creadoEn.toISOString(),
  }
}

type ProcRow = { procedimiento: { id: number; codigo: string; nombre: string; activo: boolean } }
function procToDTO(row: ProcRow): ProcedimientoVinculadoDTO {
  return {
    id: row.procedimiento.id,
    codigo: row.procedimiento.codigo,
    nombre: row.procedimiento.nombre,
    activo: row.procedimiento.activo,
  }
}

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export const tiposLoteService = {
  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<TipoLoteDTO>> {
    const { rows, total } = await tiposLoteRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async listarOpciones(q?: string): Promise<Array<{ id: number; codigo: string; nombre: string }>> {
    return tiposLoteRepository.listarOpciones(q)
  },

  async obtener(id: number): Promise<TipoLoteDetalleDTO> {
    const row = await tiposLoteRepository.buscarConProcedimientos(id)
    if (!row) throw new NotFoundError('Tipo de lote', String(id))
    return { ...toDTO(row), procedimientos: row.procedimientos.map(procToDTO) }
  },

  async crear(data: CrearTipoLoteInput, creadoPor: string): Promise<TipoLoteDTO> {
    const codigo = slugCodigo(data.nombre)
    try {
      const row = await tiposLoteRepository.crear(data, codigo, creadoPor)
      return toDTO(row)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError(`Ya existe un tipo de lote con el nombre "${data.nombre}".`)
      throw err
    }
  },

  async actualizar(id: number, data: ActualizarTipoLoteInput, actualizadoPor: string): Promise<TipoLoteDTO> {
    const existente = await tiposLoteRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Tipo de lote', String(id))
    const codigo = data.nombre !== undefined ? slugCodigo(data.nombre) : undefined
    try {
      const row = await tiposLoteRepository.actualizar(id, data, codigo, actualizadoPor)
      return toDTO(row)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError('Ya existe un tipo de lote con ese nombre.')
      throw err
    }
  },

  async eliminar(id: number, eliminadoPor: string): Promise<void> {
    const existente = await tiposLoteRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Tipo de lote', String(id))
    const uso = await tiposLoteRepository.contarUsoEnObras(id)
    if (uso > 0) {
      throw new ConflictError(
        `No se puede eliminar: el tipo de lote se usa en ${uso} obra(s). Desactívalo en su lugar.`
      )
    }
    await tiposLoteRepository.softDelete(id, eliminadoPor)
  },

  // ─── Procedimientos vinculados ────────────────────────────────────────────
  async listarProcedimientos(tipoLoteId: number): Promise<ProcedimientoVinculadoDTO[]> {
    const existente = await tiposLoteRepository.buscarPorId(tipoLoteId)
    if (!existente) throw new NotFoundError('Tipo de lote', String(tipoLoteId))
    const rows = await tiposLoteRepository.listarProcedimientos(tipoLoteId)
    return rows.map(procToDTO)
  },

  async vincularProcedimiento(
    tipoLoteId: number,
    procedimientoId: number,
    creadoPor: string
  ): Promise<{ tipoLoteId: number; procedimientoId: number }> {
    const existente = await tiposLoteRepository.buscarPorId(tipoLoteId)
    if (!existente) throw new NotFoundError('Tipo de lote', String(tipoLoteId))
    const proc = await tiposLoteRepository.procedimientoActivo(procedimientoId)
    if (!proc) throw new NotFoundError('Procedimiento', String(procedimientoId))
    if (await tiposLoteRepository.existeVinculo(tipoLoteId, procedimientoId)) {
      throw new ConflictError('Ese procedimiento ya está vinculado a este tipo de lote.')
    }
    await tiposLoteRepository.vincularProcedimiento(tipoLoteId, procedimientoId, creadoPor)
    return { tipoLoteId, procedimientoId }
  },

  async desvincularProcedimiento(tipoLoteId: number, procedimientoId: number): Promise<void> {
    const existente = await tiposLoteRepository.buscarPorId(tipoLoteId)
    if (!existente) throw new NotFoundError('Tipo de lote', String(tipoLoteId))
    await tiposLoteRepository.desvincularProcedimiento(tipoLoteId, procedimientoId)
  },
}
