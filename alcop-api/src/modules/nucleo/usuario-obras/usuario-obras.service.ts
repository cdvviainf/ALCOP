import type { RolObra } from '@prisma/client'
import { BusinessError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { usuarioObrasRepository } from './usuario-obras.repository.js'
import type { AsignarUsuarioObraInput } from './usuario-obras.schema.js'
import type { UsuarioObraDTO } from './usuario-obras.types.js'

type Fila = {
  id: number
  obraId: number
  rolObra: RolObra
  creadoEn: Date
  obra: { nombre: string }
  usuario: { id: string; nombre: string; email: string }
}

function toDTO(row: Fila): UsuarioObraDTO {
  return {
    id: row.id,
    obraId: row.obraId,
    obraNombre: row.obra.nombre,
    rolObra: row.rolObra,
    usuario: { id: row.usuario.id, nombre: row.usuario.nombre, email: row.usuario.email },
    creadoEn: row.creadoEn.toISOString(),
  }
}

/**
 * Validación de nivel por rol (usuarios-perfiles.md §7): el titular de un rol
 * ligado a un área debe tener acceso a esa área.
 *  - PREVENCIONISTA  → nivelPrevencion ≠ SIN_ACCESO
 *  - JEFE_DE_TERRENO → nivelTecnica ≠ SIN_ACCESO
 *  - ADMINISTRADOR   → sin restricción de área (rol de notificación transversal)
 */
function validarNivelParaRol(
  rolObra: RolObra,
  niveles: { nivelPrevencion: string; nivelTecnica: string }
) {
  if (rolObra === 'PREVENCIONISTA' && niveles.nivelPrevencion === 'SIN_ACCESO') {
    throw new BusinessError(
      'NIVEL_INSUFICIENTE',
      'El usuario no tiene acceso a Prevención; no puede ser Prevencionista de la obra.',
      422
    )
  }
  if (rolObra === 'JEFE_DE_TERRENO' && niveles.nivelTecnica === 'SIN_ACCESO') {
    throw new BusinessError(
      'NIVEL_INSUFICIENTE',
      'El usuario no tiene acceso a Técnica; no puede ser Jefe de Terreno de la obra.',
      422
    )
  }
}

export const usuarioObrasService = {
  async listar(pagination: PaginationQuery, obraId?: number): Promise<Paginated<UsuarioObraDTO>> {
    const { rows, total } = await usuarioObrasRepository.listar(pagination, obraId)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async asignar(data: AsignarUsuarioObraInput): Promise<UsuarioObraDTO> {
    const obra = await usuarioObrasRepository.buscarObra(data.obraId)
    if (!obra) throw new NotFoundError('Obra', String(data.obraId))

    const usuario = await usuarioObrasRepository.buscarUsuarioConNiveles(data.usuarioId)
    if (!usuario) throw new NotFoundError('Usuario', data.usuarioId)

    validarNivelParaRol(data.rolObra, usuario.perfil)

    const row = await usuarioObrasRepository.asignar(data.obraId, data.rolObra, data.usuarioId)
    return toDTO(row)
  },

  async eliminar(id: number): Promise<void> {
    const existente = await usuarioObrasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Asignación', String(id))
    await usuarioObrasRepository.eliminar(id)
  },
}
