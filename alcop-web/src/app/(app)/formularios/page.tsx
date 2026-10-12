'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}

interface Formulario {
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

interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

const FORM_FUNCION: Record<string, string> = { PREVENCION: 'PREV_FORMULARIOS', TECNICA: 'TEC_FORMULARIOS' }

export default function FormulariosPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })

  const puedeEditarArea = (areaCodigo: string) =>
    me?.esAdmin === true || me?.permisos?.[FORM_FUNCION[areaCodigo]] === 'TOTAL'
  // Puede crear si tiene TOTAL en al menos un área.
  const puedeCrear =
    me?.esAdmin === true ||
    me?.permisos?.['PREV_FORMULARIOS'] === 'TOTAL' ||
    me?.permisos?.['TEC_FORMULARIOS'] === 'TOTAL'

  const [q, setQ] = useState('')
  const [qDeb, setQDeb] = useState('')
  const [page, setPage] = useState(1)
  const [eliminando, setEliminando] = useState<Formulario | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['formularios', { q: qDeb, page }],
    queryFn: () =>
      api
        .get('nucleo/formularios', {
          searchParams: { page: String(page), limit: '20', ...(qDeb ? { q: qDeb } : {}) },
        })
        .json<Paginated<Formulario>>(),
  })
  const rows = data?.data ?? []
  const meta = data?.meta

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`nucleo/formularios/${id}`),
    onSuccess: () => {
      toast.success('Formulario eliminado.')
      setEliminando(null)
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Formularios</h1>
              <p className="text-sm text-muted-foreground">
                Plantillas de checklist dinámicas por área. Cada formulario agrupa preguntas con su tipo de respuesta.
              </p>
            </div>
            {puedeCrear ? (
              <Button size="lg" className="font-semibold" onClick={() => router.push('/formularios/nuevo')}>
                <Plus strokeWidth={2.5} />
                Nuevo
              </Button>
            ) : null}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="h-10 rounded-lg bg-secondary pl-9 text-sm"
            />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulario</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Preguntas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Cargando…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-destructive">
                      No se pudieron cargar los datos.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay formularios.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const editable = puedeEditarArea(row.areaCodigo)
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.nombre}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.codigo}</TableCell>
                        <TableCell className="text-muted-foreground">{row.areaNombre}</TableCell>
                        <TableCell className="text-muted-foreground">{row.categoriaNombre}</TableCell>
                        <TableCell className="text-muted-foreground">{row.preguntas}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                              row.activo ? 'bg-ok-bg text-ok-fg' : 'bg-secondary text-foreground'
                            )}
                          >
                            {row.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editable ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Editar"
                                onClick={() => router.push(`/formularios/${row.id}`)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Eliminar"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setEliminando(row)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {meta.total} registro{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Dialog open={eliminando !== null} onOpenChange={(open) => (!open ? setEliminando(null) : undefined)}>
        {eliminando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar formulario</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres eliminar{' '}
                <span className="font-semibold text-foreground">{eliminando.nombre}</span>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={eliminar.isPending} onClick={() => eliminar.mutate(eliminando.id)}>
                {eliminar.isPending ? <Loader2 className="animate-spin" /> : null}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}
