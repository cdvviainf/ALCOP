'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Building2 } from 'lucide-react'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisitasMensualesChart } from '@/components/modules/dashboard/visitas-mensuales-chart'

// Dashboard (Panel de obras y resumen): un solo GET agregado a /nucleo/dashboard.
// El backend ya acota a las obras con acceso (UsuarioObra; esAdmin ve todas) y
// devuelve null en el área que el perfil no permite ver.

type Area = 'PREVENCION' | 'TECNICA'
type EstadoObra = 'SIN_INICIAR' | 'EN_EJECUCION' | 'SUSPENDIDA' | 'TERMINADA'

interface Categoria {
  id: number | null
  codigo: string
  nombre: string
  n: number
}
interface AreaResumen {
  visitas: number
  hallazgos: Categoria[]
}
interface ObraResumen {
  id: number
  codigo: string
  nombre: string
  estado: EstadoObra
  tecnica: AreaResumen | null
  prevencion: AreaResumen | null
}
interface AgendaItem {
  id: number
  area: Area
  fecha: string
  vence: string
  enBorrador: boolean
  obra: { id: number; codigo: string; nombre: string }
  formulario: { id: number; codigo: string; nombre: string }
}
interface Dashboard {
  hoy: string
  permisos: { tecnica: boolean; prevencion: boolean; agenda: Area[]; registrar: Area[] }
  obras: { total: number; porEstado: Record<EstadoObra, number> }
  tecnica: AreaResumen | null
  prevencion: AreaResumen | null
  porObra: ObraResumen[]
  agenda: { dias: number; atrasadas: AgendaItem[]; proximas: AgendaItem[] }
}

// ─── Colores por área: el color sigue a la entidad (catálogos por código; fallback por índice) ──
const COLOR_CATEGORIA: Record<Area, Record<string, string>> = {
  // Técnica — tipo de hallazgo (severidad: rojo › naranjo › amarillo)
  TECNICA: { NO_CONFORMIDAD: '#d9412f', MEJORA: '#f08a24', SUGERENCIA: '#f2c230', SIN_TIPO: '#9a9a95' },
  // Prevención — nivel de riesgo
  PREVENCION: { ALTO: '#d9412f', MEDIO: '#e29a1c', OBSERVACION: '#3a78c9', NO_CONFORMIDAD: '#3d3a36' },
}
const PALETA = ['#3a78c9', '#14807f', '#6a4cc2', '#e29a1c', '#d9412f', '#3d3a36']
const colorDe = (area: Area, c: Categoria, i: number) => COLOR_CATEGORIA[area][c.codigo] ?? PALETA[i % PALETA.length]

const AREA = {
  PREVENCION: { nombre: 'Prevención', chip: 'bg-primary/10 text-primary' },
  TECNICA: { nombre: 'Técnica', chip: 'bg-sky-600/10 text-sky-700' },
} as const

const COLOR_ESTADO: Record<EstadoObra, { nombre: string; color: string }> = {
  EN_EJECUCION: { nombre: 'En ejecución', color: '#1e7b34' },
  SIN_INICIAR: { nombre: 'Sin iniciar', color: '#0284c7' },
  SUSPENDIDA: { nombre: 'Suspendida', color: '#c2410c' },
  TERMINADA: { nombre: 'Terminada', color: '#8f8a82' },
}

const ESTADO_OBRA: Record<EstadoObra, { label: string; dot: string }> = {
  EN_EJECUCION: { label: 'en ejecución', dot: 'bg-ok-fg' },
  SIN_INICIAR: { label: 'sin iniciar', dot: 'bg-sky-600' },
  SUSPENDIDA: { label: 'suspendida', dot: 'bg-warn-fg' },
  TERMINADA: { label: 'terminada', dot: 'bg-label' },
}

// ─── Fechas (strings YYYY-MM-DD; sin zona: se comparan como días) ─────────────
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const aUtc = (s: string) => new Date(`${s}T00:00:00Z`)
function fechaCorta(s: string) {
  const d = aUtc(s)
  const t = `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const difDias = (a: string, b: string) => Math.round((aUtc(a).getTime() - aUtc(b).getTime()) / 86_400_000)
function relativo(fecha: string, hoy: string): { texto: string; tono: 'hoy' | 'mal' | '' } {
  const d = difDias(fecha, hoy)
  if (d === 0) return { texto: 'Hoy', tono: 'hoy' }
  if (d === 1) return { texto: 'Mañana', tono: '' }
  if (d === -1) return { texto: 'Hace 1 día', tono: 'mal' }
  if (d < 0) return { texto: `Hace ${-d} días`, tono: 'mal' }
  return { texto: `En ${d} días`, tono: '' }
}
const pl = (n: number, s: string, p: string) => (n === 1 ? s : p)
const fmt = new Intl.NumberFormat('es-CL')

// ─── Piezas ──────────────────────────────────────────────────────────────────
function Tarjeta({ className, children }: { className?: string; children: React.ReactNode }) {
  return <article className={cn('rounded-2xl border border-border bg-card p-5', className)}>{children}</article>
}

function ChipArea({ area }: { area: Area }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', AREA[area].chip)}>
      {AREA[area].nombre}
    </span>
  )
}

/** Barra apilada proporcional (sin librería de gráficos: CSS puro, render instantáneo). */
function BarraApilada({ area, items, alto = 'h-2' }: { area: Area; items: Categoria[]; alto?: string }) {
  const total = items.reduce((s, c) => s + c.n, 0)
  const etiqueta = items.map((c) => `${c.n} ${c.nombre}`).join(', ')
  if (!total) return <div className={cn('rounded-full bg-muted', alto)} aria-label="Sin hallazgos" />
  return (
    <div className={cn('flex gap-0.5', alto)} role="img" aria-label={etiqueta}>
      {items.map((c, i) =>
        c.n ? (
          <span
            key={c.codigo}
            title={`${c.nombre}: ${c.n}`}
            className="block min-w-1 rounded-full"
            style={{ flex: c.n, background: colorDe(area, c, i) }}
          />
        ) : null
      )}
    </div>
  )
}

interface FilaKpi {
  key: string
  n: number
  nombre: string
  color: string
}

/**
 * Tarjeta KPI uniforme (Obras / Técnica / Prevención): título · número grande
 * centrado a la izquierda · filas a la derecha alineadas desde arriba.
 */
function KpiCard({ titulo, total, etiquetaTotal, filas }: { titulo: string; total: number; etiquetaTotal: string; filas: FilaKpi[] }) {
  return (
    <Tarjeta className="flex flex-col">
      <h3 className="text-xl font-bold leading-tight">{titulo}</h3>
      <div className="my-4 h-px bg-border" />
      <div className="grid flex-1 grid-cols-[minmax(3.5rem,.6fr)_minmax(0,1.6fr)] gap-3">
        <div className="flex items-center justify-center border-r border-border pr-3">
          <span className="text-[64px] font-bold leading-none tracking-tight tabular-nums" aria-label={`${total} ${etiquetaTotal}`}>
            {fmt.format(total)}
          </span>
        </div>
        <ul className="flex flex-col gap-2" aria-label={titulo}>
          {filas.map((f) => (
            <li
              key={f.key}
              className="flex h-9 items-center gap-2.5 rounded-xl px-3"
              style={{ background: `color-mix(in oklab, ${f.color} 12%, transparent)` }}
            >
              <span className="min-w-6 text-lg font-bold leading-none tabular-nums">{fmt.format(f.n)}</span>
              <i className="size-2.5 flex-none rounded-full" style={{ background: f.color }} />
              <span className="truncate text-sm">{f.nombre}</span>
            </li>
          ))}
        </ul>
      </div>
    </Tarjeta>
  )
}

const filasArea = (area: Area, data: AreaResumen): FilaKpi[] =>
  data.hallazgos.map((c, i) => ({ key: c.codigo, n: c.n, nombre: c.nombre, color: colorDe(area, c, i) }))

function FilaAgenda({ a, hoy, puedeRegistrar }: { a: AgendaItem; hoy: string; puedeRegistrar: boolean }) {
  const enCurso = a.area === 'TECNICA' && a.fecha < hoy && a.vence >= hoy
  const rel = enCurso ? { texto: `Vence ${fechaCorta(a.vence).toLowerCase()}`, tono: '' as const } : relativo(a.vence < hoy ? a.vence : a.fecha, hoy)
  const href = a.area === 'PREVENCION' ? `/registro/prevencion/${a.id}` : '/registro/tecnica'
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border/60 px-5 py-3 last:border-b-0 hover:bg-muted/40">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span>{fechaCorta(a.fecha)}</span>
        <span
          className={cn(
            'rounded-full px-2 py-px text-[11px] font-semibold',
            rel.tono === 'hoy' && 'bg-primary text-primary-foreground',
            rel.tono === 'mal' && 'bg-destructive/10 text-destructive',
            rel.tono === '' && 'bg-muted text-muted-foreground'
          )}
        >
          {rel.texto}
        </span>
      </div>
      <div className="col-span-2 row-start-2 min-w-0">
        <div className="truncate font-semibold">{a.formulario.nombre}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <ChipArea area={a.area} />
          <span className="truncate">
            {a.obra.nombre} · <span className="font-mono">{a.formulario.codigo}</span>
          </span>
          {a.enBorrador ? <span className="text-[11px] font-semibold text-warn-fg">En borrador</span> : null}
        </div>
      </div>
      <div className="col-start-2 row-start-1">
        {puedeRegistrar ? (
          <Button variant="outline" size="sm" className="font-semibold" render={<Link href={href} />} nativeButton={false}>
            {a.enBorrador ? 'Continuar' : 'Iniciar'}
          </Button>
        ) : null}
      </div>
    </li>
  )
}

function Agenda({ d }: { d: Dashboard }) {
  const { atrasadas, proximas, dias } = d.agenda
  const lista = (arr: AgendaItem[], vacio: string) =>
    arr.length ? (
      <ul>
        {arr.map((a) => (
          <FilaAgenda key={a.id} a={a} hoy={d.hoy} puedeRegistrar={d.permisos.registrar.includes(a.area)} />
        ))}
      </ul>
    ) : (
      <p className="px-5 py-4 text-sm text-muted-foreground">{vacio}</p>
    )
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="h-agenda">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
        <div>
          <h2 id="h-agenda" className="text-[17px] font-bold">Mi agenda de inspecciones</h2>
          <p className="text-sm text-muted-foreground">Atrasadas y próximos {dias} días, a tu nombre.</p>
        </div>
        <div className="flex gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              atrasadas.length ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
            )}
          >
            {atrasadas.length} {pl(atrasadas.length, 'atrasada', 'atrasadas')}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {proximas.length} {pl(proximas.length, 'programada', 'programadas')}
          </span>
        </div>
      </div>
      <div className="max-h-[340px] flex-1 overflow-y-auto border-t border-border">
        <div className="sticky top-0 z-[1] border-b border-border bg-[color-mix(in_oklab,var(--destructive)_5%,var(--card))] px-5 py-3 text-xs font-bold uppercase tracking-wider text-destructive">
          Atrasadas · {atrasadas.length}
        </div>
        {lista(atrasadas, 'No tienes inspecciones atrasadas.')}
        <div className="sticky top-0 z-[1] border-y border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Próximos {dias} días · {proximas.length}
        </div>
        {lista(proximas, 'No tienes inspecciones programadas.')}
      </div>
    </section>
  )
}

function BloqueObraArea({ area, data }: { area: Area; data: AreaResumen }) {
  const total = data.hallazgos.reduce((s, c) => s + c.n, 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <ChipArea area={area} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {data.visitas} {pl(data.visitas, 'visita', 'visitas')}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold leading-none tabular-nums">{total}</span>
        <span className="text-[13px] text-muted-foreground">{pl(total, 'hallazgo', 'hallazgos')}</span>
      </div>
      <BarraApilada area={area} items={data.hallazgos} />
      {total ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {data.hallazgos.map((c, i) =>
            c.n ? (
              <li key={c.codigo} className="flex items-center gap-1.5">
                <i className="size-2 rounded-full" style={{ background: colorDe(area, c, i) }} />
                {c.nombre} <b className="font-semibold text-foreground tabular-nums">{c.n}</b>
              </li>
            ) : null
          )}
        </ul>
      ) : null}
    </div>
  )
}

function TarjetaObra({ o }: { o: ObraResumen }) {
  const terminada = o.estado === 'TERMINADA'
  return (
    <Tarjeta className={cn('flex flex-col gap-4 p-4', terminada && 'bg-muted/40')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{o.nombre}</div>
          <span className="font-mono text-xs text-muted-foreground">{o.codigo}</span>
        </div>
        {o.estado !== 'EN_EJECUCION' ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
            {ESTADO_OBRA[o.estado].label}
          </span>
        ) : null}
      </div>
      {o.prevencion ? <BloqueObraArea area="PREVENCION" data={o.prevencion} /> : null}
      {o.prevencion && o.tecnica ? <div className="h-px bg-border" /> : null}
      {o.tecnica ? <BloqueObraArea area="TECNICA" data={o.tecnica} /> : null}
    </Tarjeta>
  )
}

function Cargando() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Cargando dashboard">
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-60 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[380px] rounded-2xl" />
        <Skeleton className="h-[380px] rounded-2xl" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: d, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('nucleo/dashboard').json<Dashboard>(),
    staleTime: 60_000,
  })

  const nAreas = d ? Number(!!d.tecnica) + Number(!!d.prevencion) : 2
  const verAgenda = !!d && d.permisos.agenda.length > 0
  const verGrafico = !!d && (d.permisos.tecnica || d.permisos.prevencion) && d.obras.total > 0
  const verPorObra = !!d && (d.permisos.prevencion || d.permisos.tecnica) && d.porObra.length > 0

  return (
    <>
      <TopBar />
      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-[1280px] space-y-7">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Resumen de obras, inspecciones y hallazgos.</p>
            </div>
            {d ? <div className="hidden text-right text-sm font-semibold sm:block">{fechaCorta(d.hoy)} {d.hoy.slice(0, 4)}</div> : null}
          </header>

          {isLoading ? <Cargando /> : null}

          {isError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
              <AlertCircle className="size-5 text-destructive" />
              <span className="flex-1">No se pudo cargar el dashboard.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : null}

          {d ? (
            <>
              <section
                aria-label="Resumen general"
                className={cn(
                  'grid gap-4 md:grid-cols-2',
                  nAreas === 2 && '[&>*:first-child]:md:col-span-2 xl:[&>*:first-child]:col-span-1',
                  nAreas === 2 && 'xl:grid-cols-3',
                  nAreas === 1 && 'xl:grid-cols-2'
                )}
              >
                <KpiCard
                  titulo="Obras"
                  total={d.obras.total}
                  etiquetaTotal={pl(d.obras.total, 'obra con acceso', 'obras con acceso')}
                  filas={(['EN_EJECUCION', 'SIN_INICIAR', 'SUSPENDIDA', 'TERMINADA'] as const).map((e) => ({
                    key: e,
                    n: d.obras.porEstado[e],
                    nombre: COLOR_ESTADO[e].nombre,
                    color: COLOR_ESTADO[e].color,
                  }))}
                />
                {d.tecnica ? (
                  <KpiCard titulo="Visitas Técnicas" total={d.tecnica.visitas} etiquetaTotal="visitas técnicas" filas={filasArea('TECNICA', d.tecnica)} />
                ) : null}
                {d.prevencion ? (
                  <KpiCard
                    titulo="Visitas de Prevención"
                    total={d.prevencion.visitas}
                    etiquetaTotal="visitas de prevención"
                    filas={filasArea('PREVENCION', d.prevencion)}
                  />
                ) : null}
              </section>

              {verGrafico || verAgenda ? (
                <div className={cn('grid gap-4', verGrafico && verAgenda && 'xl:grid-cols-2')}>
                  {verGrafico ? <VisitasMensualesChart obras={d.porObra} /> : null}
                  {verAgenda ? <Agenda d={d} /> : null}
                </div>
              ) : null}

              {verPorObra ? (
                <section className="space-y-3" aria-labelledby="h-obras">
                  <div>
                    <h2 id="h-obras" className="text-[17px] font-bold">Hallazgos por obra</h2>
                    <p className="text-sm text-muted-foreground">
                      Visitas y hallazgos registrados en cada obra a la que tienes acceso.
                    </p>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
                    {d.porObra.map((o) => (
                      <TarjetaObra key={o.id} o={o} />
                    ))}
                  </div>
                </section>
              ) : null}

              {d.obras.total === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  <Building2 className="size-6" />
                  Sin obras asignadas: el resumen aparecerá cuando se te dé acceso a una obra.
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </>
  )
}
