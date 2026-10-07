import type { NivelAcceso } from '@prisma/client'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { funcionesRepository } from '../funciones/funciones.repository.js'
import { perfilesRepository } from './perfiles.repository.js'
import type { ActualizarPerfilInput, CrearPerfilInput } from './perfiles.schema.js'
import type { PerfilDTO } from './perfiles.types.js'

/**
 * Construye el set COMPLETO de permisos (una fila por función del catálogo): valida
 * que cada funcionId enviado exista y rellena las no enviadas con SIN_ACCESO
 * (PG-003). Así todo perfil tiene exactamente un permiso por función.
 */
async function construirPermisos(
  enviados: Array<{ funcionId: number; nivel: NivelAcceso }> | undefined
): Promise<Array<{ funcionId: number; nivel: NivelAcceso }>> {
  const todas = await funcionesRepository.listar()
  const idsValidos = new Set(todas.map((f) => f.id))
  for (const p of enviados ?? []) {
    if (!idsValidos.has(p.funcionId)) {
      throw new BusinessError('VALIDATION_ERROR', `La función ${p.funcionId} no existe.`, 422)
    }
  }
  const map = new Map((enviados ?? []).map((p) => [p.funcionId, p.nivel]))
  return todas.map((f) => ({ funcionId: f.id, nivel: map.get(f.id) ?? ('SIN_ACCESO' as NivelAcceso) }))
}

type FilaPerfil = {
  id: number
  nombre: string
  areaPrevencion: boolean
  areaTecnica: boolean
  creadoEn: Date
  usuariosActivos?: number
  permisos: Array<{ funcionId: number; nivel: NivelAcceso; funcion?: { codigo: string } }>
}

function toDTO(p: FilaPerfil): PerfilDTO {
  return {
    id: p.id,
    nombre: p.nombre,
    areaPrevencion: p.areaPrevencion,
    areaTecnica: p.areaTecnica,
    permisos: p.permisos.map((x) => ({
      funcionId: x.funcionId,
      codigo: x.funcion?.codigo ?? '',
      nivel: x.nivel,
    })),
    usuariosActivos: p.usuariosActivos ?? 0,
    creadoEn: p.creadoEn.toISOString(),
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
    const perfil = await perfilesRepository.crear({
      nombre: data.nombre,
      areaPrevencion: data.areaPrevencion ?? false,
      areaTecnica: data.areaTecnica ?? false,
      permisos: await construirPermisos(data.permisos),
    })
    return toDTO(perfil)
  },

  async actualizar(id: number, data: ActualizarPerfilInput): Promise<PerfilDTO> {
    const existente = await perfilesRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Perfil', String(id))
    const perfil = await perfilesRepository.actualizar(id, {
      nombre: data.nombre,
      areaPrevencion: data.areaPrevencion,
      areaTecnica: data.areaTecnica,
      // Solo se reemplazan los permisos si vienen en el payload; set completo.
      permisos: data.permisos !== undefined ? await construirPermisos(data.permisos) : undefined,
    })
    return toDTO(perfil)
  },

  async eliminar(id: number): Promise<void> {
    const existente = await perfilesRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Perfil', String(id))
    const usuarios = await perfilesRepository.contarUsuarios(id)
    if (usuarios > 0) {
      throw new ConflictError(
        `No se puede eliminar: el perfil tiene ${usuarios} usuario(s) asignado(s). Reasígnalos o desactívalos primero.`
      )
    }
    await perfilesRepository.softDelete(id)
  },
}
