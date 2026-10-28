'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, Lock, MoreVertical, Pencil, Search } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Obra {
  id: number
  codigo: string
  nombre: string
}
type EstadoRegistro = 'POR_APLICAR' | 'VIGENTE' | 'ATRASADO' | 'COMPLETADO'
interface Registro {
  id: number
  fecha: string
  obra: { id: number; codigo: string; nombre: string }
  formulario: { id: number; codigo: string; nombre: string }
  estado: EstadoRegistro
  enProgreso: boolean
  fechaRevision: string | null
}
interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

const TODOS = '__ALL__'
const ESTADOS: Array<{ value: string; label: string }> = [
  { value: TODOS, label: 'Todos' },
  { value: 'POR_APLICAR', label: 'Por aplicar' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'COMPLETADO', label: 'Completado' },
]
const BADGE: Record<EstadoRegistro, string> = {
  POR_APLICAR: 'bg-secondary text-muted-foreground',
  VIGENTE: 'bg-primary/10 text-primary',
  ATRASADO: 'bg-destructive/10 text-destructive',
  COMPLETADO: 'bg-ok-bg text-ok-fg',
}
const LABEL: Record<EstadoRegistro, string> = {
  POR_APLICAR: 'Por aplicar',
  VIGENTE: 'Vigente',
  ATRASADO: 'Atrasado',
  COMPLETADO: 'Completado',
}

function hoyIso(): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return p
}

export default function RegistrosPrevencionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['PREV_REGISTROS'] === 'TOTAL'

  const [obraId, setObraId] = useState<number | null>(null)
  const [estado, setEstado] = useState(TODOS)
  const [page, setPage] = useState(1)
  const [cerrando, setCerrando] = useState<Registro | null>(null)

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []

  const { data, isLoading, isError } = useQuery({
    queryKey: ['registros', obraId, estado, page],
    queryFn: () =>
      api
        .get('prevencion/registros', {
          searchParams: {
            obraId: String(obraId),
            page: String(page),
            limit: '20',
            ...(estado !== TODOS ? { estado } : {}),
          },
        })
        .json<Paginated<Registro>>(),
    enabled: obraId !== null,
  })
  const rows = data?.data ?? []
  const meta = data?.meta

  const irA = (id: number) => router.push(`/registro/prevencion/${id}`)

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Registro Prevención</h1>
            <p className="text-sm text-muted-foreground">
              Llenado de los formularios agendados en el calendario. Completa las respuestas y cierra con la fecha de revisión.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold tracking-wide text-label">OBRA</Label>
              <Select
                value={obraId !== null ? String(obraId) : undefined}
                onValueChange={(v) => {
                  if (typeof v === 'string') {
                    setObraId(Number(v))
                    setPage(1)
                  }
                }}
                items={Object.fromEntries(obras.map((o) => [String(o.id), `${o.nombre} · ${o.codigo}`]))}
              >
                <SelectTrigger className="h-10 w-72">
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
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold tracking-wide text-label">ESTADO</Label>
              <Select
                value={estado}
                onValueChange={(v) => {
                  if (typeof v === 'string') {
                    setEstado(v)
                    setPage(1)
                  }
                }}
                items={Object.fromEntries(ESTADOS.map((e) => [e.value, e.label]))}
              >
                <SelectTrigger className="h-10 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {obraId === null ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
              Selecciona una obra para ver sus registros.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Formulario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Revisión</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Cargando…
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-destructive">
                        No se pudieron cargar los datos.
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No hay registros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id} className="cursor-pointer" onClick={() => irA(row.id)}>
                        <TableCell className="text-muted-foreground">{row.fecha}</TableCell>
                        <TableCell className="font-medium">
                          {row.formulario.nombre}{' '}
                          <span className="text-xs text-muted-foreground">· {row.formulario.codigo}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                              BADGE[row.estado]
                            )}
                          >
                            {LABEL[row.estado]}
                          </span>
                          {row.enProgreso ? (
                            <span className="ml-2 text-[11px] text-muted-foreground">en progreso</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.fechaRevision ?? '—'}</TableCell>
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
                              {row.estado === 'COMPLETADO' ? (
                                <>
                                  <DropdownMenuItem onClick={() => irA(row.id)}>
                                    <Search className="size-4" />
                                    Ver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/api/prevencion/registros/${row.id}/reporte.pdf`, '_blank')}
                                  >
                                    <FileText className="size-4" />
                                    Descargar PDF
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => irA(row.id)}>
                                    <Pencil className="size-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  {puedeEditar ? (
                                    <DropdownMenuItem onClick={() => setCerrando(row)}>
                                      <Lock className="size-4" />
                                      Cerrar
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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

      <Dialog open={cerrando !== null} onOpenChange={(o) => (!o ? setCerrando(null) : undefined)}>
        {cerrando ? (
          <CerrarDialog
            registro={cerrando}
            onDone={() => {
              setCerrando(null)
              queryClient.invalidateQueries({ queryKey: ['registros'] })
            }}
            onEditar={() => {
              const id = cerrando.id
              setCerrando(null)
              irA(id)
            }}
            onCancel={() => setCerrando(null)}
          />
        ) : null}
      </Dialog>
    </>
  )
}

function CerrarDialog({
  registro,
  onDone,
  onEditar,
  onCancel,
}: {
  registro: Registro
  onDone: () => void
  onEditar: () => void
  onCancel: () => void
}) {
  const [fechaRevision, setFechaRevision] = useState(hoyIso())

  const cerrar = useMutation({
    mutationFn: () => api.post(`prevencion/registros/${registro.id}/cerrar`, { json: { fechaRevision } }).json(),
    onSuccess: () => {
      toast.success('Registro cerrado.')
      onDone()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo cerrar.'),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Cerrar registro</DialogTitle>
        <DialogDescription>
          {registro.formulario.nombre} · {registro.fecha}. Se cerrará solo si todas las respuestas obligatorias (y sus
          fotos) están completas. Si falta algo, usa Editar.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="fecha-revision">Fecha de revisión</Label>
        <Input
          id="fecha-revision"
          type="date"
          value={fechaRevision}
          max={hoyIso()}
          onChange={(e) => setFechaRevision(e.target.value)}
        />
      </div>
      <DialogFooter className="justify-between sm:justify-between">
        <Button variant="outline" onClick={onEditar}>
          <Pencil className="size-4" />
          Editar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!fechaRevision || cerrar.isPending} onClick={() => cerrar.mutate()}>
            {cerrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            Cerrar registro
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
