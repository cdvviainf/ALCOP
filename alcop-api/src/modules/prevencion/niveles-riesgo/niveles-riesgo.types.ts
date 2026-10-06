/** Representación pública de un Nivel de riesgo en respuestas de la API. */
export interface NivelRiesgoDTO {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  creadoEn: string
}
