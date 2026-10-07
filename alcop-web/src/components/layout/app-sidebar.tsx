'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUp,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Database,
  FolderTree,
  Gauge,
  HardHat,
  IdCard,
  KeyRound,
  LayoutDashboard,
  Layers,
  ListChecks,
  Loader2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'

import { cn } from 'cn'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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

interface Me {
  id: string
  nombre: string
  email: string
  perfil: { id: number; nombre: string; nivelPrevencion: string; nivelTecnica: string }
}

/**
 * Sidebar oscuro de ALCOP TERRENO, en secciones con grupos anidados colapsables.
 *
 * Visibilidad por Área (CLAUDE.md §11, usuarios-perfiles.md §6, alcop-esquema.html §05):
 * cada hoja declara `requiere` y se filtra según los niveles del perfil del usuario
 * (GET /api/usuarios/me). Un grupo/sección se muestra si tiene al menos una hoja visible.
 * Mientras `/me` no resuelve no se muestra ningún item.
 *   - 'nucleo'   → ≥ LECTURA en al menos un área.
 *   - 'prevencion'/'tecnica' → nivel del área ≠ SIN_ACCESO.
 *   - 'anyTotal' → TOTAL en al menos un área.
 *   - 'admin'    → TOTAL en ambas áreas.
 */

type Requisito = 'nucleo' | 'prevencion' | 'tecnica' | 'anyTotal' | 'admin'
type Icono = React.ComponentType<{ className?: string }>

interface Hoja {
  title: string
  href: string
  icon: Icono
  requiere: Requisito
}
interface Grupo {
  title: string
  icon: Icono
  children: Nodo[]
}
type Nodo = Hoja | Grupo

interface Seccion {
  seccion: string
  items: Nodo[]
}

function esHoja(n: Nodo): n is Hoja {
  return 'href' in n
}

const NAV: Seccion[] = [
  {
    seccion: 'Inicio',
    items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard, requiere: 'nucleo' }],
  },
  {
    seccion: 'Registro',
    items: [
      { title: 'Inspección Técnica', href: '/registro/inspeccion-tecnica', icon: HardHat, requiere: 'tecnica' },
      { title: 'Inspección Prevención', href: '/registro/inspeccion-prevencion', icon: ShieldCheck, requiere: 'prevencion' },
    ],
  },
  {
    seccion: 'Configuración',
    items: [
      { title: 'Obras', href: '/obras', icon: Building2, requiere: 'admin' },
      { title: 'Formularios', href: '/formularios', icon: ClipboardCheck, requiere: 'nucleo' },
      {
        title: 'Datos Maestros',
        icon: Database,
        children: [
          {
            title: 'Técnicos',
            icon: Wrench,
            children: [
              { title: 'Categorías', href: '/formularios/categorias/tecnica', icon: FolderTree, requiere: 'tecnica' },
              { title: 'Tipos Hallazgo', href: '/tecnica/tipos-hallazgo', icon: ListChecks, requiere: 'tecnica' },
              { title: 'Etapas Constructivas', href: '/tecnica/etapas-constructivas', icon: Layers, requiere: 'tecnica' },
              { title: 'Etapas de Nido', href: '/tecnica/etapas-nido', icon: Boxes, requiere: 'tecnica' },
            ],
          },
          {
            title: 'Prevención',
            icon: ShieldAlert,
            children: [
              { title: 'Categorías', href: '/formularios/categorias/prevencion', icon: FolderTree, requiere: 'prevencion' },
              { title: 'Nivel de Riesgo', href: '/prevencion/niveles-riesgo', icon: Gauge, requiere: 'prevencion' },
            ],
          },
        ],
      },
    ],
  },
  {
    seccion: 'Accesos',
    items: [
      { title: 'Usuarios', href: '/usuarios', icon: Users, requiere: 'admin' },
      { title: 'Perfiles', href: '/usuarios/perfiles', icon: IdCard, requiere: 'admin' },
      // Permisos Obra: asociación de usuarios (titulares) por obra.
      { title: 'Permisos Obra', href: '/obras/permisos', icon: KeyRound, requiere: 'admin' },
    ],
  },
]

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '—'
}

function cumpleNivel(req: Requisito, me: Me | undefined): boolean {
  if (!me) return false
  const p = me.perfil.nivelPrevencion
  const t = me.perfil.nivelTecnica
  switch (req) {
    case 'nucleo':
      return p !== 'SIN_ACCESO' || t !== 'SIN_ACCESO'
    case 'prevencion':
      return p !== 'SIN_ACCESO'
    case 'tecnica':
      return t !== 'SIN_ACCESO'
    case 'anyTotal':
      return p === 'TOTAL' || t === 'TOTAL'
    case 'admin':
      return p === 'TOTAL' && t === 'TOTAL'
  }
}

function nodoVisible(n: Nodo, me: Me | undefined): boolean {
  return esHoja(n) ? cumpleNivel(n.requiere, me) : n.children.some((c) => nodoVisible(c, me))
}

/** Todas las hrefs visibles, para elegir el prefijo activo más específico. */
function hrefsVisibles(items: Nodo[], me: Me | undefined): string[] {
  return items.flatMap((n) =>
    esHoja(n) ? (cumpleNivel(n.requiere, me) ? [n.href] : []) : hrefsVisibles(n.children, me)
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const [colapsados, setColapsados] = useState<Set<string>>(new Set())
  const [cambioOpen, setCambioOpen] = useState(false)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [guardandoPass, setGuardandoPass] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCambiarPassword = async () => {
    if (nueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    setGuardandoPass(true)
    const { error } = await authClient.changePassword({ currentPassword: actual, newPassword: nueva })
    setGuardandoPass(false)
    if (error) {
      toast.error(error.message || 'No se pudo cambiar la contraseña. Revisa la contraseña actual.')
      return
    }
    toast.success('Contraseña actualizada.')
    setCambioOpen(false)
    setActual('')
    setNueva('')
  }

  // Href visible cuyo prefijo calza mejor con la ruta actual → único activo.
  const todas = hrefsVisibles(
    NAV.flatMap((s) => s.items),
    me
  )
  const activo = todas
    .filter((h) => pathname === h || pathname.startsWith(h + '/'))
    .sort((a, b) => b.length - a.length)[0]

  const toggle = (key: string) =>
    setColapsados((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  function renderNodo(n: Nodo, level: number): React.ReactNode {
    if (!nodoVisible(n, me)) return null
    const padding = { paddingLeft: `${0.875 + level * 0.85}rem` }

    if (esHoja(n)) {
      const isActive = n.href === activo
      return (
        <li key={n.href}>
          <Link
            href={n.href}
            style={padding}
            className={cn(
              'relative flex items-center gap-3 rounded-lg py-2.5 pr-3.5 text-sm transition-colors',
              isActive
                ? 'bg-panel-active font-semibold text-white'
                : 'text-panel-item hover:bg-white/5 hover:text-white'
            )}
          >
            {isActive ? (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
            ) : null}
            <n.icon className={cn('size-[18px]', isActive ? 'text-white' : 'text-panel-muted')} />
            <span>{n.title}</span>
          </Link>
        </li>
      )
    }

    const abierto = !colapsados.has(n.title)
    return (
      <li key={n.title}>
        <button
          type="button"
          onClick={() => toggle(n.title)}
          style={padding}
          className="flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 text-sm text-panel-item transition-colors hover:bg-white/5 hover:text-white"
        >
          <n.icon className="size-[18px] text-panel-muted" />
          <span className="flex-1 text-left">{n.title}</span>
          <ChevronRight className={cn('size-4 text-panel-muted transition-transform', abierto && 'rotate-90')} />
        </button>
        {abierto ? <ul className="mt-1 space-y-1">{n.children.map((c) => renderNodo(c, level + 1))}</ul> : null}
      </li>
    )
  }

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-panel md:flex">
      {/* Marca */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex items-center justify-center rounded-md border-2 border-primary p-1">
          <ArrowUp className="size-4 text-primary" strokeWidth={2.5} />
        </span>
        <span className="text-sm font-bold tracking-wide text-white">ALCOP TERRENO</span>
      </div>

      {/* Navegación por secciones */}
      <nav className="mt-1 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((sec) => {
          if (!sec.items.some((n) => nodoVisible(n, me))) return null
          return (
            <div key={sec.seccion} className="mt-4 first:mt-0">
              <p className="px-3.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-muted">
                {sec.seccion}
              </p>
              <ul className="space-y-1">{sec.items.map((n) => renderNodo(n, 0))}</ul>
            </div>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="px-3 pb-5">
        <div className="mx-3 mb-3 h-px bg-white/10" />
        <div className="flex items-center gap-3 px-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {me ? iniciales(me.nombre) : '…'}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{me?.nombre ?? '—'}</div>
            <div className="truncate text-xs text-panel-muted">{me?.perfil.nombre ?? ''}</div>
          </div>
          <button
            type="button"
            onClick={() => setCambioOpen(true)}
            title="Cambiar contraseña"
            aria-label="Cambiar contraseña"
            className="rounded-md p-1.5 text-panel-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <KeyRound className="size-[18px]" />
          </button>
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

      {/* Diálogo de cambio de contraseña del usuario de la sesión */}
      <Dialog open={cambioOpen} onOpenChange={(open) => (!open ? setCambioOpen(false) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>Ingresa tu contraseña actual y la nueva (mínimo 8 caracteres).</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleCambiarPassword()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pass-actual">Contraseña actual</Label>
              <Input
                id="pass-actual"
                type="password"
                autoComplete="current-password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass-nueva">Nueva contraseña</Label>
              <Input
                id="pass-nueva"
                type="password"
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCambioOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardandoPass}>
                {guardandoPass ? <Loader2 className="animate-spin" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
