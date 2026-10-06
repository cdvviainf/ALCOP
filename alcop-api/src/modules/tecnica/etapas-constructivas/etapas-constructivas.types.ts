/** Representación pública de una Etapa constructiva en respuestas de la API. */
export interface EtapaConstructivaDTO {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  creadoEn: string
}
