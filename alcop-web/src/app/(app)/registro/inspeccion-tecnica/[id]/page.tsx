'use client'

import { use, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Foto {
  id: number
  calidad: string
  tamano: number
  orden: number
  url: string
}
type TipoRegistro = 'HALLAZGO' | 'NOTA_TECNICA'
interface Hallazgo {
  id: number
  loteUnidad: { id: number; descripcion: string }
  tipoRegistro: TipoRegistro
  tipoHallazgo: { id: number; nombre: string } | null
  comentario: string | null
  fotos: Foto[]
}
interface Visita {
  id: number
  obra: { id: number; codigo: string; nombre: string }
  usuario: { id: string; nombre: string }
  fecha: string
  horaInicio: string | null
  horaTermino: string | null
  estado: 'EN_CURSO' | 'FINALIZADA'
  resumenFinal: string | null
  hallazgos: Hallazgo[]
}
interface Unidad {
  id: number
  descripcion: string
}
interface TipoHallazgo {
  id: number
  nombre: string
}

const CALIDADES = ['ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA']

/** Etiqueta de grupo: las notas técnicas van juntas; los hallazgos por su tipo. */
function etiquetaGrupo(h: Hallazgo): string {
  if (h.tipoRegistro === 'NOTA_TECNICA') return 'Notas técnicas'
  return h.tipoHallazgo?.nombre ?? 'Sin tipo'
}

/** Agrupa hallazgos/notas, preservando el orden de aparición de cada grupo. */
function agruparPorTipo(hallazgos: Hallazgo[]): Array<{ tipo: string; items: Hallazgo[] }> {
  const map = new Map<string, Hallazgo[]>()
  for (const h of hallazgos) {
    const k = etiquetaGrupo(h)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(h)
  }
  return [...map.entries()].map(([tipo, items]) => ({ tipo, items }))
}

export default function VisitaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const visitaId = Number(id)
  const queryClient = useQueryClient()
  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['visita', id] })

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const { data: visita, isLoading } = useQuery({
    queryKey: ['visita', id],
    queryFn: () => api.get(`tecnica/visitas/${id}`).json<Visita>(),
    retry: false,
  })
  const puedeEditarGlobal = me?.esAdmin === true || me?.permisos?.['TEC_INSPECCION'] === 'TOTAL'
  const editable = Boolean(visita && visita.estado === 'EN_CURSO' && puedeEditarGlobal)

  const { data: unidadesResp } = useQuery({
    queryKey: ['obra-unidades', visita?.obra.id],
    queryFn: () => api.get(`nucleo/obras/${visita!.obra.id}/unidades`).json<{ data: Unidad[] }>(),
    enabled: !!visita,
  })
  const unidades = unidadesResp?.data ?? []

  const { data: tiposResp } = useQuery({
    queryKey: ['tipos-hallazgo', { all: true }],
    queryFn: () => api.get('tecnica/tipos-hallazgo', { searchParams: { limit: '100' } }).json<{ data: TipoHallazgo[] }>(),
  })
  const tipos = tiposResp?.data ?? []

  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [editandoHallazgo, setEditandoHallazgo] = useState<Hallazgo | null>(null)

  const quitarHallazgo = useMutation({
    mutationFn: (hid: number) => api.delete(`tecnica/visitas/${id}/hallazgos/${hid}`),
    onSuccess: () => {
      toast.success('Hallazgo quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  if (isLoading) {
    return (
      <>
        <BreadcrumbBar backHref="/registro/inspeccion-tecnica" trail="Visita Técnica" current="…" />
        <main className="flex-1 p-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        </main>
      </>
    )
  }
  if (!visita) {
    return (
      <>
        <BreadcrumbBar backHref="/registro/inspeccion-tecnica" trail="Visita Técnica" current="Error" />
        <main className="flex-1 p-8">
          <p className="text-sm text-destructive">No se pudo cargar la visita.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <BreadcrumbBar backHref="/registro/inspeccion-tecnica" trail="Visita Técnica" current={visita.obra.nombre} />
      <main className="flex-1 space-y-6 p-8">
        {/* Encabezado */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{visita.obra.nombre}</h1>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                    visita.estado === 'FINALIZADA' ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'
                  )}
                >
                  {visita.estado === 'FINALIZADA' ? 'FINALIZADA' : 'EN CURSO'}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Inspector: {visita.usuario.nombre} · {visita.fecha.slice(0, 10)} ·{' '}
                {visita.horaInicio || visita.horaTermino ? `${visita.horaInicio ?? '—'}–${visita.horaTermino ?? '—'}` : 'sin horario'}
              </p>
            </div>
            <div className="flex gap-2">
              {visita.estado === 'FINALIZADA' ? (
                <a
                  href={`/api/tecnica/visitas/${visitaId}/reporte.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-secondary"
                >
                  <FileText className="size-4" />
                  Exportar PDF
                </a>
              ) : null}
              {editable ? (
                <>
                  <Button variant="outline" className="h-10" onClick={() => setEditarOpen(true)}>
                    Editar datos
                  </Button>
                  <Button className="h-10" onClick={() => setFinalizarOpen(true)} disabled={visita.hallazgos.length === 0}>
                    Finalizar
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Agregar hallazgo */}
        {editable ? (
          <AgregarHallazgo visitaId={visitaId} unidades={unidades} tipos={tipos} onAdded={invalidar} />
        ) : null}

        {/* Hallazgos agrupados por tipo */}
        <div className="space-y-5">
          <h2 className="text-sm font-bold text-foreground">Hallazgos ({visita.hallazgos.length})</h2>
          {visita.hallazgos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay hallazgos.</p>
          ) : (
            agruparPorTipo(visita.hallazgos).map((grupo) => (
              <div key={grupo.tipo} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-label">
                  {grupo.tipo} <span className="text-muted-foreground">({grupo.items.length})</span>
                </h3>
                {grupo.items.map((h) => (
                  <div key={h.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{h.loteUnidad.descripcion}</span>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                              h.tipoRegistro === 'NOTA_TECNICA' ? 'bg-secondary text-muted-foreground' : 'bg-warn-bg text-warn-fg'
                            )}
                          >
                            {h.tipoRegistro === 'NOTA_TECNICA' ? 'NOTA TÉCNICA' : 'HALLAZGO'}
                          </span>
                          {/* Prompt accionable solo en visitas editables; en FINALIZADA
                              (histórica, grandfathered) sería ruido engañoso (QA-VT-001). */}
                          {editable && h.tipoRegistro === 'HALLAZGO' && h.fotos.length === 0 ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                              Falta foto
                            </span>
                          ) : null}
                        </div>
                        {h.comentario ? (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{h.comentario}</p>
                        ) : (
                          <p className="mt-1.5 text-sm text-muted-foreground">Sin comentario.</p>
                        )}
                      </div>
                      {editable ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label="Editar hallazgo" onClick={() => setEditandoHallazgo(h)}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Quitar hallazgo"
                            className="text-destructive hover:text-destructive"
                            disabled={quitarHallazgo.isPending}
                            onClick={() => quitarHallazgo.mutate(h.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {h.fotos.map((f) => (
                        <FotoThumb key={f.id} foto={f} editable={editable} onDeleted={invalidar} />
                      ))}
                    </div>
                    {editable ? <SubirFoto hallazgoId={h.id} onUploaded={invalidar} /> : null}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {visita.estado === 'FINALIZADA' && visita.resumenFinal ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold text-foreground">Resumen final</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{visita.resumenFinal}</p>
          </div>
        ) : null}
      </main>

      <Dialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        {finalizarOpen ? (
          <FinalizarDialog visitaId={visitaId} onDone={() => { setFinalizarOpen(false); invalidar() }} onCancel={() => setFinalizarOpen(false)} />
        ) : null}
      </Dialog>

      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        {editarOpen ? (
          <EditarVisitaDialog
            visitaId={visitaId}
            visita={visita}
            onDone={() => { setEditarOpen(false); invalidar() }}
            onCancel={() => setEditarOpen(false)}
          />
        ) : null}
      </Dialog>

      <Dialog open={editandoHallazgo !== null} onOpenChange={(o) => (!o ? setEditandoHallazgo(null) : undefined)}>
        {editandoHallazgo ? (
          <EditarHallazgoDialog
            visitaId={visitaId}
            hallazgo={editandoHallazgo}
            unidades={unidades}
            tipos={tipos}
            onDone={() => { setEditandoHallazgo(null); invalidar() }}
            onCancel={() => setEditandoHallazgo(null)}
          />
        ) : null}
      </Dialog>
    </>
  )
}

function AgregarHallazgo({
  visitaId,
  unidades,
  tipos,
  onAdded,
}: {
  visitaId: number
  unidades: Unidad[]
  tipos: TipoHallazgo[]
  onAdded: () => void
}) {
  const [loteUnidadId, setLoteUnidadId] = useState<string | undefined>(undefined)
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>('HALLAZGO')
  const [tipoId, setTipoId] = useState<string | undefined>(undefined)
  const [comentario, setComentario] = useState('')

  const esHallazgo = tipoRegistro === 'HALLAZGO'
  // HALLAZGO: unidad + tipo + comentario (y foto, exigida al finalizar).
  // NOTA_TECNICA: unidad + comentario (foto opcional). Comentario obligatorio en ambos.
  const puedeAgregar = Boolean(loteUnidadId) && comentario.trim().length > 0 && (!esHallazgo || Boolean(tipoId))

  const crear = useMutation({
    mutationFn: () =>
      api
        .post(`tecnica/visitas/${visitaId}/hallazgos`, {
          json: {
            loteUnidadId: Number(loteUnidadId),
            tipoRegistro,
            tipoHallazgoId: esHallazgo ? Number(tipoId) : null,
            comentario: comentario.trim(),
          },
        })
        .json(),
    onSuccess: () => {
      toast.success(esHallazgo ? 'Hallazgo agregado.' : 'Nota técnica agregada.')
      setLoteUnidadId(undefined)
      setTipoRegistro('HALLAZGO')
      setTipoId(undefined)
      setComentario('')
      onAdded()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-5">
      <h2 className="text-sm font-bold text-foreground">Agregar registro</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Unidad de lote</Label>
          <Select
            value={loteUnidadId}
            onValueChange={(v) => typeof v === 'string' && setLoteUnidadId(v)}
            items={Object.fromEntries(unidades.map((u) => [String(u.id), u.descripcion]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={unidades.length ? 'Selecciona…' : 'La obra no tiene unidades'} />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de registro</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['HALLAZGO', 'NOTA_TECNICA'] as const).map((tr) => (
              <Button
                key={tr}
                type="button"
                variant={tipoRegistro === tr ? 'default' : 'outline'}
                className="h-10"
                onClick={() => setTipoRegistro(tr)}
              >
                {tr === 'HALLAZGO' ? 'Hallazgo' : 'Nota técnica'}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {esHallazgo ? (
        <div className="mt-3 space-y-1.5">
          <Label>Tipo de hallazgo</Label>
          <Select
            value={tipoId}
            onValueChange={(v) => typeof v === 'string' && setTipoId(v)}
            items={Object.fromEntries(tipos.map((t) => [String(t.id), t.nombre]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="h-com">Comentario</Label>
        <textarea
          id="h-com"
          rows={2}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario (obligatorio)"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {esHallazgo ? (
          <p className="text-xs text-muted-foreground">
            Un hallazgo requiere al menos una foto; se agrega abajo y se valida al finalizar.
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex justify-end">
        <Button disabled={!puedeAgregar || crear.isPending} onClick={() => crear.mutate()}>
          {crear.isPending ? <Loader2 className="animate-spin" /> : <Plus strokeWidth={2.5} />}
          Agregar
        </Button>
      </div>
    </div>
  )
}

const calidadLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase()

function SubirFoto({ hallazgoId, onUploaded }: { hallazgoId: number; onUploaded: () => void }) {
  // La calidad por defecto del sistema viene PRESELECCIONADA (QA-OLA-B-001); el
  // inspector puede cambiarla por foto.
  const { data: config } = useQuery({
    queryKey: ['config-calidad-imagen'],
    queryFn: () => api.get('nucleo/configuracion/calidad-imagen').json<{ calidadImagenDefault: string }>(),
    staleTime: 60_000,
  })
  const defaultCalidad = config?.calidadImagenDefault ?? 'OPTIMIZADA'
  const [calidadSel, setCalidadSel] = useState<string | null>(null)
  const calidad = calidadSel ?? defaultCalidad
  const [subiendo, setSubiendo] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('calidad', calidad)
      fd.append('imagen', file)
      await api.post(`tecnica/hallazgos/${hallazgoId}/fotos`, { body: fd })
      toast.success('Foto agregada.')
      onUploaded()
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo subir la foto.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <Select
        value={calidad}
        onValueChange={(v) => typeof v === 'string' && setCalidadSel(v)}
        items={Object.fromEntries(CALIDADES.map((c) => [c, calidadLabel(c)]))}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CALIDADES.map((c) => (
            <SelectItem key={c} value={c}>
              {calidadLabel(c)}
              {c === defaultCalidad ? ' · sugerida' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary">
        {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Agregar foto
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={subiendo}
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

function FotoThumb({ foto, editable, onDeleted }: { foto: Foto; editable: boolean; onDeleted: () => void }) {
  const quitar = useMutation({
    mutationFn: () => api.delete(`tecnica/fotos/${foto.id}`),
    onSuccess: () => {
      toast.success('Foto quitada.')
      onDeleted()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })
  return (
    <div className="group relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.url} alt="Hallazgo" className="size-24 rounded-lg border border-border object-cover" />
      {editable ? (
        <button
          type="button"
          aria-label="Quitar foto"
          disabled={quitar.isPending}
          onClick={() => quitar.mutate()}
          className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function FinalizarDialog({ visitaId, onDone, onCancel }: { visitaId: number; onDone: () => void; onCancel: () => void }) {
  const [resumen, setResumen] = useState('')
  const finalizar = useMutation({
    mutationFn: () => api.post(`tecnica/visitas/${visitaId}/finalizar`, { json: { resumenFinal: resumen.trim() || null } }).json(),
    onSuccess: () => {
      toast.success('Visita finalizada.')
      onDone()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo finalizar.'),
  })
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Finalizar visita</DialogTitle>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="resumen">Resumen final del inspector</Label>
        <textarea
          id="resumen"
          rows={4}
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          placeholder="Síntesis de la inspección…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">Al finalizar, la visita queda en solo lectura.</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={finalizar.isPending} onClick={() => finalizar.mutate()}>
          {finalizar.isPending ? <Loader2 className="animate-spin" /> : null}
          Finalizar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function EditarVisitaDialog({
  visitaId,
  visita,
  onDone,
  onCancel,
}: {
  visitaId: number
  visita: Visita
  onDone: () => void
  onCancel: () => void
}) {
  const [fecha, setFecha] = useState(visita.fecha.slice(0, 10))
  const [inicio, setInicio] = useState(visita.horaInicio ?? '')
  const [termino, setTermino] = useState(visita.horaTermino ?? '')

  const guardar = useMutation({
    mutationFn: () =>
      api
        .patch(`tecnica/visitas/${visitaId}`, {
          json: { fecha, horaInicio: inicio || null, horaTermino: termino || null },
        })
        .json(),
    onSuccess: () => {
      toast.success('Visita actualizada.')
      onDone()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo actualizar.'),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar datos de la visita</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="e-fecha">Fecha</Label>
          <Input id="e-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-ini">Hora inicio</Label>
          <Input id="e-ini" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-fin">Hora término</Label>
          <Input id="e-fin" type="time" value={termino} onChange={(e) => setTermino(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!fecha || guardar.isPending} onClick={() => guardar.mutate()}>
          {guardar.isPending ? <Loader2 className="animate-spin" /> : null}
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function EditarHallazgoDialog({
  visitaId,
  hallazgo,
  unidades,
  tipos,
  onDone,
  onCancel,
}: {
  visitaId: number
  hallazgo: Hallazgo
  unidades: Unidad[]
  tipos: TipoHallazgo[]
  onDone: () => void
  onCancel: () => void
}) {
  const [loteUnidadId, setLoteUnidadId] = useState(String(hallazgo.loteUnidad.id))
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(hallazgo.tipoRegistro)
  const [tipoId, setTipoId] = useState<string | undefined>(
    hallazgo.tipoHallazgo ? String(hallazgo.tipoHallazgo.id) : undefined
  )
  const [comentario, setComentario] = useState(hallazgo.comentario ?? '')

  const esHallazgo = tipoRegistro === 'HALLAZGO'
  const puedeGuardar = comentario.trim().length > 0 && (!esHallazgo || Boolean(tipoId))

  const guardar = useMutation({
    mutationFn: () =>
      api
        .patch(`tecnica/visitas/${visitaId}/hallazgos/${hallazgo.id}`, {
          json: {
            loteUnidadId: Number(loteUnidadId),
            tipoRegistro,
            tipoHallazgoId: esHallazgo ? Number(tipoId) : null,
            comentario: comentario.trim(),
          },
        })
        .json(),
    onSuccess: () => {
      toast.success('Registro actualizado.')
      onDone()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo actualizar.'),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar registro</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Unidad de lote</Label>
            <Select
              value={loteUnidadId}
              onValueChange={(v) => typeof v === 'string' && setLoteUnidadId(v)}
              items={Object.fromEntries(unidades.map((u) => [String(u.id), u.descripcion]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de registro</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['HALLAZGO', 'NOTA_TECNICA'] as const).map((tr) => (
                <Button
                  key={tr}
                  type="button"
                  variant={tipoRegistro === tr ? 'default' : 'outline'}
                  className="h-10"
                  onClick={() => setTipoRegistro(tr)}
                >
                  {tr === 'HALLAZGO' ? 'Hallazgo' : 'Nota técnica'}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {esHallazgo ? (
          <div className="space-y-1.5">
            <Label>Tipo de hallazgo</Label>
            <Select
              value={tipoId}
              onValueChange={(v) => typeof v === 'string' && setTipoId(v)}
              items={Object.fromEntries(tipos.map((t) => [String(t.id), t.nombre]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="eh-com">Comentario</Label>
          <textarea
            id="eh-com"
            rows={3}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario (obligatorio)"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!puedeGuardar || guardar.isPending} onClick={() => guardar.mutate()}>
          {guardar.isPending ? <Loader2 className="animate-spin" /> : null}
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
