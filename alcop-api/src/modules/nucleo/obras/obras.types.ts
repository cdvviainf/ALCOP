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

/** Titular (rol de notificación) de una obra. */
export interface TitularDTO {
  id: number
  rolObra: RolObra
  usuario: { id: string; nombre: string; email: string }
  creadoEn: string
}

/** Acceso de un usuario a una obra (pertenencia, sin rol). */
export interface AccesoObraDTO {
  id: number
  usuario: { id: string; nombre: string; email: string }
  creadoEn: string
}

/** Lote configurado en una obra (cantidad por tipo). */
export interface ObraLoteDTO {
  id: number
  cantidad: number
  tipoLote: { id: number; codigo: string; nombre: string; activo: boolean }
  creadoEn: string
}

/**
 * Formulario de control aplicable a la obra, derivado de la cadena
 * Obra → Lotes → Procedimientos → Formularios. Incluye la trazabilidad (qué
 * procedimientos y tipos de lote lo traen).
 */
export interface FormularioAplicableDTO {
  id: number
  codigo: string
  nombre: string
  areaId: number
  activo: boolean
  procedimientos: Array<{ id: number; codigo: string; nombre: string }>
  tiposLote: Array<{ id: number; nombre: string }>
}
