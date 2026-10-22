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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
type PlazoUnidad = 'DIAS' | 'HORAS'
interface Hallazgo {
  id: number
  categoria: { id: number; nombre: string }
  subcategoria: { id: number; nombre: string }
  nivelRiesgo: { id: number; nombre: string }
  plazoValor: number
  plazoUnidad: PlazoUnidad
  comentario: string
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
interface Opcion {
  id: number
  codigo?: string
  nombre: string
}
interface Area {
  id: number
  codigo: string
  nombre: string
}

const CALIDADES = ['ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA']
const MAX_FOTOS_ALTA = 10
const calidadLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase()
const plazoTexto = (v: number, u: PlazoUnidad) => `${v} ${u === 'HORAS' ? 'hora' : 'día'}${v === 1 ? '' : 's'}`

/** Agrupa hallazgos por categoría, preservando el orden de aparición. */
function agruparPorCategoria(hallazgos: Hallazgo[]): Array<{ cat: string; items: Hallazgo[] }> {
  const map = new Map<string, Hallazgo[]>()
  for (const h of hallazgos) {
    const k = h.categoria.nombre
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(h)
  }
  return [...map.entries()].map(([cat, items]) => ({ cat, items }))
}

export default function VisitaPrevencionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const visitaId = Number(id)
  const queryClient = useQueryClient()
  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['visita-prevencion', id] })

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const { data: visita, isLoading } = useQuery({
    queryKey: ['visita-prevencion', id],
    queryFn: () => api.get(`prevencion/visitas/${id}`).json<Visita>(),
    retry: false,
  })
  const puedeEditarGlobal = me?.esAdmin === true || me?.permisos?.['PREV_INSPECCION'] === 'TOTAL'
  const editable = Boolean(visita && visita.estado === 'EN_CURSO' && puedeEditarGlobal)

  // Área PREVENCION (para cargar categorías) + niveles de riesgo.
  const { data: areasResp } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('nucleo/areas').json<{ data: Area[] }>(),
  })
  const areaPrevencion = (areasResp?.data ?? []).find((a) => a.codigo === 'PREVENCION')

  const { data: nivelesResp } = useQuery({
    queryKey: ['niveles-riesgo', { all: true }],
    queryFn: () => api.get('prevencion/niveles-riesgo', { searchParams: { limit: '100' } }).json<{ data: Opcion[] }>(),
  })
  const niveles = nivelesResp?.data ?? []

  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [editandoHallazgo, setEditandoHallazgo] = useState<Hallazgo | null>(null)

  const quitarHallazgo = useMutation({
    mutationFn: (hid: number) => api.delete(`prevencion/visitas/${id}/hallazgos/${hid}`),
    onSuccess: () => {
      toast.success('Hallazgo quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  if (isLoading) {
    return (
      <>
        <BreadcrumbBar backHref="/registro/inspeccion-prevencion" trail="Visita Prevención" current="…" />
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
        <BreadcrumbBar backHref="/registro/inspeccion-prevencion" trail="Visita Prevención" current="Error" />
        <main className="flex-1 p-8">
          <p className="text-sm text-destructive">No se pudo cargar la visita.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <BreadcrumbBar backHref="/registro/inspeccion-prevencion" trail="Visita Prevención" current={visita.obra.nombre} />
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
                  href={`/api/prevencion/visitas/${visitaId}/reporte.pdf`}
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
        {editable && areaPrevencion ? (
          <AgregarHallazgo visitaId={visitaId} areaPrevencionId={areaPrevencion.id} niveles={niveles} onAdded={invalidar} />
        ) : null}

        {/* Hallazgos agrupados por categoría */}
        <div className="space-y-5">
          <h2 className="text-sm font-bold text-foreground">Hallazgos ({visita.hallazgos.length})</h2>
          {visita.hallazgos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay hallazgos.</p>
          ) : (
            agruparPorCategoria(visita.hallazgos).map((grupo) => (
              <div key={grupo.cat} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-label">
                  {grupo.cat} <span className="text-muted-foreground">({grupo.items.length})</span>
                </h3>
                {grupo.items.map((h) => (
                  <div key={h.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{h.subcategoria.nombre}</span>
                          <span className="inline-flex items-center rounded-full bg-warn-bg px-2 py-0.5 text-[10px] font-semibold text-warn-fg">
                            {h.nivelRiesgo.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground">Plazo: {plazoTexto(h.plazoValor, h.plazoUnidad)}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{h.comentario}</p>
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
        {editandoHallazgo && areaPrevencion ? (
          <EditarHallazgoDialog
            visitaId={visitaId}
            hallazgo={editandoHallazgo}
            areaPrevencionId={areaPrevencion.id}
            niveles={niveles}
            onDone={() => { setEditandoHallazgo(null); invalidar() }}
            onCancel={() => setEditandoHallazgo(null)}
          />
        ) : null}
      </Dialog>
    </>
  )
}

/** Carga las subcategorías de una categoría (picker). Hook reusado en alta y edición. */
function useSubcategorias(categoriaId: string | undefined) {
  return useQuery({
    queryKey: ['subcategorias-opciones', categoriaId],
    queryFn: () =>
      api
        .get('nucleo/subcategorias-formulario/opciones', { searchParams: { categoriaId: String(categoriaId) } })
        .json<{ data: Opcion[] }>(),
    enabled: !!categoriaId,
  })
}

function AgregarHallazgo({
  visitaId,
  areaPrevencionId,
  niveles,
  onAdded,
}: {
  visitaId: number
  areaPrevencionId: number
  niveles: Opcion[]
  onAdded: () => void
}) {
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined)
  const [subcategoriaId, setSubcategoriaId] = useState<string | undefined>(undefined)
  const [nivelId, setNivelId] = useState<string | undefined>(undefined)
  const [plazoValor, setPlazoValor] = useState('')
  const [plazoUnidad, setPlazoUnidad] = useState<PlazoUnidad>('DIAS')
  const [comentario, setComentario] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])

  const { data: config } = useQuery({
    queryKey: ['config-calidad-imagen'],
    queryFn: () => api.get('nucleo/configuracion/calidad-imagen').json<{ calidadImagenDefault: string }>(),
    staleTime: 60_000,
  })
  const [calidadSel, setCalidadSel] = useState<string | null>(null)
  const calidadMostrada = calidadSel ?? config?.calidadImagenDefault

  const { data: catResp } = useQuery({
    queryKey: ['categorias-opciones', areaPrevencionId],
    queryFn: () =>
      api
        .get('nucleo/categorias-formulario/opciones', { searchParams: { areaId: String(areaPrevencionId) } })
        .json<{ data: Opcion[] }>(),
  })
  const categorias = catResp?.data ?? []
  const { data: subResp } = useSubcategorias(categoriaId)
  const subcategorias = subResp?.data ?? []

  const plazoNum = Number(plazoValor)
  const puedeAgregar =
    Boolean(categoriaId) &&
    Boolean(subcategoriaId) &&
    Boolean(nivelId) &&
    Number.isInteger(plazoNum) &&
    plazoNum > 0 &&
    comentario.trim().length > 0 &&
    archivos.length > 0

  const resetear = () => {
    setCategoriaId(undefined)
    setSubcategoriaId(undefined)
    setNivelId(undefined)
    setPlazoValor('')
    setPlazoUnidad('DIAS')
    setComentario('')
    setArchivos([])
    setCalidadSel(null)
  }

  const crear = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('categoriaId', String(Number(categoriaId)))
      fd.append('subcategoriaId', String(Number(subcategoriaId)))
      fd.append('nivelRiesgoId', String(Number(nivelId)))
      fd.append('plazoValor', String(plazoNum))
      fd.append('plazoUnidad', plazoUnidad)
      fd.append('comentario', comentario.trim())
      if (calidadSel) fd.append('calidad', calidadSel)
      archivos.forEach((f) => fd.append('imagen', f))
      return api.post(`prevencion/visitas/${visitaId}/hallazgos`, { body: fd }).json()
    },
    onSuccess: () => {
      toast.success('Hallazgo agregado.')
      resetear()
      onAdded()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  const agregarArchivos = (files: FileList | null) => {
    if (!files) return
    setArchivos((prev) => {
      const combinados = [...prev, ...Array.from(files)]
      if (combinados.length > MAX_FOTOS_ALTA) {
        toast.error(`Máximo ${MAX_FOTOS_ALTA} fotos por registro.`)
        return combinados.slice(0, MAX_FOTOS_ALTA)
      }
      return combinados
    })
  }
  const quitarArchivo = (i: number) => setArchivos((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-5">
      <h2 className="text-sm font-bold text-foreground">Agregar hallazgo</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select
            value={categoriaId}
            onValueChange={(v) => {
              if (typeof v === 'string') {
                setCategoriaId(v)
                setSubcategoriaId(undefined) // al cambiar categoría, limpia la subcategoría
              }
            }}
            items={Object.fromEntries(categorias.map((c) => [String(c.id), c.nombre]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={categorias.length ? 'Selecciona…' : 'No hay categorías de Prevención'} />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Subcategoría</Label>
          <Select
            value={subcategoriaId}
            onValueChange={(v) => typeof v === 'string' && setSubcategoriaId(v)}
            items={Object.fromEntries(subcategorias.map((s) => [String(s.id), s.nombre]))}
          >
            <SelectTrigger className="w-full" disabled={!categoriaId}>
              <SelectValue placeholder={!categoriaId ? 'Elige una categoría primero' : subcategorias.length ? 'Selecciona…' : 'Sin subcategorías'} />
            </SelectTrigger>
            <SelectContent>
              {subcategorias.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nivel de riesgo</Label>
          <Select
            value={nivelId}
            onValueChange={(v) => typeof v === 'string' && setNivelId(v)}
            items={Object.fromEntries(niveles.map((n) => [String(n.id), n.nombre]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {niveles.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tiempo para solucionar</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={plazoValor}
              onChange={(e) => setPlazoValor(e.target.value)}
              placeholder="Ej. 3"
              className="w-24"
            />
            <Select
              value={plazoUnidad}
              onValueChange={(v) => (v === 'DIAS' || v === 'HORAS') && setPlazoUnidad(v)}
              items={{ DIAS: 'Días', HORAS: 'Horas' }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIAS">Días</SelectItem>
                <SelectItem value="HORAS">Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="hp-com">Comentario</Label>
        <textarea
          id="hp-com"
          rows={2}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario (obligatorio)"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Fotos (al menos una) */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Fotos (al menos una)</Label>
          <Select
            value={calidadMostrada}
            onValueChange={(v) => typeof v === 'string' && setCalidadSel(v)}
            items={Object.fromEntries(CALIDADES.map((c) => [c, calidadLabel(c)]))}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Calidad…" />
            </SelectTrigger>
            <SelectContent>
              {CALIDADES.map((c) => (
                <SelectItem key={c} value={c}>
                  {calidadLabel(c)}
                  {c === config?.calidadImagenDefault ? ' · sugerida' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {archivos.length ? (
          <div className="flex flex-wrap gap-2">
            {archivos.map((f, i) => (
              <div key={`${f.name}-${i}`} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt={f.name} className="size-20 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => quitarArchivo(i)}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary">
          <Plus className="size-4" />
          Agregar foto
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              agregarArchivos(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <Button disabled={!puedeAgregar || crear.isPending} onClick={() => crear.mutate()}>
          {crear.isPending ? <Loader2 className="animate-spin" /> : <Plus strokeWidth={2.5} />}
          Agregar
        </Button>
      </div>
    </div>
  )
}

function SubirFoto({ hallazgoId, onUploaded }: { hallazgoId: number; onUploaded: () => void }) {
  const { data: config } = useQuery({
    queryKey: ['config-calidad-imagen'],
    queryFn: () => api.get('nucleo/configuracion/calidad-imagen').json<{ calidadImagenDefault: string }>(),
    staleTime: 60_000,
  })
  const [calidadSel, setCalidadSel] = useState<string | null>(null)
  // Solo se muestra el sugerido; no se envía salvo elección explícita (QA-OKA-010).
  const calidadMostrada = calidadSel ?? config?.calidadImagenDefault
  const [subiendo, setSubiendo] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      if (calidadSel) fd.append('calidad', calidadSel)
      fd.append('imagen', file)
      await api.post(`prevencion/hallazgos/${hallazgoId}/fotos`, { body: fd })
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
        value={calidadMostrada}
        onValueChange={(v) => typeof v === 'string' && setCalidadSel(v)}
        items={Object.fromEntries(CALIDADES.map((c) => [c, calidadLabel(c)]))}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Calidad…" />
        </SelectTrigger>
        <SelectContent>
          {CALIDADES.map((c) => (
            <SelectItem key={c} value={c}>
              {calidadLabel(c)}
              {c === config?.calidadImagenDefault ? ' · sugerida' : ''}
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
    mutationFn: () => api.delete(`prevencion/fotos/${foto.id}`),
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
    mutationFn: () => api.post(`prevencion/visitas/${visitaId}/finalizar`, { json: { resumenFinal: resumen.trim() || null } }).json(),
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
        .patch(`prevencion/visitas/${visitaId}`, { json: { fecha, horaInicio: inicio || null, horaTermino: termino || null } })
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
  areaPrevencionId,
  niveles,
  onDone,
  onCancel,
}: {
  visitaId: number
  hallazgo: Hallazgo
  areaPrevencionId: number
  niveles: Opcion[]
  onDone: () => void
  onCancel: () => void
}) {
  const [categoriaId, setCategoriaId] = useState(String(hallazgo.categoria.id))
  const [subcategoriaId, setSubcategoriaId] = useState<string | undefined>(String(hallazgo.subcategoria.id))
  const [nivelId, setNivelId] = useState(String(hallazgo.nivelRiesgo.id))
  const [plazoValor, setPlazoValor] = useState(String(hallazgo.plazoValor))
  const [plazoUnidad, setPlazoUnidad] = useState<PlazoUnidad>(hallazgo.plazoUnidad)
  const [comentario, setComentario] = useState(hallazgo.comentario)

  const { data: catResp } = useQuery({
    queryKey: ['categorias-opciones', areaPrevencionId],
    queryFn: () =>
      api
        .get('nucleo/categorias-formulario/opciones', { searchParams: { areaId: String(areaPrevencionId) } })
        .json<{ data: Opcion[] }>(),
  })
  const categorias = catResp?.data ?? []
  const { data: subResp } = useSubcategorias(categoriaId)
  const subcategorias = subResp?.data ?? []

  const plazoNum = Number(plazoValor)
  const puedeGuardar =
    Boolean(subcategoriaId) && Number.isInteger(plazoNum) && plazoNum > 0 && comentario.trim().length > 0

  const guardar = useMutation({
    mutationFn: () =>
      api
        .patch(`prevencion/visitas/${visitaId}/hallazgos/${hallazgo.id}`, {
          json: {
            categoriaId: Number(categoriaId),
            subcategoriaId: Number(subcategoriaId),
            nivelRiesgoId: Number(nivelId),
            plazoValor: plazoNum,
            plazoUnidad,
            comentario: comentario.trim(),
          },
        })
        .json(),
    onSuccess: () => {
      toast.success('Hallazgo actualizado.')
      onDone()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo actualizar.'),
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar hallazgo</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => {
                if (typeof v === 'string') {
                  setCategoriaId(v)
                  setSubcategoriaId(undefined)
                }
              }}
              items={Object.fromEntries(categorias.map((c) => [String(c.id), c.nombre]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Subcategoría</Label>
            <Select
              value={subcategoriaId}
              onValueChange={(v) => typeof v === 'string' && setSubcategoriaId(v)}
              items={Object.fromEntries(subcategorias.map((s) => [String(s.id), s.nombre]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {subcategorias.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nivel de riesgo</Label>
            <Select
              value={nivelId}
              onValueChange={(v) => typeof v === 'string' && setNivelId(v)}
              items={Object.fromEntries(niveles.map((n) => [String(n.id), n.nombre]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>
                    {n.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tiempo para solucionar</Label>
            <div className="flex gap-2">
              <Input type="number" min={1} value={plazoValor} onChange={(e) => setPlazoValor(e.target.value)} className="w-24" />
              <Select
                value={plazoUnidad}
                onValueChange={(v) => (v === 'DIAS' || v === 'HORAS') && setPlazoUnidad(v)}
                items={{ DIAS: 'Días', HORAS: 'Horas' }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIAS">Días</SelectItem>
                  <SelectItem value="HORAS">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ehp-com">Comentario</Label>
          <textarea
            id="ehp-com"
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
