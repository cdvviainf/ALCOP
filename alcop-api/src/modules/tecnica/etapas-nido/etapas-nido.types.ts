/** Representación pública de una Etapa de nido en respuestas de la API. */
export interface EtapaNidoDTO {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  creadoEn: string
}
