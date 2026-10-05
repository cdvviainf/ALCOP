'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'

interface Obra {
  nombre: string
  comuna: string
  ultimaVisita: string
  estado: 'AL DÍA' | 'PENDIENTE'
}

const STATS = [
  { label: 'OBRAS ACTIVAS', value: '6', accent: false },
  { label: 'VISITAS ESTA SEMANA', value: '17', accent: false },
  { label: 'PENDIENTES', value: '1', accent: true },
]

const OBRAS: Obra[] = [
  { nombre: 'Condominio Mirador Piedra Roja', comuna: 'Chicureo', ultimaVisita: 'Hoy', estado: 'AL DÍA' },
  { nombre: 'Condominio Chamisero III', comuna: '—', ultimaVisita: 'Hace 6 días', estado: 'PENDIENTE' },
  { nombre: 'Condominio Casas Olmo', comuna: '—', ultimaVisita: 'Ayer', estado: 'AL DÍA' },
  { nombre: 'Condominio Mirador del Alto', comuna: 'San Esteban', ultimaVisita: 'Hace 2 días', estado: 'AL DÍA' },
]

function EstadoBadge({ estado }: { estado: Obra['estado'] }) {
  const esAlDia = estado === 'AL DÍA'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        esAlDia ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'
      )}
    >
      {estado}
    </span>
  )
}

export default function ObrasPage() {
  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-foreground">Tus obras</h1>

        {/* Stat cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat) => (
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
          {OBRAS.map((obra, i) => (
            <Link
              key={obra.nombre}
              href="/formularios/epp"
              className={cn(
                'grid grid-cols-[2.4fr_1.2fr_1.2fr_1fr_40px] items-center gap-4 px-6 py-5 text-sm transition-colors hover:bg-secondary',
                i !== OBRAS.length - 1 && 'border-b border-border'
              )}
            >
              <span className="font-bold text-foreground">{obra.nombre}</span>
              <span className="text-muted-foreground">{obra.comuna}</span>
              <span className="text-muted-foreground">{obra.ultimaVisita}</span>
              <span>
                <EstadoBadge estado={obra.estado} />
              </span>
              <ChevronRight className="size-4 justify-self-end text-muted-foreground" />
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
