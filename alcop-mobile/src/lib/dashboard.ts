import { useQuery } from '@tanstack/react-query'

import { api } from './api'

export type Area = 'PREVENCION' | 'TECNICA'

export interface Categoria {
  id: number | null
  codigo: string
  nombre: string
  n: number
}
export interface AreaResumen {
  visitas: number
  hallazgos: Categoria[]
}
export interface AgendaItem {
  id: number
  area: Area
  fecha: string
  vence: string
  enBorrador: boolean
  obra: { id: number; codigo: string; nombre: string }
  formulario: { id: number; codigo: string; nombre: string }
}
export interface Dashboard {
  hoy: string
  permisos: { tecnica: boolean; prevencion: boolean; agenda: Area[]; registrar: Area[] }
  obras: { total: number }
  tecnica: AreaResumen | null
  prevencion: AreaResumen | null
  agenda: { dias: number; atrasadas: AgendaItem[]; proximas: AgendaItem[] }
}

/** Mismo endpoint que el dashboard web (alcance por obra y por área en la API). */
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('nucleo/dashboard').json<Dashboard>() })
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const aUtc = (s: string) => new Date(`${s}T00:00:00Z`)

export function fechaCorta(s: string) {
  const d = aUtc(s)
  const t = `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function relativo(fecha: string, hoy: string): { texto: string; tono: 'hoy' | 'mal' | 'normal' } {
  const d = Math.round((aUtc(fecha).getTime() - aUtc(hoy).getTime()) / 86_400_000)
  if (d === 0) return { texto: 'Hoy', tono: 'hoy' }
  if (d === 1) return { texto: 'Mañana', tono: 'normal' }
  if (d === -1) return { texto: 'Hace 1 día', tono: 'mal' }
  if (d < 0) return { texto: `Hace ${-d} días`, tono: 'mal' }
  return { texto: `En ${d} días`, tono: 'normal' }
}
