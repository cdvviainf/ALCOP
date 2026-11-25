import { useQuery } from '@tanstack/react-query'

import { api } from './api'

export type Nivel = 'SIN_ACCESO' | 'LECTURA' | 'TOTAL'

export interface Me {
  id: string
  nombre: string
  email: string
  esAdmin: boolean
  perfil: { id: number; nombre: string } | null
  permisos: Record<string, Nivel>
}

/** Usuario de dominio + mapa de permisos (GET /usuarios/me), igual que la web. */
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>() })
}

/** ≥ LECTURA (o TOTAL) en alguna de las funciones; esAdmin siempre. */
export function puede(me: Me | undefined, funciones: string[], min: 'LECTURA' | 'TOTAL' = 'LECTURA'): boolean {
  if (!me) return false
  if (me.esAdmin) return true
  return funciones.some((f) => {
    const n = me.permisos[f] ?? 'SIN_ACCESO'
    return min === 'LECTURA' ? n !== 'SIN_ACCESO' : n === 'TOTAL'
  })
}
