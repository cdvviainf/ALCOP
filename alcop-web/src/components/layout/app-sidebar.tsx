'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  House,
  ClipboardCheck,
  Flag,
  BarChart,
  Folder,
  Users,
  ShieldAlert,
  ListChecks,
  Layers,
  Boxes,
  FolderTree,
  IdCard,
  Link2,
  ArrowUp,
  LogOut,
} from 'lucide-react'

import { cn } from 'cn'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'

interface Me {
  id: string
  nombre: string
  email: string
  perfil: { id: number; nombre: string; nivelPrevencion: string; nivelTecnica: string }
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '—'
}

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
  { title: 'Categorías', href: '/formularios/categorias', icon: FolderTree },
  { title: 'Hallazgos', href: '/hallazgos', icon: Flag },
  { title: 'Niveles de riesgo', href: '/prevencion/niveles-riesgo', icon: ShieldAlert },
  { title: 'Tipos de hallazgo', href: '/tecnica/tipos-hallazgo', icon: ListChecks },
  { title: 'Etapas constructivas', href: '/tecnica/etapas-constructivas', icon: Layers },
  { title: 'Etapas de nido', href: '/tecnica/etapas-nido', icon: Boxes },
  { title: 'Analítica', href: '/analitica', icon: BarChart },
  { title: 'Biblioteca', href: '/biblioteca', icon: Folder },
  { title: 'Usuarios', href: '/usuarios', icon: Users },
  { title: 'Perfiles', href: '/usuarios/perfiles', icon: IdCard },
  { title: 'Asignaciones', href: '/usuarios/asignaciones', icon: Link2 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

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
          {(() => {
            // El prefijo coincidente más específico es el único activo (evita que
            // "Usuarios" y "Perfiles" se marquen a la vez).
            const activo = NAV.map((i) => i.href)
              .filter((h) => pathname === h || pathname.startsWith(h + '/'))
              .sort((a, b) => b.length - a.length)[0]
            return NAV.map((item) => {
            const isActive = item.href === activo
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
            })
          })()}
        </ul>
      </nav>

      {/* Usuario */}
      <div className="px-3 pb-5">
        <div className="mx-3 mb-3 h-px bg-white/10" />
        <div className="flex items-center gap-3 px-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {me ? iniciales(me.nombre) : '…'}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white">
              {me?.nombre ?? '—'}
            </div>
            <div className="truncate text-xs text-panel-muted">
              {me?.perfil.nombre ?? ''}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-md p-1.5 text-panel-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
