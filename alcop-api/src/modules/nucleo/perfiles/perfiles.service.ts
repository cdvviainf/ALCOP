import type { Perfil } from '@prisma/client'
import { ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { perfilesRepository } from './perfiles.repository.js'
import type { ActualizarPerfilInput, CrearPerfilInput } from './perfiles.schema.js'
import type { PerfilDTO } from './perfiles.types.js'

function toDTO(perfil: Perfil & { usuariosActivos?: number }): PerfilDTO {
  return {
    id: perfil.id,
    nombre: perfil.nombre,
    nivelPrevencion: perfil.nivelPrevencion,
    nivelTecnica: perfil.nivelTecnica,
    usuariosActivos: perfil.usuariosActivos ?? 0,
    creadoEn: perfil.creadoEn.toISOString(),
  }
}

export const perfilesService = {
  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<PerfilDTO>> {
    const { rows, total } = await perfilesRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async obtener(id: number): Promise<PerfilDTO> {
    const perfil = await perfilesRepository.buscarPorId(id)
    if (!perfil) throw new NotFoundError('Perfil', String(id))
    return toDTO(perfil)
  },

  async crear(data: CrearPerfilInput): Promise<PerfilDTO> {
    const perfil = await perfilesRepository.crear(data)
    return toDTO(perfil)
  },

  async actualizar(id: number, data: ActualizarPerfilInput): Promise<PerfilDTO> {
    const existente = await perfilesRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Perfil', String(id))
    const perfil = await perfilesRepository.actualizar(id, data)
    return toDTO(perfil)
  },

  async eliminar(id: number): Promise<void> {
    const existente = await perfilesRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Perfil', String(id))
    // Guard (usuarios-perfiles.md §7/§6): un perfil con usuarios asignados no se
    // elimina — primero hay que reasignar o desactivar esos usuarios.
    const usuarios = await perfilesRepository.contarUsuarios(id)
    if (usuarios > 0) {
      throw new ConflictError(
        `No se puede eliminar: el perfil tiene ${usuarios} usuario(s) asignado(s). Reasígnalos o desactívalos primero.`
      )
    }
    await perfilesRepository.softDelete(id)
  },
}
