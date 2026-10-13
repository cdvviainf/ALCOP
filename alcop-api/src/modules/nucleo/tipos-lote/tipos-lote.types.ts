/** Procedimiento vinculado (resumen) tal como se expone en el detalle de un tipo de lote. */
export interface ProcedimientoVinculadoDTO {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

/** Representación pública de un TipoLote. */
export interface TipoLoteDTO {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  /** Cantidad de procedimientos activos vinculados (para la columna del listado). */
  procedimientosCount: number
  creadoEn: string
}

/** Detalle de un TipoLote: incluye sus procedimientos vinculados. */
export interface TipoLoteDetalleDTO extends TipoLoteDTO {
  procedimientos: ProcedimientoVinculadoDTO[]
}
