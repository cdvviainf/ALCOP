import type { Obra } from '@prisma/client'
import { NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { obrasRepository } from './obras.repository.js'
import type { ActualizarObraInput, CrearObraInput } from './obras.schema.js'
import type { ObraDTO } from './obras.types.js'

function toDTO(obra: Obra): ObraDTO {
  return {
    id: obra.id,
    nombre: obra.nombre,
    comuna: obra.comuna,
    direccion: obra.direccion,
    activo: obra.activo,
    fechaInicio: obra.fechaInicio ? obra.fechaInicio.toISOString() : null,
    creadoEn: obra.creadoEn.toISOString(),
  }
}

export const obrasService = {
  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<ObraDTO>> {
    const { rows, total } = await obrasRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async obtener(id: number): Promise<ObraDTO> {
    const obra = await obrasRepository.buscarPorId(id)
    if (!obra) throw new NotFoundError('Obra', String(id))
    return toDTO(obra)
  },

  async crear(data: CrearObraInput, creadoPor: string): Promise<ObraDTO> {
    const obra = await obrasRepository.crear(data, creadoPor)
    return toDTO(obra)
  },

  async actualizar(id: number, data: ActualizarObraInput): Promise<ObraDTO> {
    const existente = await obrasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Obra', String(id))
    const obra = await obrasRepository.actualizar(id, data)
    return toDTO(obra)
  },

  async eliminar(id: number): Promise<void> {
    const existente = await obrasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Obra', String(id))
    await obrasRepository.softDelete(id)
  },
}
