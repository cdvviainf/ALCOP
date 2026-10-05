'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  Camera,
  HardHat,
  Users,
  FileStack,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

/**
 * Sidebar ESTÁTICO con las secciones canónicas de ALCOP
 * (alcop-esquema.html §05-07 + CLAUDE.md §4).
 *
 * IMPORTANTE — Visibilidad por Área (pendiente de cablear):
 * Más adelante estas secciones se FILTRARÁN según los niveles de acceso
 * por Área del usuario (nivelPrevencion / nivelTecnica), que vendrán de
 * `GET /api/usuarios/me` — NO de un endpoint /menu y NO del patrón ItemMenu
 * de FAS. ALCOP usa nivel por Área (SIN_ACCESO / LECTURA / TOTAL), ver
 * CLAUDE.md §11 y Docs/usuarios-perfiles.md. Regla de visibilidad:
 * usuario con ambas áreas ve Prevención + Técnica; usuario de un área ve
 * solo la suya. Por ahora el scaffold muestra todas las secciones.
 */

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: 'General',
    items: [
      { title: 'Panel de obras y resumen', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Prevención',
    items: [
      { title: 'Hallazgos', href: '/prevencion/hallazgos', icon: ShieldAlert },
      { title: 'Visitas', href: '/prevencion/visitas', icon: ClipboardList },
      { title: 'Análisis IA', href: '/prevencion/analisis-ia', icon: Camera },
    ],
  },
  {
    label: 'Técnica',
    items: [
      { title: 'Visitas', href: '/tecnica/visitas', icon: HardHat },
      { title: 'Análisis IA', href: '/tecnica/analisis-ia', icon: Camera },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { title: 'Usuarios y perfiles', href: '/configuracion/usuarios', icon: Users },
      { title: 'Formularios dinámicos', href: '/configuracion/formularios', icon: FileStack },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            A
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">ALCOP</span>
            <span className="text-xs text-muted-foreground">Inspección en Terreno</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
