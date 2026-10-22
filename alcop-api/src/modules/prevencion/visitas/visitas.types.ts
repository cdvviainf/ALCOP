import type { CalidadImagen, EstadoVisita, PlazoUnidad } from '@prisma/client'

export interface FotoDTO {
  id: number
  mimetype: string
  calidad: CalidadImagen
  tamano: number
  ancho: number | null
  alto: number | null
  orden: number
  /** Ruta de descarga del binario en la API. */
  url: string
}

export interface HallazgoDTO {
  id: number
  categoria: { id: number; nombre: string }
  subcategoria: { id: number; nombre: string }
  nivelRiesgo: { id: number; nombre: string }
  plazoValor: number
  plazoUnidad: PlazoUnidad
  comentario: string
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
