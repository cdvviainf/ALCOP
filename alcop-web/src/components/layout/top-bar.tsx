'use client'

import Link from 'next/link'
import { Bell, Plus, Search, ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Shell blanco del header — barra superior del área clara (h-16, borde inferior). */
export function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-8">
      {children}
    </header>
  )
}

/** Barra superior por defecto: buscador + campana + "Nueva visita" (mockup web-02). */
export function TopBar() {
  return (
    <AppHeader>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar obra…"
          className="h-10 rounded-lg bg-secondary pl-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-white" />
        </button>
        <Button
          nativeButton={false}
          render={<Link href="/formularios/epp" />}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Nueva visita
        </Button>
      </div>
    </AppHeader>
  )
}

/** Header con breadcrumb (mockup web-03). La parte final va en negrita. */
export function BreadcrumbBar({
  backHref,
  trail,
  current,
}: {
  backHref: string
  trail: string
  current: string
}) {
  return (
    <AppHeader>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex size-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <span className="font-semibold text-foreground">{trail}</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-bold text-foreground">{current}</span>
      </div>
    </AppHeader>
  )
}
