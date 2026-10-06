/** Representación pública de una CategoriaFormulario en respuestas de la API. */
export interface CategoriaFormularioDTO {
  id: number
  areaId: number
  areaCodigo: string
  areaNombre: string
  codigo: string
  nombre: string
  activo: boolean
  formularios: number
  creadoEn: string
}
