'use client'

import Link from 'next/link'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { cn } from 'cn'
import { api } from '@/lib/api'
import { TopBar } from '@/components/layout/top-bar'

interface Obra {
  id: number
  nombre: string
  comuna: string | null
  direccion: string | null
  activo: boolean
  fechaInicio: string | null
  creadoEn: string
}

interface ObrasResponse {
  data: Obra[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

function EstadoBadge({ activa }: { activa: boolean }) {
  // Placeholder: el estado real (AL DÍA / PENDIENTE) vendrá del módulo de
  // visitas (pendiente de spec en tecnica.md / prevencion.md). Por ahora toda
  // obra activa se muestra "AL DÍA".
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        activa ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'
      )}
    >
      {activa ? 'AL DÍA' : 'INACTIVA'}
    </span>
  )
}

export default function ObrasPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['obras'],
    queryFn: () => api.get('nucleo/obras').json<ObrasResponse>(),
  })

  const obras = data?.data ?? []
  const activas = obras.filter((o) => o.activo).length

  const stats = [
    { label: 'OBRAS ACTIVAS', value: String(activas), accent: false },
    // Placeholders hasta el módulo de visitas (sin spec aún).
    { label: 'VISITAS ESTA SEMANA', value: '—', accent: false },
    { label: 'PENDIENTES', value: '—', accent: true },
  ]

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-foreground">Tus obras</h1>

        {/* Stat cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-label">
                {stat.label}
              </p>
              <p
                className={cn(
                  'mt-3 text-4xl font-bold',
                  stat.accent ? 'text-primary' : 'text-foreground'
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabla de obras */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-[2.4fr_1.2fr_1.2fr_1fr_40px] items-center gap-4 border-b border-border px-6 py-4 text-xs font-semibold tracking-[0.12em] text-label">
            <span>OBRA</span>
            <span>COMUNA</span>
            <span>ÚLTIMA VISITA</span>
            <span>ESTADO</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando obras…
            </div>
          ) : isError ? (
            <div className="px-6 py-12 text-center text-sm text-warn-fg">
              No se pudieron cargar las obras.
            </div>
          ) : obras.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No hay obras registradas.
            </div>
          ) : (
            obras.map((obra, i) => (
              <Link
                key={obra.id}
                href="/formularios/epp"
                className={cn(
                  'grid grid-cols-[2.4fr_1.2fr_1.2fr_1fr_40px] items-center gap-4 px-6 py-5 text-sm transition-colors hover:bg-secondary',
                  i !== obras.length - 1 && 'border-b border-border'
                )}
              >
                <span className="font-bold text-foreground">{obra.nombre}</span>
                <span className="text-muted-foreground">{obra.comuna ?? '—'}</span>
                {/* Última visita: pendiente del módulo de visitas */}
                <span className="text-muted-foreground">—</span>
                <span>
                  <EstadoBadge activa={obra.activo} />
                </span>
                <ChevronRight className="size-4 justify-self-end text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  )
}
