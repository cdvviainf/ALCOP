'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Camera, FileText, Loader2, Lock, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PreguntaTexto } from '@/components/shared/pregunta-texto'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TipoRespuesta = 'CHECKBOX' | 'SELECCION_MULTIPLE' | 'NUMERO' | 'TEXTO' | 'TEXTO_LARGO' | 'LOTE_UNIDAD'
type EstadoRegistro = 'POR_APLICAR' | 'VIGENTE' | 'ATRASADO' | 'COMPLETADO'
interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface FotoResp {
  id: number
  mimetype: string
  orden: number
  url: string
}
interface RespuestaPregunta {
  preguntaId: number
  valorTexto: string | null
  valorNumero: number | null
  valorCheckbox: string | null
  valorSeleccionMultiple: string[]
  valorLoteUnidadId: number | null
  valorLoteUnidad: Unidad | null
  fotos: FotoResp[]
}
interface Unidad {
  id: number
  descripcion: string
}
interface Pregunta {
  id: number
  orden: number
  texto: string
  tipoRespuesta: TipoRespuesta
  obligatoria: boolean
  permiteFoto: boolean
  fotoObligatoria: boolean
  opciones: string[]
}
interface Registro {
  id: number
  fecha: string
  obra: { id: number; codigo: string; nombre: string }
  formulario: { id: number; codigo: string; nombre: string }
  estado: EstadoRegistro
  cerrado: boolean
  fechaRevision: string | null
  preguntas: Pregunta[]
  respuestas: RespuestaPregunta[]
  /** Unidades de lote de la obra del registro (opciones de las preguntas LOTE_UNIDAD). */
  unidades: Unidad[]
}

interface Valor {
  valorTexto: string
  valorNumero: string
  // CHECKBOX = Cumple / No cumple / N.A. (valor canónico); '' = sin responder.
  valorCheckbox: string
  valorSeleccionMultiple: string[]
  // LOTE_UNIDAD: id de la LoteUnidad como string; '' = sin responder.
  valorLoteUnidadId: string
}

const VACIO: Valor = { valorTexto: '', valorNumero: '', valorCheckbox: '', valorSeleccionMultiple: [], valorLoteUnidadId: '' }
const CHECK_OPCIONES = [
  { value: 'CUMPLE', label: 'Cumple' },
  { value: 'NO_CUMPLE', label: 'No cumple' },
  { value: 'N_A', label: 'N.A.' },
]

function hoyIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function seed(reg: Registro): Map<number, Valor> {
  const porId = new Map(reg.respuestas.map((r) => [r.preguntaId, r]))
  const m = new Map<number, Valor>()
  for (const p of reg.preguntas) {
    const r = porId.get(p.id)
    m.set(p.id, {
      valorTexto: r?.valorTexto ?? '',
      valorNumero: r?.valorNumero != null ? String(r.valorNumero) : '',
      valorCheckbox: r?.valorCheckbox ?? '',
      valorSeleccionMultiple: r?.valorSeleccionMultiple ?? [],
      valorLoteUnidadId: r?.valorLoteUnidadId != null ? String(r.valorLoteUnidadId) : '',
    })
  }
  return m
}

/** Qué cambia entre Registro Prevención y Registro Técnico; el llenado es el mismo. */
export interface RegistroConfig {
  /** Prefijo de la API, ej. `prevencion/registros`. */
  apiBase: string
  /** Ruta de la lista, ej. `/registro/prevencion`. */
  listHref: string
  /** Función de permiso que habilita la edición. */
  permiso: string
  /** Query key de la lista, para invalidarla al guardar. */
  listKey: string
  fechaLabel: string
  sinPreguntasAyuda: string
}

export function RegistroFormularioDetalle({ registroId, config }: { registroId: number; config: RegistroConfig }) {
  const fpId = registroId
  const { apiBase } = config
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const puedeEditarPerm = me?.esAdmin === true || me?.permisos?.[config.permiso] === 'TOTAL'

  const { data: reg, isLoading, isError, refetch } = useQuery({
    queryKey: ['registro', apiBase, fpId],
    queryFn: () => api.get(`${apiBase}/${fpId}`).json<Registro>(),
  })

  const [answers, setAnswers] = useState<Map<number, Valor>>(new Map())
  const [cerrarOpen, setCerrarOpen] = useState(false)
  const seededFor = useRef<number | null>(null)

  // Semilla una sola vez por registro (no pisa ediciones tras recargar fotos).
  useEffect(() => {
    if (reg && seededFor.current !== reg.id) {
      setAnswers(seed(reg))
      seededFor.current = reg.id
    }
  }, [reg])

  const editable = puedeEditarPerm && reg !== undefined && !reg.cerrado

  const setVal = (preguntaId: number, patch: Partial<Valor>) =>
    setAnswers((prev) => {
      const next = new Map(prev)
      const cur = next.get(preguntaId) ?? VACIO
      next.set(preguntaId, { ...cur, ...patch })
      return next
    })

  const guardar = useMutation({
    mutationFn: () => {
      const respuestas = (reg?.preguntas ?? []).map((p) => {
        const v = answers.get(p.id)
        return {
          preguntaId: p.id,
          valorTexto: v?.valorTexto?.trim() ? v.valorTexto.trim() : null,
          valorNumero: v?.valorNumero?.trim() ? Number(v.valorNumero) : null,
          valorCheckbox: v?.valorCheckbox ? v.valorCheckbox : null,
          valorSeleccionMultiple: v?.valorSeleccionMultiple ?? [],
          valorLoteUnidadId: v?.valorLoteUnidadId ? Number(v.valorLoteUnidadId) : null,
        }
      })
      return api.put(`${apiBase}/${fpId}/respuestas`, { json: { respuestas } }).json<Registro>()
    },
    onSuccess: () => {
      toast.success('Respuestas guardadas.')
      queryClient.invalidateQueries({ queryKey: [config.listKey] })
      void refetch()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudieron guardar.'),
  })

  if (isLoading) {
    return (
      <>
        <TopBar />
        <main className="flex-1 p-4 text-sm sm:p-8 text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </span>
        </main>
      </>
    )
  }
  if (isError || !reg) {
    return (
      <>
        <TopBar />
        <main className="flex-1 p-4 text-sm sm:p-8 text-destructive">No se pudo cargar el registro.</main>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push(config.listHref)}>
                <ArrowLeft className="size-4" /> Volver
              </Button>
              <h1 className="text-2xl font-bold text-foreground">{reg.formulario.nombre}</h1>
              <p className="text-sm text-muted-foreground">
                {reg.obra.nombre} · {reg.obra.codigo} · {config.fechaLabel} {reg.fecha}
                {reg.cerrado && reg.fechaRevision ? ` · Revisión ${reg.fechaRevision}` : ''}
              </p>
            </div>
            {reg.cerrado ? (
              <Button
                variant="outline"
                className="self-start sm:self-auto"
                onClick={() => window.open(`/api/${apiBase}/${fpId}/reporte.pdf`, '_blank')}
              >
                <FileText className="size-4" /> PDF
              </Button>
            ) : null}
          </div>

          {reg.cerrado ? (
            <div className="rounded-lg border border-ok-bg bg-ok-bg/40 px-4 py-2.5 text-sm text-ok-fg">
              Registro completado. Solo lectura.
            </div>
          ) : !puedeEditarPerm ? (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              Solo lectura: no tienes permiso para editar registros.
            </div>
          ) : null}

          {reg.preguntas.length === 0 ? (
            <div className="rounded-lg border border-warn-bg bg-warn-bg/40 px-4 py-3 text-sm text-warn-fg">
              Este formulario (<span className="font-medium">{reg.formulario.codigo}</span>) no tiene preguntas
              configuradas, así que no hay nada que llenar. {config.sinPreguntasAyuda}
            </div>
          ) : (
            <div className="space-y-4">
              {reg.preguntas.map((p, i) => {
                const r = reg.respuestas.find((x) => x.preguntaId === p.id)
                return (
                  <PreguntaCard
                    key={p.id}
                    index={i + 1}
                    pregunta={p}
                    valor={answers.get(p.id)}
                    fotos={r?.fotos ?? []}
                    unidades={unidadesDe(reg.unidades, r?.valorLoteUnidad ?? null)}
                    editable={editable}
                    apiBase={apiBase}
                    registroId={fpId}
                    onChange={(patch) => setVal(p.id, patch)}
                    onFotoChange={() => void refetch()}
                  />
                )
              })}
            </div>
          )}

          {editable && reg.preguntas.length > 0 ? (
            <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 backdrop-blur">
              <Button variant="outline" disabled={guardar.isPending} onClick={() => guardar.mutate()}>
                {guardar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar
              </Button>
              <Button
                disabled={guardar.isPending}
                onClick={() => {
                  // Guarda antes de abrir el cierre, para que valide lo que se ve en pantalla.
                  guardar.mutate(undefined, { onSuccess: () => setCerrarOpen(true) })
                }}
              >
                <Lock className="size-4" /> Cerrar registro
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <Dialog open={cerrarOpen} onOpenChange={setCerrarOpen}>
        {cerrarOpen ? (
          <CerrarDialog
            apiBase={apiBase}
            registroId={fpId}
            onDone={() => {
              setCerrarOpen(false)
              queryClient.invalidateQueries({ queryKey: [config.listKey] })
              void refetch()
            }}
            onCancel={() => setCerrarOpen(false)}
          />
        ) : null}
      </Dialog>
    </>
  )
}

/** Unidades de la obra + la ya elegida si dejó de estar vigente (para seguir mostrándola). */
function unidadesDe(unidades: Unidad[], elegida: Unidad | null): Unidad[] {
  if (!elegida || unidades.some((u) => u.id === elegida.id)) return unidades
  return [elegida, ...unidades]
}

function PreguntaCard({
  index,
  pregunta,
  valor,
  fotos,
  unidades,
  editable,
  apiBase,
  registroId,
  onChange,
  onFotoChange,
}: {
  index: number
  pregunta: Pregunta
  valor: Valor | undefined
  fotos: FotoResp[]
  unidades: Unidad[]
  editable: boolean
  apiBase: string
  registroId: number
  onChange: (patch: Partial<Valor>) => void
  onFotoChange: () => void
}) {
  const v = valor ?? VACIO
  const fileRef = useRef<HTMLInputElement>(null)

  const subirFoto = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('imagen', file)
      return api.post(`${apiBase}/${registroId}/preguntas/${pregunta.id}/fotos`, { body: fd }).json()
    },
    onSuccess: () => {
      toast.success('Foto subida.')
      onFotoChange()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo subir la foto.'),
  })
  const quitarFoto = useMutation({
    mutationFn: (fotoId: number) => api.delete(`${apiBase}/fotos/${fotoId}`),
    onSuccess: () => onFotoChange(),
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar la foto.'),
  })

  const toggleOpcion = (op: string) => {
    const set = new Set(v.valorSeleccionMultiple)
    if (set.has(op)) set.delete(op)
    else set.add(op)
    onChange({ valorSeleccionMultiple: [...set] })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-start gap-2">
        <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold text-muted-foreground">{index}.</span>
        <p className="flex-1 text-sm font-medium text-foreground">
          <PreguntaTexto texto={pregunta.texto} />
          {pregunta.obligatoria ? <span className="ml-1 text-destructive">*</span> : null}
        </p>
      </div>

      <div className="pl-5">
        {pregunta.tipoRespuesta === 'TEXTO' ? (
          <Input value={v.valorTexto} disabled={!editable} onChange={(e) => onChange({ valorTexto: e.target.value })} />
        ) : pregunta.tipoRespuesta === 'TEXTO_LARGO' ? (
          <textarea
            value={v.valorTexto}
            disabled={!editable}
            rows={3}
            onChange={(e) => onChange({ valorTexto: e.target.value })}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
          />
        ) : pregunta.tipoRespuesta === 'NUMERO' ? (
          <Input
            type="number"
            value={v.valorNumero}
            disabled={!editable}
            onChange={(e) => onChange({ valorNumero: e.target.value })}
            className="max-w-xs"
          />
        ) : pregunta.tipoRespuesta === 'LOTE_UNIDAD' ? (
          <div className="space-y-1.5">
            <Select
              value={v.valorLoteUnidadId || null}
              onValueChange={(val) => onChange({ valorLoteUnidadId: typeof val === 'string' ? val : '' })}
              items={Object.fromEntries(unidades.map((u) => [String(u.id), u.descripcion]))}
              disabled={!editable}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder={unidades.length ? 'Selecciona la unidad…' : 'La obra no tiene unidades'} />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Registros anteriores a la conversión de "Ubicación" a lista: texto original. */}
            {!v.valorLoteUnidadId && v.valorTexto ? (
              <p className="text-xs text-muted-foreground">Registrado como texto: «{v.valorTexto}»</p>
            ) : null}
          </div>
        ) : pregunta.tipoRespuesta === 'CHECKBOX' ? (
          <div className="flex flex-wrap gap-2">
            {CHECK_OPCIONES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!editable}
                onClick={() => onChange({ valorCheckbox: v.valorCheckbox === opt.value ? '' : opt.value })}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  v.valorCheckbox === opt.value
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border text-foreground hover:bg-accent/40',
                  // Solo lectura: la opción marcada queda nítida; las demás, atenuadas.
                  !editable && v.valorCheckbox !== opt.value && 'opacity-40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {pregunta.opciones.map((op) => (
              <label key={op} className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox
                  checked={v.valorSeleccionMultiple.includes(op)}
                  disabled={!editable}
                  onCheckedChange={() => toggleOpcion(op)}
                />
                <span>{op}</span>
              </label>
            ))}
          </div>
        )}

        {/* Fotos */}
        {pregunta.permiteFoto ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-label">
              FOTOS{pregunta.fotoObligatoria ? <span className="text-destructive">obligatoria</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {fotos.map((f) => (
                <div key={f.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="foto" className="size-20 rounded-md border border-border object-cover" />
                  {editable ? (
                    <button
                      type="button"
                      aria-label="Quitar foto"
                      onClick={() => quitarFoto.mutate(f.id)}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              ))}
              {editable ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) subirFoto.mutate(file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={subirFoto.isPending}
                    className={cn(
                      'flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary',
                      subirFoto.isPending && 'opacity-60'
                    )}
                  >
                    {subirFoto.isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    Subir
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CerrarDialog({
  apiBase,
  registroId,
  onDone,
  onCancel,
}: {
  apiBase: string
  registroId: number
  onDone: () => void
  onCancel: () => void
}) {
  const [fechaRevision, setFechaRevision] = useState(hoyIso())
  const cerrar = useMutation({
    mutationFn: () => api.post(`${apiBase}/${registroId}/cerrar`, { json: { fechaRevision } }).json(),
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
          Indica la fecha de revisión. El registro se cerrará solo si todas las respuestas obligatorias y sus fotos están
          completas.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="fecha-rev">Fecha de revisión</Label>
        <Input id="fecha-rev" type="date" max={hoyIso()} value={fechaRevision} onChange={(e) => setFechaRevision(e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!fechaRevision || cerrar.isPending} onClick={() => cerrar.mutate()}>
          {cerrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          Cerrar registro
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
