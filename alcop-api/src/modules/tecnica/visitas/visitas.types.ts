import type { CalidadImagen, EstadoVisita } from '@prisma/client'

export interface FotoDTO {
  id: number
  mimetype: string
  calidad: CalidadImagen
  tamano: number
  ancho: number | null
  alto: number | null
  orden: number
  /** Ruta de descarga del binario en la API (no la ruta en disco/BD). */
  url: string
}

export interface HallazgoDTO {
  id: number
  loteUnidad: { id: number; descripcion: string }
  tipoHallazgo: { id: number; nombre: string }
  comentario: string | null
  orden: number
  fotos: FotoDTO[]
}

export interface VisitaDTO {
  id: number
  obra: { id: number; codigo: string; nombre: string }
  usuario: { id: string; nombre: string }
  fecha: string
  horaInicio: string | null
  horaTermino: string | null
  estado: EstadoVisita
  hallazgos: number
  creadoEn: string
}

export interface VisitaDetalleDTO extends Omit<VisitaDTO, 'hallazgos'> {
  resumenFinal: string | null
  hallazgos: HallazgoDTO[]
}
