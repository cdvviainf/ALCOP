/** Representación pública de un Usuario (sin campos sensibles). */
export interface UsuarioDTO {
  id: string
  nombre: string
  email: string
  activo: boolean
  esAdmin: boolean
  perfil: { id: number; nombre: string } | null
  creadoEn: string
}
