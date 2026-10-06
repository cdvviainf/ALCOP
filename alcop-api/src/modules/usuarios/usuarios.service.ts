import { NotFoundError } from '../../shared/errors.js'
import { usuariosRepository } from './usuarios.repository.js'

export const usuariosService = {
  /**
   * Perfil del usuario de la sesión (alimenta el sidebar y la visibilidad por
   * área del frontend). No expone campos sensibles.
   */
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
}
