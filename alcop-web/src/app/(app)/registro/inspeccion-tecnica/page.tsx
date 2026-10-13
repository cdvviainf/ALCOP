'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, FileText, Loader2, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Inspector {
  id: string
  nombre: string
}
const TODOS = '__ALL__'
const ORDENES: Array<{ value: string; label: string }> = [
  { value: 'fecha', label: 'Fecha' },
  { value: 'obra', label: 'Obra' },
  { value: 'inspector', label: 'Inspector' },
]

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Obra {
  id: number
  codigo: string
  nombre: string
}
interface Visita {
  id: number
  obra: { id: number; codigo: string; nombre: string }
  usuario: { id: string; nombre: string }
  fecha: string
  horaInicio: string | null
  horaTermino: string | null
  estado: 'EN_CURSO' | 'FINALIZADA'
  hallazgos: number
}
interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

function fecha(iso: string): string {
  return iso.slice(0, 10)
}

export default function VisitasTecnicasPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['TEC_INSPECCION'] === 'TOTAL'

  const [q, setQ] = useState('')
  const [qDeb, setQDeb] = useState('')
  const [page, setPage] = useState(1)
  const [nuevaOpen, setNuevaOpen] = useState(false)
  const [obraFiltro, setObraFiltro] = useState(TODOS)
  const [inspectorFiltro, setInspectorFiltro] = useState(TODOS)
  const [orden, setOrden] = useState('fecha')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [eliminando, setEliminando] = useState<Visita | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []
  const { data: inspResp } = useQuery({
    queryKey: ['visitas-inspectores'],
    queryFn: () => api.get('tecnica/visitas/inspectores').json<{ data: Inspector[] }>(),
  })
  const inspectores = inspResp?.data ?? []

  const { data, isLoading, isError } = useQuery({
    queryKey: ['visitas', { q: qDeb, page, obraFiltro, inspectorFiltro, orden, dir }],
    queryFn: () =>
      api
        .get('tecnica/visitas', {
          searchParams: {
            page: String(page),
            limit: '20',
            orden,
            dir,
            ...(qDeb ? { q: qDeb } : {}),
            ...(obraFiltro !== TODOS ? { obraId: obraFiltro } : {}),
            ...(inspectorFiltro !== TODOS ? { usuarioId: inspectorFiltro } : {}),
          },
        })
        .json<Paginated<Visita>>(),
  })
  const rows = data?.data ?? []
  const meta = data?.meta

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`tecnica/visitas/${id}`),
    onSuccess: () => {
      toast.success('Visita eliminada.')
      setEliminando(null)
      queryClient.invalidateQueries({ queryKey: ['visitas'] })
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  const irA = (id: number) => router.push(`/registro/inspeccion-tecnica/${id}`)

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Visita Técnica</h1>
              <p className="text-sm text-muted-foreground">
                Inspecciones a obra: hallazgos por unidad de lote, con fotos y comentario, y reporte resumen.
              </p>
            </div>
            {puedeEditar ? (
              <Button size="lg" className="font-semibold" onClick={() => setNuevaOpen(true)}>
                <Plus strokeWidth={2.5} />
                Nueva visita
              </Button>
            ) : null}
          </div>

          {/* Filtros y orden */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por obra…"
                className="h-10 rounded-lg bg-secondary pl-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wide text-label">OBRA</label>
              <Select
                value={obraFiltro}
                onValueChange={(v) => {
                  if (typeof v === 'string') {
                    setObraFiltro(v)
                    setPage(1)
                  }
                }}
                items={{ [TODOS]: 'Todas', ...Object.fromEntries(obras.map((o) => [String(o.id), o.nombre])) }}
              >
                <SelectTrigger className="h-10 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas las obras</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nombre} · {o.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wide text-label">INSPECTOR</label>
              <Select
                value={inspectorFiltro}
                onValueChange={(v) => {
                  if (typeof v === 'string') {
                    setInspectorFiltro(v)
                    setPage(1)
                  }
                }}
                items={{ [TODOS]: 'Todos', ...Object.fromEntries(inspectores.map((i) => [i.id, i.nombre])) }}
              >
                <SelectTrigger className="h-10 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos los inspectores</SelectItem>
                  {inspectores.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wide text-label">ORDENAR POR</label>
              <div className="flex gap-2">
                <Select
                  value={orden}
                  onValueChange={(v) => {
                    if (typeof v === 'string') {
                      setOrden(v)
                      setPage(1)
                    }
                  }}
                  items={Object.fromEntries(ORDENES.map((o) => [o.value, o.label]))}
                >
                  <SelectTrigger className="h-10 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDENES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10"
                  aria-label={dir === 'asc' ? 'Ascendente' : 'Descendente'}
                  title={dir === 'asc' ? 'Ascendente' : 'Descendente'}
                  onClick={() => {
                    setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    setPage(1)
                  }}
                >
                  <ArrowDownUp className={cn('size-4', dir === 'asc' && 'rotate-180')} />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obra</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Hallazgos</TableHead>
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
                      No hay visitas.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => irA(row.id)}
                    >
                      <TableCell className="font-medium">
                        {row.obra.nombre} <span className="text-xs text-muted-foreground">· {row.obra.codigo}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.usuario.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{fecha(row.fecha)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.horaInicio || row.horaTermino ? `${row.horaInicio ?? '—'}–${row.horaTermino ?? '—'}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.hallazgos}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                            row.estado === 'FINALIZADA' ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'
                          )}
                        >
                          {row.estado === 'FINALIZADA' ? 'FINALIZADA' : 'EN CURSO'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                                <MoreVertical />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => irA(row.id)}>
                              <Search className="size-4" />
                              Ver
                            </DropdownMenuItem>
                            {puedeEditar && row.estado === 'EN_CURSO' ? (
                              <DropdownMenuItem onClick={() => irA(row.id)}>
                                <Pencil className="size-4" />
                                Editar
                              </DropdownMenuItem>
                            ) : null}
                            {row.estado === 'FINALIZADA' ? (
                              <DropdownMenuItem
                                onClick={() => window.open(`/api/tecnica/visitas/${row.id}/reporte.pdf`, '_blank')}
                              >
                                <FileText className="size-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                            ) : null}
                            {puedeEditar ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setEliminando(row)}
                                >
                                  <Trash2 className="size-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {meta.total} visita{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages}
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

      <Dialog open={nuevaOpen} onOpenChange={setNuevaOpen}>
        {nuevaOpen ? (
          <NuevaVisitaDialog
            onCreada={(id) => {
              setNuevaOpen(false)
              queryClient.invalidateQueries({ queryKey: ['visitas'] })
              router.push(`/registro/inspeccion-tecnica/${id}`)
            }}
            onCancel={() => setNuevaOpen(false)}
          />
        ) : null}
      </Dialog>

      <Dialog open={eliminando !== null} onOpenChange={(o) => (!o ? setEliminando(null) : undefined)}>
        {eliminando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar visita</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres eliminar la visita de{' '}
                <span className="font-semibold text-foreground">{eliminando.obra.nombre}</span> del{' '}
                {fecha(eliminando.fecha)}? Se elimina de forma reversible (soft delete).
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

function NuevaVisitaDialog({ onCreada, onCancel }: { onCreada: (id: number) => void; onCancel: () => void }) {
  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []
  const [obraId, setObraId] = useState<string | undefined>(undefined)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [inicio, setInicio] = useState('')
  const [termino, setTermino] = useState('')

  const crear = useMutation({
    mutationFn: () =>
      api
        .post('tecnica/visitas', {
          json: {
            obraId: Number(obraId),
            fecha,
            horaInicio: inicio || null,
            horaTermino: termino || null,
          },
        })
        .json<{ id: number }>(),
    onSuccess: (v) => onCreada(v.id),
    onError: (err: Error) => toast.error(err.message || 'No se pudo crear la visita.'),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva visita</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Obra</Label>
          <Select
            value={obraId}
            onValueChange={(v) => typeof v === 'string' && setObraId(v)}
            items={Object.fromEntries(obras.map((o) => [String(o.id), `${o.nombre} · ${o.codigo}`]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una obra…" />
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.nombre} · {o.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-fecha">Fecha</Label>
            <Input id="v-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-ini">Hora inicio</Label>
            <Input id="v-ini" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-fin">Hora término</Label>
            <Input id="v-fin" type="time" value={termino} onChange={(e) => setTermino(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!obraId || !fecha || crear.isPending}
          onClick={() => crear.mutate()}
        >
          {crear.isPending ? <Loader2 className="animate-spin" /> : null}
          Crear y continuar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
