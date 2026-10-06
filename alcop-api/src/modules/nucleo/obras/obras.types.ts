/** Representación pública de una Obra en respuestas de la API. */
export interface ObraDTO {
  id: number
  nombre: string
  comuna: string | null
  direccion: string | null
  activo: boolean
  fechaInicio: string | null
  creadoEn: string
}
