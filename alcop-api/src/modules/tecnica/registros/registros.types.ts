import type {
  FormularioMini,
  ObraMini,
  PreguntaRegistroDTO,
  RespuestaPreguntaDTO,
} from '../../prevencion/registros/registros.types.js'
import type { EstadoRegistroTecnico } from './registros.schema.js'

/** Fila del listado: una aplicación de un formulario técnico en una obra. */
export interface RegistroTecnicoListaDTO {
  /** Id de la RespuestaFormulario (= el registro). */
  id: number
  fecha: string // YYYY-MM-DD (día de aplicación, America/Santiago)
  obra: ObraMini
  formulario: FormularioMini
  estado: EstadoRegistroTecnico
  responsable: string
  fechaRevision: string | null
}

export interface RegistroTecnicoDetalleDTO {
  id: number
  fecha: string
  obra: ObraMini
  formulario: FormularioMini
  estado: EstadoRegistroTecnico
  cerrado: boolean
  fechaRevision: string | null
  preguntas: PreguntaRegistroDTO[]
  respuestas: RespuestaPreguntaDTO[]
}
