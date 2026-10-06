import type { NivelAcceso } from '@prisma/client'

/** Representación pública de un Usuario (sin campos sensibles: no expone credenciales). */
export interface UsuarioDTO {
  id: string
  nombre: string
  email: string
  activo: boolean
  perfil: {
    id: number
    nombre: string
    nivelPrevencion: NivelAcceso
    nivelTecnica: NivelAcceso
  }
  creadoEn: string
}
