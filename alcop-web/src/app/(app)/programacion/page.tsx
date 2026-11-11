'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Calendario de programación (Docs/programacion-prevencion.md v0.2): agenda
// formularios de Prevención o de Técnica por obra. En Técnica cada formulario
// tiene ventana inicio/término; ambas fechas se marcan en el calendario.

type Area = 'PREVENCION' | 'TECNICA'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Obra {
  id: number
  codigo: string
  nombre: string
}
interface FormularioOpcion {
  id: number
  codigo: string
  nombre: string
}
interface FormularioProgramado {
  id: number
  orden: number
  formulario: { id: number; codigo: string; nombre: string }
  fechaInicio: string | null
  fechaTermino: string | null
}
interface Dia {
  id: number
  obraId: number
  area: Area
  fecha: string
  comentario: string | null
  usuario: { id: string; nombre: string } | null
  vencido: boolean
  formularios: FormularioProgramado[]
}

const AREAS: Area[] = ['PREVENCION', 'TECNICA']
const FUNCION: Record<Area, string> = { PREVENCION: 'PREV_PROGRAMACION', TECNICA: 'TEC_PROGRAMACION' }
const RUTA: Record<Area, string> = { PREVENCION: 'prevencion/programacion', TECNICA: 'tecnica/programacion' }
const NOMBRE_AREA: Record<Area, string> = { PREVENCION: 'Prevención', TECNICA: 'Técnica' }
const RESPONSABLE: Record<Area, string> = { PREVENCION: 'Prevencionista', TECNICA: 'Jefe de terreno' }

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** YYYY-MM-DD a partir de año, mes (0-11) y día. */
function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
// "Hoy" en la zona de la obra (America/Santiago), consistente con el backend
// (QA-PP-004). Evita que la zona del navegador desalinee qué día es editable.
const TZ_OBRA = 'America/Santiago'
function partesHoy(): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_OBRA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const val = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: val('year'), m: val('month') - 1, d: val('day') }
}

/** Celdas del mes (Lun→Dom), con huecos iniciales para alinear el primer día. */
function celdasDelMes(anio: number, mes: number): Array<{ dia: number; fecha: string } | null> {
  const primero = new Date(anio, mes, 1)
  const offset = (primero.getDay() + 6) % 7 // getDay(): 0=Dom → Lun-first
  const total = new Date(anio, mes + 1, 0).getDate()
  const celdas: Array<{ dia: number; fecha: string } | null> = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= total; d++) celdas.push({ dia: d, fecha: iso(anio, mes, d) })
  return celdas
}

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}
/** dd-mm-aaaa (formato de fechas de la app). */
function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

/** Marca de un formulario técnico en una fecha del calendario. */
interface MarcaTecnica {
  dia: Dia
  linea: FormularioProgramado
  tipo: 'INICIO' | 'TERMINO' | 'AMBOS'
}
const ETIQUETA_MARCA: Record<MarcaTecnica['tipo'], string> = {
  INICIO: 'Inicio',
  TERMINO: 'Término',
  AMBOS: 'Inicio y término',
}

export default function ProgramacionPage() {
  const queryClient = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const nivel = (a: Area) => (me?.esAdmin ? 'TOTAL' : (me?.permisos?.[FUNCION[a]] ?? 'SIN_ACCESO'))
  const puedeVer = (a: Area) => me !== undefined && nivel(a) !== 'SIN_ACCESO'
  const puedeEditar = (a: Area) => me !== undefined && nivel(a) === 'TOTAL'
  const areasVisibles = AREAS.filter(puedeVer)

  const [hoyPartes, setHoyPartes] = useState(partesHoy)
  // Recalcula "hoy" al volver el foco/visibilidad y cada minuto, por si la sesión
  // cruza la medianoche de Santiago (QA-PP-006). Solo re-renderiza si cambió.
  useEffect(() => {
    const refrescar = () =>
      setHoyPartes((prev) => {
        const n = partesHoy()
        return prev.y === n.y && prev.m === n.m && prev.d === n.d ? prev : n
      })
    const timer = window.setInterval(refrescar, 60_000)
    window.addEventListener('focus', refrescar)
    document.addEventListener('visibilitychange', refrescar)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refrescar)
      document.removeEventListener('visibilitychange', refrescar)
    }
  }, [])
  const hoy = iso(hoyPartes.y, hoyPartes.m, hoyPartes.d)
  const [anio, setAnio] = useState(hoyPartes.y)
  const [mes, setMes] = useState(hoyPartes.m) // 0-11
  const [obraId, setObraId] = useState<number | null>(null)
  const [diaSel, setDiaSel] = useState<string | null>(null)

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []
  // La obra debe elegirse explícitamente: sin selección no hay calendario ni se
  // puede agendar (no se auto-selecciona la primera obra).
  const obraActiva = obraId

  const mesQuery = (area: Area) => ({
    queryKey: ['programacion', area, obraActiva, anio, mes],
    queryFn: () =>
      api
        .get(RUTA[area], { searchParams: { obraId: String(obraActiva), anio: String(anio), mes: String(mes + 1) } })
        .json<{ data: Dia[] }>(),
    enabled: obraActiva !== null && puedeVer(area),
  })
  const prevQ = useQuery(mesQuery('PREVENCION'))
  const tecQ = useQuery(mesQuery('TECNICA'))
  const isLoading = prevQ.isLoading || tecQ.isLoading

  // Día agendado por (área, fecha) — la cabecera que se edita en el diálogo.
  const diasPorArea = useMemo(() => {
    const m: Record<Area, Map<string, Dia>> = { PREVENCION: new Map(), TECNICA: new Map() }
    for (const d of prevQ.data?.data ?? []) m.PREVENCION.set(d.fecha, d)
    for (const d of tecQ.data?.data ?? []) m.TECNICA.set(d.fecha, d)
    return m
  }, [prevQ.data, tecQ.data])

  // Marcas técnicas por fecha: cada formulario marca su inicio y su término.
  const marcasTecnicas = useMemo(() => {
    const m = new Map<string, MarcaTecnica[]>()
    const push = (fecha: string, marca: MarcaTecnica) => m.set(fecha, [...(m.get(fecha) ?? []), marca])
    for (const dia of tecQ.data?.data ?? []) {
      for (const linea of dia.formularios) {
        const ini = linea.fechaInicio ?? dia.fecha
        const fin = linea.fechaTermino ?? ini
        if (ini === fin) push(ini, { dia, linea, tipo: 'AMBOS' })
        else {
          push(ini, { dia, linea, tipo: 'INICIO' })
          push(fin, { dia, linea, tipo: 'TERMINO' })
        }
      }
    }
    return m
  }, [tecQ.data])

  const celdas = useMemo(() => celdasDelMes(anio, mes), [anio, mes])

  const mover = (delta: number) => {
    const base = new Date(anio, mes + delta, 1)
    setAnio(base.getFullYear())
    setMes(base.getMonth())
  }

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Programación</h1>
              <p className="text-sm text-muted-foreground">
                Calendario de aplicación de formularios por obra. Agenda formularios de Prevención o de Técnica en una
                fecha; en Técnica cada formulario tiene fecha de inicio y de término.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <label className="mb-1 block text-[11px] font-semibold tracking-wide text-label">OBRA</label>
              <Select
                value={obraActiva !== null ? String(obraActiva) : null}
                onValueChange={(v) => typeof v === 'string' && setObraId(Number(v))}
                items={Object.fromEntries(obras.map((o) => [String(o.id), `${o.nombre} · ${o.codigo}`]))}
              >
                <SelectTrigger className="h-10 w-full">
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
          </div>

          {/* Navegación de mes */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => mover(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarDays className="size-5 text-primary" />
              {MESES[mes]} {anio}
            </div>
            <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => mover(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Leyenda */}
          {areasVisibles.length ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {puedeVer('PREVENCION') ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-primary" /> Prevención
                </span>
              ) : null}
              {puedeVer('TECNICA') ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-sky-600" /> Técnica (▶ inicio · ■ término)
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Calendario */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 grid grid-cols-7 gap-2">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="px-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {obraActiva === null ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Selecciona una obra para ver su calendario.</div>
            ) : isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Cargando…
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {celdas.map((c, i) => {
                  if (!c) return <div key={`b${i}`} />
                  const esPasado = c.fecha < hoy
                  const esHoy = c.fecha === hoy
                  const prev = diasPorArea.PREVENCION.get(c.fecha)?.formularios ?? []
                  const marcas = marcasTecnicas.get(c.fecha) ?? []
                  const chips = [
                    ...prev.map((f) => ({
                      key: `p${f.id}`,
                      texto: f.formulario.codigo,
                      title: `Prevención · ${f.formulario.nombre}`,
                      area: 'PREVENCION' as Area,
                    })),
                    ...marcas.map((mk) => ({
                      key: `t${mk.linea.id}`,
                      texto: `${mk.tipo === 'INICIO' ? '▶ ' : mk.tipo === 'TERMINO' ? '■ ' : ''}${mk.linea.formulario.codigo}`,
                      title: `Técnica · ${ETIQUETA_MARCA[mk.tipo]} · ${mk.linea.formulario.nombre} (${fechaCorta(
                        mk.linea.fechaInicio ?? mk.dia.fecha
                      )} → ${fechaCorta(mk.linea.fechaTermino ?? mk.dia.fecha)})`,
                      area: 'TECNICA' as Area,
                    })),
                  ]
                  return (
                    <button
                      type="button"
                      key={c.fecha}
                      onClick={() => setDiaSel(c.fecha)}
                      className={cn(
                        'flex min-h-[84px] flex-col rounded-lg border p-2 text-left transition-colors',
                        esPasado ? 'border-border/60 bg-muted/30' : 'border-border bg-background hover:border-primary/50 hover:bg-accent/40',
                        esHoy && 'ring-2 ring-primary/50'
                      )}
                    >
                      <span className={cn('text-sm font-semibold', esPasado ? 'text-muted-foreground' : 'text-foreground')}>
                        {c.dia}
                      </span>
                      {chips.length > 0 ? (
                        <span className="mt-auto flex flex-col items-start gap-0.5">
                          {chips.slice(0, 3).map((ch) => (
                            <span
                              key={ch.key}
                              title={ch.title}
                              className={cn(
                                'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                esPasado
                                  ? 'bg-muted text-muted-foreground'
                                  : ch.area === 'PREVENCION'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-sky-600/10 text-sky-700'
                              )}
                            >
                              {ch.texto}
                            </span>
                          ))}
                          {chips.length > 3 ? (
                            <span className="px-1 text-[10px] font-medium text-muted-foreground">+{chips.length - 3} más</span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={diaSel !== null} onOpenChange={(o) => (!o ? setDiaSel(null) : undefined)}>
        {diaSel && obraActiva !== null && areasVisibles.length ? (
          <DiaDialog
            obraId={obraActiva}
            fecha={diaSel}
            hoy={hoy}
            areas={areasVisibles}
            // Abre en el área que ya tiene algo ese día (Prevención primero).
            areaInicial={
              diasPorArea.PREVENCION.has(diaSel) && puedeVer('PREVENCION')
                ? 'PREVENCION'
                : (marcasTecnicas.has(diaSel) || diasPorArea.TECNICA.has(diaSel)) && puedeVer('TECNICA')
                  ? 'TECNICA'
                  : areasVisibles[0]
            }
            diasPorArea={diasPorArea}
            marcasTecnicas={marcasTecnicas.get(diaSel) ?? []}
            puedeEditar={puedeEditar}
            onClose={() => setDiaSel(null)}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['programacion'] })}
          />
        ) : null}
      </Dialog>
    </>
  )
}

function DiaDialog({
  obraId,
  fecha,
  hoy,
  areas,
  areaInicial,
  diasPorArea,
  marcasTecnicas,
  puedeEditar,
  onClose,
  onChanged,
}: {
  obraId: number
  fecha: string
  hoy: string
  areas: Area[]
  areaInicial: Area
  diasPorArea: Record<Area, Map<string, Dia>>
  marcasTecnicas: MarcaTecnica[]
  puedeEditar: (a: Area) => boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [area, setArea] = useState<Area>(areaInicial)
  const esPasado = fecha < hoy
  const dia = diasPorArea[area].get(fecha) ?? null
  // Formularios técnicos agendados en OTRO día cuyo inicio/término cae en esta fecha.
  const otrasMarcas = area === 'TECNICA' ? marcasTecnicas.filter((m) => m.dia.fecha !== fecha) : []

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{fechaLegible(fecha)}</DialogTitle>
        <DialogDescription>
          {esPasado ? 'Fecha pasada: solo lectura.' : 'Elige el tipo de programación y los formularios a agendar.'}
          {dia?.usuario ? ` · ${RESPONSABLE[area]}: ${dia.usuario.nombre}` : dia ? ` · Sin ${RESPONSABLE[area].toLowerCase()} asignado` : ''}
        </DialogDescription>
      </DialogHeader>

      {areas.length > 1 ? (
        <div className="space-y-1.5">
          <Label>Tipo de programación</Label>
          <div className="grid grid-cols-2 gap-2">
            {areas.map((a) => (
              <Button
                key={a}
                type="button"
                variant={area === a ? 'default' : 'outline'}
                className="h-10"
                onClick={() => setArea(a)}
              >
                {NOMBRE_AREA[a]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {otrasMarcas.length ? (
        <div className="space-y-1.5 rounded-lg border border-sky-600/30 bg-sky-600/5 p-3">
          <p className="text-xs font-semibold text-sky-800">También en esta fecha (agendados otro día)</p>
          <ul className="space-y-1 text-sm">
            {otrasMarcas.map((m) => (
              <li key={m.linea.id}>
                <span className="font-medium text-foreground">{ETIQUETA_MARCA[m.tipo]}:</span> {m.linea.formulario.nombre}{' '}
                <span className="text-xs text-muted-foreground">
                  · {fechaCorta(m.linea.fechaInicio ?? m.dia.fecha)} → {fechaCorta(m.linea.fechaTermino ?? m.dia.fecha)} ·
                  agendado el {fechaCorta(m.dia.fecha)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* key por área: al cambiar de tipo se reinicia el formulario del diálogo. */}
      <DiaAreaForm
        key={`${area}-${dia?.id ?? 'nuevo'}`}
        area={area}
        obraId={obraId}
        fecha={fecha}
        hoy={hoy}
        dia={dia}
        editable={puedeEditar(area) && !esPasado}
        onClose={onClose}
        onChanged={onChanged}
      />
    </DialogContent>
  )
}

/** Selección de un formulario a agendar; en Técnica con su ventana. */
interface Seleccion {
  fechaInicio: string
  fechaTermino: string
}

function DiaAreaForm({
  area,
  obraId,
  fecha,
  hoy,
  dia,
  editable,
  onClose,
  onChanged,
}: {
  area: Area
  obraId: number
  fecha: string
  hoy: string
  dia: Dia | null
  editable: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const esTecnica = area === 'TECNICA'
  const ruta = RUTA[area]
  const [comentario, setComentario] = useState(dia?.comentario ?? '')
  // formularioId → ventana (en Prevención se ignora la ventana).
  const [seleccion, setSeleccion] = useState<Map<number, Seleccion>>(new Map())

  const { data: opcResp } = useQuery({
    queryKey: ['programacion-formularios-opciones', area],
    queryFn: () => api.get(`${ruta}/formularios-opciones`).json<{ data: FormularioOpcion[] }>(),
    enabled: editable,
  })
  const yaAgendados = new Set((dia?.formularios ?? []).map((f) => f.formulario.id))
  const opciones = (opcResp?.data ?? []).filter((o) => !yaAgendados.has(o.id))

  const toggle = (id: number) =>
    setSeleccion((prev) => {
      const next = new Map(prev)
      // Por defecto, inicio y término = la fecha elegida en el calendario.
      if (next.has(id)) next.delete(id)
      else next.set(id, { fechaInicio: fecha, fechaTermino: fecha })
      return next
    })
  const setVentana = (id: number, campo: keyof Seleccion, valor: string) =>
    setSeleccion((prev) => {
      const next = new Map(prev)
      const actual = next.get(id)
      if (!actual) return prev
      const v = { ...actual, [campo]: valor }
      // Mantiene el término ≥ inicio al mover el inicio hacia adelante.
      if (campo === 'fechaInicio' && v.fechaTermino < valor) v.fechaTermino = valor
      next.set(id, v)
      return next
    })

  const ventanasValidas = Array.from(seleccion.values()).every(
    (s) => s.fechaInicio >= hoy && s.fechaTermino >= s.fechaInicio
  )
  const payloadFormularios = () =>
    esTecnica
      ? { formularios: Array.from(seleccion, ([formularioId, s]) => ({ formularioId, ...s })) }
      : { formularioIds: Array.from(seleccion.keys()) }

  const crear = useMutation({
    mutationFn: () =>
      api
        .post(ruta, { json: { obraId, fecha, comentario: comentario.trim() || null, ...payloadFormularios() } })
        .json<Dia>(),
    onSuccess: () => {
      toast.success('Programación creada.')
      onChanged()
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo crear.'),
  })

  const agregar = useMutation({
    mutationFn: () => api.post(`${ruta}/${dia!.id}/formularios`, { json: payloadFormularios() }).json<Dia>(),
    onSuccess: () => {
      toast.success('Formularios agregados.')
      setSeleccion(new Map())
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  const guardarComentario = useMutation({
    mutationFn: () => api.patch(`${ruta}/${dia!.id}`, { json: { comentario: comentario.trim() || null } }).json<Dia>(),
    onSuccess: () => {
      toast.success('Comentario guardado.')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo guardar.'),
  })

  const quitar = useMutation({
    mutationFn: (fpId: number) => api.delete(`${ruta}/${dia!.id}/formularios/${fpId}`).json<Dia>(),
    onSuccess: () => {
      toast.success('Formulario quitado.')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const eliminarDia = useMutation({
    mutationFn: () => api.delete(`${ruta}/${dia!.id}`),
    onSuccess: () => {
      toast.success('Día eliminado.')
      onChanged()
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  const listaFormularios = dia?.formularios ?? []

  return (
    <>
      {/* Formularios ya agendados */}
      {dia ? (
        <div className="space-y-2">
          <Label>Formularios agendados</Label>
          {listaFormularios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay formularios en este día.</p>
          ) : (
            <ul className="space-y-1.5">
              {listaFormularios.map((f) => (
                <li key={f.id} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      <span className="font-medium text-foreground">{f.formulario.nombre}</span>{' '}
                      <span className="text-xs text-muted-foreground">· {f.formulario.codigo}</span>
                    </span>
                    {editable ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar"
                        title={listaFormularios.length <= 1 ? 'Para quitar el último, elimina el día' : 'Quitar'}
                        disabled={quitar.isPending || listaFormularios.length <= 1}
                        onClick={() => quitar.mutate(f.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  {esTecnica ? (
                    <VentanaAgendada ruta={ruta} diaId={dia.id} linea={f} hoy={hoy} editable={editable} onChanged={onChanged} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Comentario */}
      <div className="space-y-1.5">
        <Label htmlFor="prog-comentario">Comentario</Label>
        <textarea
          id="prog-comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={!editable}
          rows={3}
          placeholder="Comentario para el día (opcional)…"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
        />
        {editable && dia ? (
          <Button
            variant="outline"
            size="sm"
            disabled={guardarComentario.isPending || (comentario.trim() || null) === (dia.comentario ?? null)}
            onClick={() => guardarComentario.mutate()}
          >
            {guardarComentario.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar comentario
          </Button>
        ) : null}
      </div>

      {/* Selector de formularios (agregar) */}
      {editable ? (
        <div className="space-y-2">
          <Label>{dia ? 'Agregar formularios' : 'Formularios a agendar'}</Label>
          {opciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay formularios de {NOMBRE_AREA[area].toLowerCase()} disponibles.
            </p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {opciones.map((o) => {
                const sel = seleccion.get(o.id)
                return (
                  <div key={o.id} className="rounded-md px-2 py-1.5 hover:bg-accent/40">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <Checkbox checked={sel !== undefined} onCheckedChange={() => toggle(o.id)} />
                      <span>
                        <span className="font-medium text-foreground">{o.nombre}</span>{' '}
                        <span className="text-xs text-muted-foreground">· {o.codigo}</span>
                      </span>
                    </label>
                    {esTecnica && sel ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 pl-7">
                        <div className="space-y-1">
                          <Label className="text-xs" htmlFor={`ini-${o.id}`}>
                            Fecha de inicio
                          </Label>
                          <Input
                            id={`ini-${o.id}`}
                            type="date"
                            min={hoy}
                            value={sel.fechaInicio}
                            onChange={(e) => setVentana(o.id, 'fechaInicio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs" htmlFor={`fin-${o.id}`}>
                            Fecha de término
                          </Label>
                          <Input
                            id={`fin-${o.id}`}
                            type="date"
                            min={sel.fechaInicio || hoy}
                            value={sel.fechaTermino}
                            onChange={(e) => setVentana(o.id, 'fechaTermino', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
          {esTecnica && seleccion.size > 0 && !ventanasValidas ? (
            <p className="text-xs text-destructive">
              Revisa las fechas: el inicio no puede ser anterior a hoy y el término no puede ser anterior al inicio.
            </p>
          ) : null}
        </div>
      ) : null}

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {editable && dia ? (
          <Button variant="destructive" disabled={eliminarDia.isPending} onClick={() => eliminarDia.mutate()}>
            <Trash2 className="size-4" />
            Eliminar día
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {editable && !dia ? (
            <Button disabled={seleccion.size === 0 || !ventanasValidas || crear.isPending} onClick={() => crear.mutate()}>
              {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Guardar
            </Button>
          ) : null}
          {editable && dia ? (
            <Button disabled={seleccion.size === 0 || !ventanasValidas || agregar.isPending} onClick={() => agregar.mutate()}>
              {agregar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </>
  )
}

/** Inicio/término de un formulario técnico ya agendado (editable si el día lo es). */
function VentanaAgendada({
  ruta,
  diaId,
  linea,
  hoy,
  editable,
  onChanged,
}: {
  ruta: string
  diaId: number
  linea: FormularioProgramado
  hoy: string
  editable: boolean
  onChanged: () => void
}) {
  const inicioActual = linea.fechaInicio ?? ''
  const terminoActual = linea.fechaTermino ?? ''
  const [inicio, setInicio] = useState(inicioActual)
  const [termino, setTermino] = useState(terminoActual)

  const guardar = useMutation({
    mutationFn: () =>
      api
        .patch(`${ruta}/${diaId}/formularios/${linea.id}`, { json: { fechaInicio: inicio, fechaTermino: termino } })
        .json<Dia>(),
    onSuccess: () => {
      toast.success('Fechas actualizadas.')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudieron actualizar las fechas.'),
  })

  if (!editable) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Inicio {inicioActual ? fechaCorta(inicioActual) : '—'} · Término {terminoActual ? fechaCorta(terminoActual) : '—'}
      </p>
    )
  }
  const cambiado = inicio !== inicioActual || termino !== terminoActual
  const valido = Boolean(inicio && termino) && inicio >= hoy && termino >= inicio
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`vi-${linea.id}`}>
          Inicio
        </Label>
        <Input
          id={`vi-${linea.id}`}
          type="date"
          min={hoy}
          value={inicio}
          onChange={(e) => {
            setInicio(e.target.value)
            if (termino < e.target.value) setTermino(e.target.value)
          }}
          className="h-8 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`vt-${linea.id}`}>
          Término
        </Label>
        <Input
          id={`vt-${linea.id}`}
          type="date"
          min={inicio || hoy}
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          className="h-8 w-40"
        />
      </div>
      {cambiado ? (
        <Button size="sm" variant="outline" disabled={!valido || guardar.isPending} onClick={() => guardar.mutate()}>
          {guardar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar fechas
        </Button>
      ) : null}
    </div>
  )
}
