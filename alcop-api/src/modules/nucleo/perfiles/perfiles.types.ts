import type { NivelAcceso } from '@prisma/client'

export interface PerfilPermisoDTO {
  funcionId: number
  codigo: string
  nivel: NivelAcceso
}

/** Representación pública de un Perfil (modelo granular). */
export interface PerfilDTO {
  id: number
  nombre: string
  areaPrevencion: boolean
  areaTecnica: boolean
  permisos: PerfilPermisoDTO[]
  usuariosActivos: number
  creadoEn: string
}
