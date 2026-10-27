'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
}
interface Dia {
  id: number
  obraId: number
  fecha: string
  comentario: string | null
  usuario: { id: string; nombre: string } | null
  vencido: boolean
  formularios: FormularioProgramado[]
}

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

export default function ProgramacionPrevencionPage() {
  const queryClient = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('usuarios/me').json<Me>(), retry: false })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['PREV_PROGRAMACION'] === 'TOTAL'

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

  const { data: diasResp, isLoading } = useQuery({
    queryKey: ['programacion', obraActiva, anio, mes],
    queryFn: () =>
      api
        .get('prevencion/programacion', {
          searchParams: { obraId: String(obraActiva), anio: String(anio), mes: String(mes + 1) },
        })
        .json<{ data: Dia[] }>(),
    enabled: obraActiva !== null,
  })
  const porFecha = useMemo(() => {
    const m = new Map<string, Dia>()
    for (const d of diasResp?.data ?? []) m.set(d.fecha, d)
    return m
  }, [diasResp])

  const celdas = useMemo(() => celdasDelMes(anio, mes), [anio, mes])

  const mover = (delta: number) => {
    const base = new Date(anio, mes + delta, 1)
    setAnio(base.getFullYear())
    setMes(base.getMonth())
  }

  const diaDetalle = diaSel ? (porFecha.get(diaSel) ?? null) : null
  const diaEsPasado = diaSel ? diaSel < hoy : false

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Programación Prevención</h1>
              <p className="text-sm text-muted-foreground">
                Calendario de aplicación de formularios por obra. Agenda uno o más formularios en una fecha; el
                responsable es el prevencionista de la obra.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <label className="mb-1 block text-[11px] font-semibold tracking-wide text-label">OBRA</label>
              <Select
                value={obraActiva !== null ? String(obraActiva) : undefined}
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
                  const dia = porFecha.get(c.fecha)
                  const esPasado = c.fecha < hoy
                  const esHoy = c.fecha === hoy
                  const n = dia?.formularios.length ?? 0
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
                      {n > 0 ? (
                        <span className="mt-auto flex flex-col items-start gap-0.5">
                          {dia!.formularios.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              title={f.formulario.nombre}
                              className={cn(
                                'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                esPasado ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                              )}
                            >
                              {f.formulario.codigo}
                            </span>
                          ))}
                          {n > 3 ? (
                            <span className="px-1 text-[10px] font-medium text-muted-foreground">+{n - 3} más</span>
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
        {diaSel && obraActiva !== null ? (
          <DiaDialog
            obraId={obraActiva}
            fecha={diaSel}
            dia={diaDetalle}
            esPasado={diaEsPasado}
            puedeEditar={puedeEditar}
            onClose={() => setDiaSel(null)}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['programacion', obraActiva, anio, mes] })}
          />
        ) : null}
      </Dialog>
    </>
  )
}

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}

function DiaDialog({
  obraId,
  fecha,
  dia,
  esPasado,
  puedeEditar,
  onClose,
  onChanged,
}: {
  obraId: number
  fecha: string
  dia: Dia | null
  esPasado: boolean
  puedeEditar: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const queryClient = useQueryClient()
  const editable = puedeEditar && !esPasado
  const [comentario, setComentario] = useState(dia?.comentario ?? '')
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())

  const { data: opcResp } = useQuery({
    queryKey: ['programacion-formularios-opciones'],
    queryFn: () => api.get('prevencion/programacion/formularios-opciones').json<{ data: FormularioOpcion[] }>(),
    enabled: editable,
  })
  const yaAgendados = new Set((dia?.formularios ?? []).map((f) => f.formulario.id))
  const opciones = (opcResp?.data ?? []).filter((o) => !yaAgendados.has(o.id))

  const refrescar = () => {
    onChanged()
    queryClient.invalidateQueries({ queryKey: ['programacion'] })
  }

  const toggle = (id: number) =>
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Alta de un día nuevo (comentario + formularios seleccionados).
  const crear = useMutation({
    mutationFn: () =>
      api
        .post('prevencion/programacion', {
          json: { obraId, fecha, comentario: comentario.trim() || null, formularioIds: Array.from(seleccion) },
        })
        .json<Dia>(),
    onSuccess: () => {
      toast.success('Programación creada.')
      refrescar()
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo crear.'),
  })

  // Anexar formularios a un día existente.
  const agregar = useMutation({
    mutationFn: () =>
      api
        .post(`prevencion/programacion/${dia!.id}/formularios`, { json: { formularioIds: Array.from(seleccion) } })
        .json<Dia>(),
    onSuccess: () => {
      toast.success('Formularios agregados.')
      setSeleccion(new Set())
      refrescar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  const guardarComentario = useMutation({
    mutationFn: () =>
      api.patch(`prevencion/programacion/${dia!.id}`, { json: { comentario: comentario.trim() || null } }).json<Dia>(),
    onSuccess: () => {
      toast.success('Comentario guardado.')
      refrescar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo guardar.'),
  })

  const quitar = useMutation({
    mutationFn: (fpId: number) =>
      api.delete(`prevencion/programacion/${dia!.id}/formularios/${fpId}`).json<Dia>(),
    onSuccess: () => {
      toast.success('Formulario quitado.')
      refrescar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const eliminarDia = useMutation({
    mutationFn: () => api.delete(`prevencion/programacion/${dia!.id}`),
    onSuccess: () => {
      toast.success('Día eliminado.')
      refrescar()
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  const listaFormularios = dia?.formularios ?? []

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{fechaLegible(fecha)}</DialogTitle>
        <DialogDescription>
          {esPasado
            ? 'Fecha pasada: solo lectura.'
            : editable
              ? 'Agenda formularios de prevención y un comentario para este día.'
              : 'Detalle de la programación del día.'}
          {dia?.usuario ? ` · Prevencionista: ${dia.usuario.nombre}` : dia ? ' · Sin prevencionista asignado' : ''}
        </DialogDescription>
      </DialogHeader>

      {/* Formularios ya agendados */}
      {dia ? (
        <div className="space-y-2">
          <Label>Formularios agendados</Label>
          {listaFormularios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay formularios en este día.</p>
          ) : (
            <ul className="space-y-1.5">
              {listaFormularios.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
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
            <p className="text-sm text-muted-foreground">No hay formularios de prevención disponibles.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {opciones.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                >
                  <Checkbox checked={seleccion.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                  <span>
                    <span className="font-medium text-foreground">{o.nombre}</span>{' '}
                    <span className="text-xs text-muted-foreground">· {o.codigo}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
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
            <Button disabled={seleccion.size === 0 || crear.isPending} onClick={() => crear.mutate()}>
              {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Guardar
            </Button>
          ) : null}
          {editable && dia ? (
            <Button disabled={seleccion.size === 0 || agregar.isPending} onClick={() => agregar.mutate()}>
              {agregar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
