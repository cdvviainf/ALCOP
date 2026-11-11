import type { AreaProgramacion } from '@prisma/client'

/** Un formulario agendado dentro de un día de programación. */
export interface FormularioProgramadoDTO {
  id: number
  formulario: { id: number; codigo: string; nombre: string }
  orden: number
  /** Solo TECNICA: ventana de ejecución (YYYY-MM-DD). null en PREVENCION. */
  fechaInicio: string | null
  fechaTermino: string | null
}

/** Un día de programación de una obra (agendamiento en una fecha, por área). */
export interface ProgramacionDiaDTO {
  id: number
  obraId: number
  area: AreaProgramacion
  /** Día calendario YYYY-MM-DD. */
  fecha: string
  comentario: string | null
  /** Snapshot del titular: PREVENCIONISTA (Prevención) o JEFE_DE_TERRENO (Técnica). */
  usuario: { id: string; nombre: string } | null
  /** Derivado: la fecha ya pasó (quedó sin ejecutar en el calendario). */
  vencido: boolean
  formularios: FormularioProgramadoDTO[]
}

/** Opción del picker de formularios del área. */
export interface FormularioOpcionDTO {
  id: number
  codigo: string
  nombre: string
}
