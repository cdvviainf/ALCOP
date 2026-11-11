'use client'

import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2, Table2, LineChart } from 'lucide-react'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Visitas por mes (Técnica vs Prevención), filtrable por obra. SVG propio: sin
// librería de gráficos → render inmediato. Una sola escala Y (mismas unidades).

interface VisitasMensuales {
  obraId: number | null
  meses: string[]
  tecnica: number[] | null
  prevencion: number[] | null
}
interface ObraOpcion {
  id: number
  codigo: string
  nombre: string
}

// Color sigue a la entidad (validado: CVD ΔE 23.4, contraste ≥ 3:1 sobre blanco).
const SERIES = [
  { key: 'tecnica', nombre: 'Técnica', color: '#0284c7' },
  { key: 'prevencion', nombre: 'Prevención', color: '#e8560f' },
] as const

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const mesCorto = (ym: string) => MES[Number(ym.slice(5, 7)) - 1]
const mesLargo = (ym: string) => `${MES_LARGO[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

const TODAS = 'todas'
const ALTO = 240
const M = { top: 12, right: 16, bottom: 26, left: 32 }

/** Máximo "redondo" del eje y paso entre marcas (≈4 líneas de grilla). */
function escala(max: number) {
  if (max <= 4) return { tope: 4, paso: 1 }
  const crudo = max / 4
  const mag = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= crudo) ?? 10 * mag
  return { tope: Math.ceil(max / paso) * paso, paso }
}

export function VisitasMensualesChart({ obras }: { obras: ObraOpcion[] }) {
  const [obra, setObra] = useState<string>(TODAS)
  const [verTabla, setVerTabla] = useState(false)

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['dashboard', 'visitas-mensuales', obra],
    queryFn: () =>
      api
        .get('nucleo/dashboard/visitas-mensuales', { searchParams: obra === TODAS ? {} : { obraId: obra } })
        .json<VisitasMensuales>(),
    placeholderData: keepPreviousData, // al filtrar se mantiene el gráfico anterior (sin parpadeo)
    staleTime: 60_000,
  })

  const series = useMemo(
    () =>
      SERIES.flatMap((s) => {
        const valores = data?.[s.key]
        return valores ? [{ ...s, valores, total: valores.reduce((a, b) => a + b, 0) }] : []
      }),
    [data]
  )

  // Ancho real del contenedor → SVG nítido (texto sin escalar).
  // (callback ref: el contenedor aparece recién tras cargar o al volver de la tabla)
  const [caja, setCaja] = useState<HTMLDivElement | null>(null)
  const [ancho, setAncho] = useState(0)
  useEffect(() => {
    if (!caja) return
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)))
    ro.observe(caja)
    return () => ro.disconnect()
  }, [caja])

  const [hover, setHover] = useState<number | null>(null)

  const meses = data?.meses ?? []
  const n = meses.length
  const max = Math.max(0, ...series.flatMap((s) => s.valores))
  const { tope, paso } = escala(max)
  const iw = Math.max(0, ancho - M.left - M.right)
  const ih = ALTO - M.top - M.bottom
  const x = (i: number) => M.left + (n <= 1 ? iw / 2 : (i * iw) / (n - 1))
  const y = (v: number) => M.top + ih - (v / tope) * ih
  const marcas = Array.from({ length: Math.round(tope / paso) + 1 }, (_, k) => k * paso)
  const cadaCuanto = iw / Math.max(1, n) < 34 ? 2 : 1 // etiquetas X alternas si no caben

  const opciones = Object.fromEntries([
    [TODAS, 'Todas las obras'],
    ...obras.map((o) => [String(o.id), `${o.nombre} · ${o.codigo}`]),
  ])

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            Visitas por mes
            {isFetching && !isLoading ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
          </h2>
          <p className="text-sm text-muted-foreground">Últimos {n || 12} meses</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={obra} onValueChange={(v) => typeof v === 'string' && setObra(v)} items={opciones}>
            <SelectTrigger className="h-9 w-56 max-w-full" aria-label="Filtrar por obra">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las obras</SelectItem>
              {obras.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.nombre} · {o.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setVerTabla((t) => !t)}
            aria-label={verTabla ? 'Ver gráfico' : 'Ver tabla'}
            title={verTabla ? 'Ver gráfico' : 'Ver tabla'}
          >
            {verTabla ? <LineChart className="size-4" /> : <Table2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Leyenda (siempre: identidad nunca solo por color) */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.nombre}</span>
            <b className="font-semibold tabular-nums">{s.total}</b>
          </li>
        ))}
      </ul>

      {isError ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No se pudo cargar el gráfico.</p>
      ) : isLoading ? (
        <div className="mt-3 h-[240px] animate-pulse rounded-xl bg-muted" />
      ) : !series.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Tu perfil no tiene acceso a visitas.</p>
      ) : verTabla ? (
        <div className="mt-3 max-h-[260px] overflow-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1.5 font-semibold">Mes</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1.5 text-right font-semibold">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={m} className="border-t border-border/60">
                  <td className="py-1.5 capitalize">{mesLargo(m)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1.5 text-right">
                      {s.valores[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={setCaja} className={cn('relative mt-3 transition-opacity', isFetching && 'opacity-60')}>
          {ancho > 0 ? (
            <svg
              width={ancho}
              height={ALTO}
              role="img"
              aria-label={`Visitas por mes: ${series.map((s) => `${s.nombre} ${s.total}`).join(', ')}`}
              onMouseLeave={() => setHover(null)}
            >
              {/* Grilla y eje Y (recesivos) */}
              {marcas.map((v) => (
                <g key={v}>
                  <line
                    x1={M.left}
                    x2={M.left + iw}
                    y1={y(v)}
                    y2={y(v)}
                    stroke="var(--border)"
                    strokeDasharray={v === 0 ? undefined : '2 4'}
                  />
                  <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                    {v}
                  </text>
                </g>
              ))}
              {/* Eje X */}
              {meses.map((m, i) =>
                (n - 1 - i) % cadaCuanto === 0 ? (
                  <text key={m} x={x(i)} y={ALTO - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {mesCorto(m)}
                    {m.endsWith('-01') || i === 0 ? ` ${m.slice(2, 4)}` : ''}
                  </text>
                ) : null
              )}
              {/* Crosshair */}
              {hover !== null ? (
                <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + ih} stroke="var(--muted-foreground)" strokeOpacity={0.35} />
              ) : null}
              {/* Líneas */}
              {/* Líneas: el último tramo (mes en curso, incompleto) va punteado */}
              {series.map((s) => (
                <g key={s.key} stroke={s.color} strokeWidth={2} strokeLinecap="round" fill="none">
                  <polyline
                    strokeLinejoin="round"
                    points={s.valores.slice(0, -1).map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                  />
                  {n > 1 ? (
                    <line
                      x1={x(n - 2)}
                      y1={y(s.valores[n - 2])}
                      x2={x(n - 1)}
                      y2={y(s.valores[n - 1])}
                      strokeDasharray="3 4"
                    />
                  ) : null}
                </g>
              ))}
              {/* Puntos: último mes siempre; el mes con hover, todos */}
              {series.map((s) =>
                s.valores.map((v, i) =>
                  i === n - 1 || i === hover ? (
                    <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(v)} r={4} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                  ) : null
                )
              )}
              {/* Zonas de hover (más anchas que la marca) */}
              {meses.map((m, i) => (
                <rect
                  key={m}
                  x={x(i) - iw / Math.max(1, n - 1) / 2}
                  y={M.top}
                  width={iw / Math.max(1, n - 1)}
                  height={ih}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover(i)}
                />
              ))}
            </svg>
          ) : (
            <div style={{ height: ALTO }} />
          )}

          {hover !== null && ancho > 0 ? (
            <div
              className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
              style={
                x(hover) > ancho / 2
                  ? { right: ancho - x(hover) + 10 }
                  : { left: x(hover) + 10 }
              }
            >
              <div className="mb-1 font-semibold">
                <span className="capitalize">{mesLargo(meses[hover])}</span>
                {hover === n - 1 ? <span className="font-normal text-muted-foreground"> · mes en curso</span> : null}
              </div>
              {series.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <i className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.nombre}
                  </span>
                  <b className="font-semibold tabular-nums">{s.valores[hover]}</b>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}
