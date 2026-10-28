import type { TipoRespuesta } from '@prisma/client'

/** Estado derivado de un registro (formulario agendado) respecto a hoy. */
export type EstadoRegistro = 'POR_APLICAR' | 'VIGENTE' | 'ATRASADO' | 'COMPLETADO'

export interface ObraMini {
  id: number
  codigo: string
  nombre: string
}
export interface FormularioMini {
  id: number
  codigo: string
  nombre: string
}

/** Fila del listado de registros (un formulario agendado en una fecha). */
export interface RegistroListaDTO {
  /** Id del FormularioProgramado (= el registro). */
  id: number
  fecha: string // YYYY-MM-DD (fecha programada)
  obra: ObraMini
  formulario: FormularioMini
  estado: EstadoRegistro
  /** Hay borrador con al menos una respuesta cargada. */
  enProgreso: boolean
  fechaRevision: string | null
}

export interface FotoRespuestaDTO {
  id: number
  mimetype: string
  orden: number
  /** Ruta de descarga del binario en la API. */
  url: string
}

export interface RespuestaPreguntaDTO {
  preguntaId: number
  valorTexto: string | null
  valorNumero: number | null
  valorCheckbox: string | null
  valorSeleccionMultiple: string[]
  fotos: FotoRespuestaDTO[]
}

export interface PreguntaRegistroDTO {
  id: number
  orden: number
  texto: string
  tipoRespuesta: TipoRespuesta
  obligatoria: boolean
  permiteFoto: boolean
  fotoObligatoria: boolean
  opciones: string[]
}

/** Detalle de un registro para llenar/ver. */
export interface RegistroDetalleDTO {
  id: number
  fecha: string
  obra: ObraMini
  formulario: FormularioMini
  estado: EstadoRegistro
  cerrado: boolean
  fechaRevision: string | null
  preguntas: PreguntaRegistroDTO[]
  respuestas: RespuestaPreguntaDTO[]
}
