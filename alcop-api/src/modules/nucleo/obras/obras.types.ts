import type { EstadoObra, RolObra } from '@prisma/client'

/** Representación pública de una Obra en respuestas de la API. */
export interface ObraDTO {
  id: number
  codigo: string
  nombre: string
  mandante: string | null
  direccion: string | null
  comuna: string | null
  fechaInicio: string | null
  fechaTerminoEstimada: string | null
  estado: EstadoObra
  creadoEn: string
}

/** Titular (asignación) de una obra. */
export interface TitularDTO {
  id: number
  rolObra: RolObra
  usuario: { id: string; nombre: string; email: string }
  creadoEn: string
}
