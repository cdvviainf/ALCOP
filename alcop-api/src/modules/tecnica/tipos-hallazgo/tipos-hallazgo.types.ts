/** Representación pública de un Tipo de hallazgo técnico en respuestas de la API. */
export interface TipoHallazgoTecnicoDTO {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  creadoEn: string
}
