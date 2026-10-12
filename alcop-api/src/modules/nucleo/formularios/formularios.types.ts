import type { TipoRespuesta } from '@prisma/client'

/** Pregunta de una plantilla de formulario. */
export interface PreguntaDTO {
  id: number
  orden: number
  texto: string
  tipoRespuesta: TipoRespuesta
  obligatoria: boolean
  permiteFoto: boolean
  opciones: string[]
}

/** Representación pública de un Formulario (sin preguntas). */
export interface FormularioDTO {
  id: number
  codigo: string
  nombre: string
  areaId: number
  areaCodigo: string
  areaNombre: string
  categoriaId: number
  categoriaNombre: string
  requiereObra: boolean
  activo: boolean
  preguntas: number
  creadoEn: string
}

/** Detalle de un Formulario: incluye sus preguntas ordenadas. */
export interface FormularioDetalleDTO extends Omit<FormularioDTO, 'preguntas'> {
  preguntas: PreguntaDTO[]
  // Si ya tiene respuestas, las preguntas no se pueden editar (§6): el frontend
  // bloquea su edición y solo envía metadata (QA-FD-003).
  tieneRespuestas: boolean
}
