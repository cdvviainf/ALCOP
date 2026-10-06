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
  creadoEn: Date
  perfil: {
    id: number
    nombre: string
    nivelPrevencion: UsuarioDTO['perfil']['nivelPrevencion']
    nivelTecnica: UsuarioDTO['perfil']['nivelTecnica']
  }
}

function toDTO(u: FilaConPerfil): UsuarioDTO {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    activo: u.activo,
    perfil: {
      id: u.perfil.id,
      nombre: u.perfil.nombre,
      nivelPrevencion: u.perfil.nivelPrevencion,
      nivelTecnica: u.perfil.nivelTecnica,
    },
    creadoEn: u.creadoEn.toISOString(),
  }
}

/** Hash de la credencial con el esquema de Better Auth. No es una query Prisma. */
async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context
  return ctx.password.hash(password)
}

export const usuariosService = {
  /** Perfil del usuario de la sesión (alimenta sidebar y visibilidad por área). */
  async obtenerMe(usuarioId: string) {
    const usuario = await usuariosRepository.obtenerConPerfil(usuarioId)
    if (!usuario) throw new NotFoundError('Usuario', usuarioId)
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      perfil: {
        id: usuario.perfil.id,
        nombre: usuario.perfil.nombre,
        nivelPrevencion: usuario.perfil.nivelPrevencion,
        nivelTecnica: usuario.perfil.nivelTecnica,
      },
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

  /**
   * Alta de usuario (la hace un Administrador; registro público off). El hash se
   * calcula acá (no es query) y el repository persiste identidad Better Auth +
   * Usuario de dominio en una sola transacción (QA-C-002).
   */
  async crear(data: CrearUsuarioInput, creadoPor: string): Promise<UsuarioDTO> {
    const perfil = await perfilesRepository.buscarPorId(data.perfilId)
    if (!perfil) throw new NotFoundError('Perfil', String(data.perfilId))

    if (await usuariosRepository.buscarPorEmail(data.email)) {
      throw new ConflictError(`Ya existe un usuario con el email ${data.email}.`)
    }

    const passwordHash = await hashPassword(data.password)
    const usuario = await usuariosRepository.crearConCredencial({
      nombre: data.nombre,
      email: data.email,
      perfilId: data.perfilId,
      passwordHash,
      creadoPor,
    })
    return toDTO(usuario)
  },

  async actualizar(id: string, data: ActualizarUsuarioInput): Promise<UsuarioDTO> {
    const existente = await usuariosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Usuario', id)

    if (data.perfilId !== undefined) {
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
      perfilId: data.perfilId,
      activo: data.activo,
      passwordHash,
      authUserId: existente.authUserId,
    })
    return toDTO(usuario)
  },

  /**
   * Retira a un usuario. Regla de usuarios-perfiles.md §7: si tiene revisiones en
   * los últimos 90 días NO se elimina — "se desactiva (activo=false) en su lugar"
   * (QA-C-003: el sistema hace la desactivación, no la delega al operador). Si no,
   * se soft-deletea. En ambos casos se quitan sus asignaciones de obra (QA-C-004).
   *
   * NOTA: hoy "revisiones" solo cuenta RespuestaFormulario; cuando existan los
   * módulos de Hallazgos y Visitas habrá que sumarlos (ver prevencion.md/tecnica.md).
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
