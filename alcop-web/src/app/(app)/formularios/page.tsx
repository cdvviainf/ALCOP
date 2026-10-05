import Link from 'next/link'
import { ChevronRight, ClipboardCheck } from 'lucide-react'

import { TopBar } from '@/components/layout/top-bar'

const FORMULARIOS = [
  {
    href: '/formularios/epp',
    nombre: 'Checklist: EPP General',
    obra: 'Condominio Mirador Piedra Roja',
    avance: '3 / 5',
  },
]

export default function FormulariosPage() {
  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-foreground">Formularios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Checklists dinámicos por obra.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {FORMULARIOS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="flex items-center gap-4 px-6 py-5 text-sm transition-colors hover:bg-secondary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <ClipboardCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{f.nombre}</p>
                <p className="text-muted-foreground">{f.obra}</p>
              </div>
              <span className="text-xs font-semibold tracking-wide text-label">
                {f.avance}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
