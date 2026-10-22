/** Representación pública de una SubcategoriaFormulario en respuestas de la API. */
export interface SubcategoriaFormularioDTO {
  id: number
  categoriaId: number
  categoriaNombre: string
  areaId: number
  areaCodigo: string
  areaNombre: string
  codigo: string
  nombre: string
  activo: boolean
  creadoEn: string
}
