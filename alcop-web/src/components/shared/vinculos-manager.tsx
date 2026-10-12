'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Vinculo {
  id: number
  codigo: string
  nombre: string
  /** Si viene y es false, el ítem no se ofrece en el selector de alta (QA-LP-002/003). */
  activo?: boolean
}

interface Paginated<T> {
  data: T[]
}

export interface VinculosManagerProps {
  /** Ruta del sub-recurso de vínculos (GET lista, POST crea): p. ej. `nucleo/tipos-lote/3/procedimientos`. */
  linkedPath: string
  /** Clave de TanStack Query para la lista de vínculos. */
  invalidateKey: readonly unknown[]
  /** Ruta del catálogo completo de ítems vinculables (paginado). */
  catalogoPath: string
  /** Construye el body del POST de vínculo a partir del id del ítem. */
  linkBody: (itemId: number) => Record<string, number>
  /** Texto secundario (código) de un ítem. */
  itemSecondary?: (item: Vinculo) => string
  /** Habilita agregar/quitar. */
  puedeEditar: boolean
  /** Mensaje cuando no hay vínculos. */
  emptyMessage?: string
  /** Placeholder del selector de alta. */
  addPlaceholder?: string
}

/**
 * Gestor genérico de una relación M:N: lista los ítems vinculados (con botón de
 * quitar) y un selector para agregar desde el catálogo (excluyendo los ya
 * vinculados). Usado para Tipo de Lote ↔ Procedimiento y Procedimiento ↔
 * Formulario (Docs/lotes-procedimientos.md §5).
 */
export function VinculosManager({
  linkedPath,
  invalidateKey,
  catalogoPath,
  linkBody,
  itemSecondary,
  puedeEditar,
  emptyMessage = 'Sin vínculos.',
  addPlaceholder = 'Agregar…',
}: VinculosManagerProps) {
  const queryClient = useQueryClient()
  const [busq, setBusq] = useState('')
  const [busqDeb, setBusqDeb] = useState('')

  // Debounce de la búsqueda del catálogo (QA-LP-009): permite alcanzar ítems más
  // allá de los primeros 100 sin paginar el selector.
  useEffect(() => {
    const t = setTimeout(() => setBusqDeb(busq.trim()), 300)
    return () => clearTimeout(t)
  }, [busq])

  const { data: linkedResp, isLoading } = useQuery({
    queryKey: invalidateKey,
    queryFn: () => api.get(linkedPath).json<Paginated<Vinculo>>(),
  })
  const vinculados = linkedResp?.data ?? []

  const { data: catalogoResp } = useQuery({
    queryKey: [catalogoPath, { all: true, q: busqDeb }],
    queryFn: () =>
      api
        .get(catalogoPath, {
          searchParams: { limit: '100', ...(busqDeb ? { q: busqDeb } : {}) },
        })
        .json<Paginated<Vinculo>>(),
    enabled: puedeEditar,
  })
  const catalogo = catalogoResp?.data ?? []
  const yaIds = new Set(vinculados.map((v) => v.id))
  // Excluye los ya vinculados y los inactivos (si el catálogo expone `activo`).
  const disponibles = catalogo.filter((c) => !yaIds.has(c.id) && c.activo !== false)

  const invalidar = () => queryClient.invalidateQueries({ queryKey: invalidateKey })

  const agregar = useMutation({
    mutationFn: (itemId: number) => api.post(linkedPath, { json: linkBody(itemId) }).json(),
    onSuccess: () => {
      toast.success('Vínculo agregado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  const quitar = useMutation({
    mutationFn: (itemId: number) => api.delete(`${linkedPath}/${itemId}`),
    onSuccess: () => {
      toast.success('Vínculo quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : vinculados.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          vinculados.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{v.nombre}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {itemSecondary ? itemSecondary(v) : v.codigo}
                </div>
              </div>
              {puedeEditar ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar"
                  disabled={quitar.isPending}
                  onClick={() => quitar.mutate(v.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X />
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      {puedeEditar ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            placeholder="Buscar en el catálogo…"
            className="h-9 bg-secondary pl-9 text-sm"
          />
        </div>
      ) : null}

      {puedeEditar ? (
        <Select
          value={undefined}
          onValueChange={(v) => typeof v === 'string' && agregar.mutate(Number(v))}
          items={Object.fromEntries(disponibles.map((d) => [String(d.id), d.nombre]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={addPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {disponibles.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.nombre} · {d.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
