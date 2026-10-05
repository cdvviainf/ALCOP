import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Hook genérico de lectura contra alcop-api vía TanStack Query + ky.
 * Ej.: const { data } = useApiQuery<Obra[]>(['obras'], 'nucleo/obras')
 */
export function useApiQuery<T>(key: readonly unknown[], path: string) {
  return useQuery({
    queryKey: key,
    queryFn: () => api.get(path).json<T>(),
  })
}
