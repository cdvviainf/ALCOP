import type { NivelAcceso } from '@prisma/client'

/** Representación pública de un Perfil en respuestas de la API. */
export interface PerfilDTO {
  id: number
  nombre: string
  nivelPrevencion: NivelAcceso
  nivelTecnica: NivelAcceso
  usuariosActivos: number
  creadoEn: string
}
