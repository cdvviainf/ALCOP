'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ClipboardPen, FileText, Loader2, Pencil, Search } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Opcion {
  id: number
  codigo: string
  nombre: string
}
type Estado = 'EN_PROGRESO' | 'COMPLETADO'
interface Registro {
  id: number
  fecha: string
  formulario: Opcion
  estado: Estado
  responsable: string
  fechaRevision: string | null
}
interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

const TODOS = '__ALL__'
const ESTADOS = [
  { value: TODOS, label: 'Todos' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'COMPLETADO', label: 'Completado' },
]
const BADGE: Record<Estado, string> = {
  EN_PROGRESO: 'bg-primary/10 text-primary',
  COMPLETADO: 'bg-ok-bg text-ok-fg',
}
const LABEL: Record<Estado, string> = { EN_PROGRESO: 'En progreso', COMPLETADO: 'Completado' }

export default function RegistroTecnicoPage() {
  const router = useRouter()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['TEC_REGISTROS'] === 'TOTAL'

  const [obraId, setObraId] = useState<number | null>(null)
  const [formularioId, setFormularioId] = useState<number | null>(null)
  const [estado, setEstado] = useState(TODOS)
  const [page, setPage] = useState(1)

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Opcion[] }>(),
  })
  const obras = obrasResp?.data ?? []

  const { data: formsResp } = useQuery({
    queryKey: ['registros-tecnica-formularios'],
    queryFn: () => api.get('tecnica/registros/formularios-opciones').json<{ data: Opcion[] }>(),
  })
  const formularios = formsResp?.data ?? []

  const { data, isLoading, isError } = useQuery({
    queryKey: ['registros-tecnica', obraId, estado, page],
    queryFn: () =>
      api
        .get('tecnica/registros', {
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

  const irA = (id: number) => router.push(`/registro/tecnica/${id}`)

  const aplicar = useMutation({
    mutationFn: () =>
      api.post('tecnica/registros', { json: { obraId, formularioId } }).json<{ id: number; reanudado: boolean }>(),
    onSuccess: ({ id, reanudado }) => {
      if (reanudado) toast.info('Este formulario ya estaba en progreso en la obra; se retoma ese registro.')
      irA(id)
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo aplicar el formulario.'),
  })

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Registro Técnico</h1>
            <p className="text-sm text-muted-foreground">
              Selecciona la obra y el formulario, complétalo y ciérralo con la fecha de revisión.
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
            {puedeEditar ? (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold tracking-wide text-label">FORMULARIO</Label>
                  <Select
                    value={formularioId !== null ? String(formularioId) : undefined}
                    onValueChange={(v) => {
                      if (typeof v === 'string') setFormularioId(Number(v))
                    }}
                    items={Object.fromEntries(formularios.map((f) => [String(f.id), `${f.codigo} · ${f.nombre}`]))}
                  >
                    <SelectTrigger className="h-10 w-96 max-w-full">
                      <SelectValue placeholder="Selecciona un formulario…" />
                    </SelectTrigger>
                    <SelectContent>
                      {formularios.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.codigo} · {f.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="h-10"
                  disabled={obraId === null || formularioId === null || aplicar.isPending}
                  onClick={() => aplicar.mutate()}
                >
                  {aplicar.isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPen className="size-4" />}
                  Llenar formulario
                </Button>
              </>
            ) : null}
          </div>

          {obraId === null ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
              Selecciona una obra para ver sus registros.
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">Registros de la obra</h2>
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
                  <SelectTrigger className="h-9 w-44" aria-label="Estado">
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
              <div className="rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Formulario</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Revisión</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" /> Cargando…
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-sm text-destructive">
                          No se pudieron cargar los datos.
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                          <TableCell className="text-muted-foreground">{row.responsable}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                                BADGE[row.estado]
                              )}
                            >
                              {LABEL[row.estado]}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.fechaRevision ?? '—'}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {row.estado === 'COMPLETADO' ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Descargar PDF"
                                onClick={() => window.open(`/api/tecnica/registros/${row.id}/reporte.pdf`, '_blank')}
                              >
                                <FileText />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={row.estado === 'EN_PROGRESO' && puedeEditar ? 'Continuar' : 'Ver'}
                              onClick={() => irA(row.id)}
                            >
                              {row.estado === 'EN_PROGRESO' && puedeEditar ? <Pencil /> : <Search />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
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
    </>
  )
}
