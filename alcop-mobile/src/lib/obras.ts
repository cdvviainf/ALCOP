import { useQuery } from '@tanstack/react-query'

import { api } from './api'
import type { ObraMini, Paginado } from './tipos'

/** Obras visibles para el usuario (la API ya filtra por acceso — UsuarioObra / esAdmin). */
export function useObras() {
  return useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<Paginado<ObraMini>>(),
    staleTime: 5 * 60_000,
  })
}
