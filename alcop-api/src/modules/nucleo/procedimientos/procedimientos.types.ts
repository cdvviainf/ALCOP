/** Formulario de control vinculado (resumen) en el detalle de un procedimiento. */
export interface FormularioVinculadoDTO {
  id: number
  codigo: string
  nombre: string
  areaId: number
  activo: boolean
}

/** Representación pública de un Procedimiento. */
export interface ProcedimientoDTO {
  id: number
  codigo: string
  nombre: string
  vigenciaDesde: string
  vigenciaHasta: string | null
  /** Derivado por fecha: hoy ∈ [vigenciaDesde, vigenciaHasta]. No se almacena. */
  vigente: boolean
  /** Ruta de descarga del PDF en la API (no la ruta en disco). */
  archivoUrl: string
  activo: boolean
  creadoEn: string
}

/** Detalle de un Procedimiento: incluye sus formularios de control vinculados. */
export interface ProcedimientoDetalleDTO extends ProcedimientoDTO {
  formularios: FormularioVinculadoDTO[]
}

/** Datos del PDF recibido por multipart, ya materializados en memoria. */
export interface ArchivoPdf {
  buffer: Buffer
  mimetype: string
  filename: string
}
