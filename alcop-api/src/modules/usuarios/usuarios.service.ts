import type { NivelAcceso } from '@prisma/client'
import { auth } from '../../lib/auth.js'
import { ConflictError, NotFoundError } from '../../shared/errors.js'
import { paginate } from '../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../shared/pagination.js'
import { perfilesRepository } from '../nucleo/perfiles/perfiles.repository.js'
import { usuariosRepository } from './usuarios.repository.js'
import type { ActualizarUsuarioInput, CrearUsuarioInput } from './usuarios.schema.js'
import type { UsuarioDTO } from './usuarios.types.js'

const DIAS_GUARD_BORRADO = 90

type FilaConPerfil = {
  id: string
  nombre: string
  email: string
  activo: boolean
  esAdmin: boolean
  creadoEn: Date
  perfil: { id: number; nombre: string } | null
}

function toDTO(u: FilaConPerfil): UsuarioDTO {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    activo: u.activo,
    esAdmin: u.esAdmin,
    perfil: u.perfil ? { id: u.perfil.id, nombre: u.perfil.nombre } : null,
    creadoEn: u.creadoEn.toISOString(),
  }
}

async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context
  return ctx.password.hash(password)
}

export const usuariosService = {
  /**
   * Perfil del usuario de la sesión: esAdmin + mapa de permisos efectivos por
   * función (ya aplicando los toggles de área). Alimenta sidebar y gating del front.
   */
  async obtenerMe(usuarioId: string) {
    const u = await usuariosRepository.obtenerParaSesion(usuarioId)
    if (!u) throw new NotFoundError('Usuario', usuarioId)

    const permisos: Record<string, NivelAcceso> = {}
    if (u.perfil) {
      for (const p of u.perfil.permisos) {
        const apagada =
          (p.funcion.area === 'PREVENCION' && !u.perfil.areaPrevencion) ||
          (p.funcion.area === 'TECNICA' && !u.perfil.areaTecnica)
        permisos[p.funcion.codigo] = apagada ? 'SIN_ACCESO' : p.nivel
      }
    }

    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      esAdmin: u.esAdmin,
      perfil: u.perfil ? { id: u.perfil.id, nombre: u.perfil.nombre } : null,
      permisos,
    }
  },

  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<UsuarioDTO>> {
    const { rows, total } = await usuariosRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async obtener(id: string): Promise<UsuarioDTO> {
    const usuario = await usuariosRepository.buscarPorId(id)
    if (!usuario) throw new NotFoundError('Usuario', id)
    return toDTO(usuario)
  },

  async crear(data: CrearUsuarioInput, creadoPor: string): Promise<UsuarioDTO> {
    const esAdmin = data.esAdmin === true
    const perfilId = data.perfilId ?? null
    if (perfilId != null) {
      const perfil = await perfilesRepository.buscarPorId(perfilId)
      if (!perfil) throw new NotFoundError('Perfil', String(perfilId))
    }

    if (await usuariosRepository.buscarPorEmail(data.email)) {
      throw new ConflictError(`Ya existe un usuario con el email ${data.email}.`)
    }

    const passwordHash = await hashPassword(data.password)
    const usuario = await usuariosRepository.crearConCredencial({
      nombre: data.nombre,
      email: data.email,
      esAdmin,
      perfilId, // un no-admin ya trae perfil (lo exige el schema)
      passwordHash,
      creadoPor,
    })
    return toDTO(usuario)
  },

  async actualizar(id: string, data: ActualizarUsuarioInput): Promise<UsuarioDTO> {
    const existente = await usuariosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Usuario', id)

    const esAdminFinal = data.esAdmin !== undefined ? data.esAdmin : existente.esAdmin
    const perfilIdFinal = data.perfilId !== undefined ? data.perfilId : existente.perfilId
    if (!esAdminFinal && perfilIdFinal == null) {
      throw new ConflictError('Un usuario no administrador requiere un perfil.')
    }
    if (data.perfilId != null) {
      const perfil = await perfilesRepository.buscarPorId(data.perfilId)
      if (!perfil) throw new NotFoundError('Perfil', String(data.perfilId))
    }

    let passwordHash: string | undefined
    if (data.password) {
      if (!existente.authUserId) {
        throw new ConflictError('El usuario no tiene identidad de autenticación para resetear la contraseña.')
      }
      passwordHash = await hashPassword(data.password)
    }

    const usuario = await usuariosRepository.actualizar(id, {
      nombre: data.nombre,
      esAdmin: data.esAdmin,
      perfilId: data.perfilId,
      activo: data.activo,
      passwordHash,
      authUserId: existente.authUserId,
    })
    return toDTO(usuario)
  },

  /**
   * Retira a un usuario (usuarios-perfiles.md §7): si tiene revisiones en los
   * últimos 90 días se desactiva; si no, se soft-deletea. Siempre quita sus
   * asignaciones de obra.
   */
  async eliminar(id: string, solicitanteId: string): Promise<'eliminado' | 'desactivado'> {
    const existente = await usuariosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Usuario', id)

    if (id === solicitanteId) {
      throw new ConflictError('No puedes eliminar tu propio usuario.')
    }

    const desde = new Date(Date.now() - DIAS_GUARD_BORRADO * 24 * 60 * 60 * 1000)
    const recientes = await usuariosRepository.contarRespuestasDesde(id, desde)
    const eliminar = recientes === 0
    await usuariosRepository.retirar(id, eliminar, solicitanteId)
    return eliminar ? 'eliminado' : 'desactivado'
  },
}
