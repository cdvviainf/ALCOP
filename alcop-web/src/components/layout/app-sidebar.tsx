'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  ClipboardCheck,
  Flag,
  BarChart,
  Folder,
  Users,
  ArrowUp,
} from 'lucide-react'

import { cn } from 'cn'

/**
 * Sidebar oscuro fijo de ALCOP TERRENO (réplica del mockup web-02/03).
 *
 * NOTA — Visibilidad por Área (pendiente de cablear): la navegación real
 * se filtrará según los niveles de acceso por Área del usuario
 * (nivelPrevencion / nivelTecnica) desde GET /api/usuarios/me — ver
 * CLAUDE.md §11 y Docs/usuarios-perfiles.md. Por ahora es estática con
 * datos mock.
 */

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { title: 'Obras', href: '/obras', icon: House },
  { title: 'Formularios', href: '/formularios', icon: ClipboardCheck },
  { title: 'Hallazgos', href: '/hallazgos', icon: Flag },
  { title: 'Analítica', href: '/analitica', icon: BarChart },
  { title: 'Biblioteca', href: '/biblioteca', icon: Folder },
  { title: 'Usuarios', href: '/usuarios', icon: Users },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-panel md:flex">
      {/* Marca */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex items-center justify-center rounded-md border-2 border-primary p-1">
          <ArrowUp className="size-4 text-primary" strokeWidth={2.5} />
        </span>
        <span className="text-sm font-bold tracking-wide text-white">
          ALCOP TERRENO
        </span>
      </div>

      {/* Navegación */}
      <nav className="mt-2 flex-1 px-3">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-panel-active font-semibold text-white'
                      : 'text-panel-item hover:bg-white/5 hover:text-white'
                  )}
                >
                  {isActive ? (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
                  ) : null}
                  <item.icon
                    className={cn(
                      'size-[18px]',
                      isActive ? 'text-white' : 'text-panel-muted'
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario */}
      <div className="px-3 pb-5">
        <div className="mx-3 mb-3 h-px bg-white/10" />
        <div className="flex items-center gap-3 px-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            JP
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Javiera P.</div>
            <div className="text-xs text-panel-muted">Prevencionista</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
