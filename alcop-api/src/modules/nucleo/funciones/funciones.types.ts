import type { FuncionArea } from '@prisma/client'

/** Función controlable por perfil (catálogo de solo lectura). */
export interface FuncionDTO {
  id: number
  codigo: string
  nombre: string
  area: FuncionArea
  orden: number
}
