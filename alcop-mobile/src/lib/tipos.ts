// Tipos de la API que consume la app (mismos DTOs que la web — alcop-api/src/modules/*/*.types.ts).

export type AreaCodigo = 'TECNICA' | 'PREVENCION'

export interface Opcion {
  id: number
  codigo?: string
  nombre: string
}

export interface ObraMini {
  id: number
  codigo: string
  nombre: string
}

export interface Paginado<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ─── Visitas ──────────────────────────────────────────────────────────────────
export type EstadoVisita = 'EN_CURSO' | 'FINALIZADA'

export interface FotoVisita {
  id: number
  mimetype: string
  orden: number
  /** Ruta de descarga en la API (`/api/...`). */
  url: string
}

export interface VisitaLista {
  id: number
  obra: ObraMini
  usuario: { id: string; nombre: string }
  fecha: string
  horaInicio: string | null
  horaTermino: string | null
  estado: EstadoVisita
  hallazgos: number
}

export interface HallazgoTecnico {
  id: number
  loteUnidad: { id: number; descripcion: string }
  tipoRegistro: 'HALLAZGO' | 'NOTA_TECNICA'
  tipoHallazgo: { id: number; nombre: string } | null
  comentario: string | null
  fotos: FotoVisita[]
}

export interface HallazgoPrevencion {
  id: number
  categoria: { id: number; nombre: string }
  subcategoria: { id: number; nombre: string }
  nivelRiesgo: { id: number; nombre: string }
  plazoValor: number
  plazoUnidad: 'DIAS' | 'HORAS'
  comentario: string
  fotos: FotoVisita[]
}

export interface VisitaDetalle<H> extends Omit<VisitaLista, 'hallazgos'> {
  resumenFinal: string | null
  hallazgos: H[]
}

// ─── Registros (formularios) ─────────────────────────────────────────────────
export type TipoRespuesta = 'CHECKBOX' | 'SELECCION_MULTIPLE' | 'NUMERO' | 'TEXTO' | 'TEXTO_LARGO' | 'LOTE_UNIDAD'

export interface Pregunta {
  id: number
  orden: number
  texto: string
  tipoRespuesta: TipoRespuesta
  obligatoria: boolean
  permiteFoto: boolean
  fotoObligatoria: boolean
  opciones: string[]
}

export interface RespuestaPregunta {
  preguntaId: number
  valorTexto: string | null
  valorNumero: number | null
  valorCheckbox: string | null
  valorSeleccionMultiple: string[]
  valorLoteUnidadId: number | null
  valorLoteUnidad: { id: number; descripcion: string } | null
  fotos: FotoVisita[]
}

export interface RegistroDetalle {
  id: number
  fecha: string
  obra: ObraMini
  formulario: { id: number; codigo: string; nombre: string }
  estado: string
  cerrado: boolean
  fechaRevision: string | null
  preguntas: Pregunta[]
  respuestas: RespuestaPregunta[]
  unidades: { id: number; descripcion: string }[]
}

export interface RegistroLista {
  id: number
  fecha: string
  obra: ObraMini
  formulario: { id: number; codigo: string; nombre: string }
  /** Prevención: POR_APLICAR | VIGENTE | ATRASADO | COMPLETADO. Técnica: EN_PROGRESO | COMPLETADO. */
  estado: string
  enProgreso?: boolean
  responsable?: string
  fechaRevision: string | null
}

/** Prefijo de API y permisos por área (mismas funciones que la web). */
export const AREA = {
  TECNICA: {
    nombre: 'Técnica',
    visitas: 'tecnica/visitas',
    fotosVisita: 'tecnica',
    registros: 'tecnica/registros',
    fnVisitas: 'TEC_INSPECCION',
    fnRegistros: 'TEC_REGISTROS',
  },
  PREVENCION: {
    nombre: 'Prevención',
    visitas: 'prevencion/visitas',
    fotosVisita: 'prevencion',
    registros: 'prevencion/registros',
    fnVisitas: 'PREV_INSPECCION',
    fnRegistros: 'PREV_REGISTROS',
  },
} as const

export function esArea(v: unknown): v is AreaCodigo {
  return v === 'TECNICA' || v === 'PREVENCION'
}
