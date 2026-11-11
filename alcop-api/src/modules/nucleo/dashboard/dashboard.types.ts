import type { AreaProgramacion, EstadoObra } from '@prisma/client'

export interface CategoriaConteoDTO {
  id: number | null // null = hallazgos técnicos sin tipo asignado
  codigo: string
  nombre: string
  n: number
}

export interface AreaResumenDTO {
  visitas: number
  hallazgos: CategoriaConteoDTO[]
}

export interface ObraResumenDTO {
  id: number
  codigo: string
  nombre: string
  estado: EstadoObra
  /** Solo si el usuario puede ver Técnica. */
  tecnica: AreaResumenDTO | null
  /** Solo si el usuario puede ver Prevención. */
  prevencion: AreaResumenDTO | null
}

export interface AgendaItemDTO {
  id: number // FormularioProgramado.id (= id del registro de Prevención)
  area: AreaProgramacion
  /** Día agendado (Prevención) o inicio de la ventana (Técnica). YYYY-MM-DD */
  fecha: string
  /** Fecha límite: el mismo día (Prevención) o término de la ventana (Técnica). */
  vence: string
  enBorrador: boolean
  obra: { id: number; codigo: string; nombre: string }
  formulario: { id: number; codigo: string; nombre: string }
}

export interface DashboardDTO {
  hoy: string
  permisos: {
    tecnica: boolean
    prevencion: boolean
    agenda: AreaProgramacion[]
    /** Puede abrir el registro (llenado) desde la agenda: PREV_REGISTROS / TEC_REGISTROS. */
    registrar: AreaProgramacion[]
  }
  obras: { total: number; porEstado: Record<EstadoObra, number> }
  tecnica: AreaResumenDTO | null
  prevencion: AreaResumenDTO | null
  porObra: ObraResumenDTO[]
  agenda: { dias: number; atrasadas: AgendaItemDTO[]; proximas: AgendaItemDTO[] }
}

export interface VisitasMensualesDTO {
  obraId: number | null
  /** Meses consecutivos 'YYYY-MM', el último es el mes actual. */
  meses: string[]
  /** null = el perfil no permite ver esa área. */
  tecnica: number[] | null
  prevencion: number[] | null
}
