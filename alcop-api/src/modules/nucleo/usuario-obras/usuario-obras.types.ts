import type { RolObra } from '@prisma/client'

/** Asignación obra↔usuario↔rol (dispara las alertas por obra — módulo alertas pendiente). */
export interface UsuarioObraDTO {
  id: number
  obraId: number
  obraNombre: string
  rolObra: RolObra
  usuario: {
    id: string
    nombre: string
    email: string
  }
  creadoEn: string
}
