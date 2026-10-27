/** Un formulario agendado dentro de un día de programación. */
export interface FormularioProgramadoDTO {
  id: number
  formulario: { id: number; codigo: string; nombre: string }
  orden: number
}

/** Un día de programación de una obra (agendamiento en una fecha). */
export interface ProgramacionDiaDTO {
  id: number
  obraId: number
  /** Día calendario YYYY-MM-DD. */
  fecha: string
  comentario: string | null
  usuario: { id: string; nombre: string } | null
  /** Derivado: la fecha ya pasó (quedó sin ejecutar en el calendario). */
  vencido: boolean
  formularios: FormularioProgramadoDTO[]
}

/** Opción del picker de formularios de Prevención. */
export interface FormularioOpcionDTO {
  id: number
  codigo: string
  nombre: string
}
