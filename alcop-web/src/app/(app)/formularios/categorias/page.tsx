'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import {
  CrudMaintainer,
  type CrudColumn,
  type CrudFieldOption,
} from '@/components/shared/crud-maintainer'

interface Area {
  id: number
  codigo: string
  nombre: string
}

interface Me {
  perfil: { nivelPrevencion: string; nivelTecnica: string }
}

interface Categoria extends Record<string, unknown> {
  id: number
  areaId: number
  areaCodigo: string
  areaNombre: string
  codigo: string
  nombre: string
  activo: boolean
  formularios: number
  creadoEn: string
}

const schema = z.object({
  areaId: z.coerce.number().int().positive('Selecciona un área'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  activo: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const columns: CrudColumn<Categoria>[] = [
  { key: 'areaNombre', header: 'Área', render: (row) => <span className="text-muted-foreground">{row.areaNombre}</span> },
  { key: 'nombre', header: 'Categoría', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'codigo', header: 'Código', render: (row) => <span className="text-xs text-muted-foreground">{row.codigo}</span> },
  {
    key: 'formularios',
    header: 'Formularios',
    render: (row) => <span className="tabular-nums text-muted-foreground">{row.formularios}</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (row) => (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
          row.activo ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'
        )}
      >
        {row.activo ? 'ACTIVA' : 'INACTIVA'}
      </span>
    ),
  },
]

export default function CategoriasFormularioPage() {
  const { data: areasResp, isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('nucleo/areas').json<{ data: Area[] }>(),
  })
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })

  const areas = areasResp?.data ?? []
  const tieneTotal = (codigo: string) =>
    codigo === 'PREVENCION'
      ? me?.perfil.nivelPrevencion === 'TOTAL'
      : me?.perfil.nivelTecnica === 'TOTAL'

  // El alta solo ofrece las áreas que el usuario administra (TOTAL).
  const areaOptions: CrudFieldOption[] = areas
    .filter((a) => tieneTotal(a.codigo))
    .map((a) => ({ value: String(a.id), label: a.nombre }))
  const primeraAreaAdmin = areas.find((a) => tieneTotal(a.codigo))
  const puedeCrear = areaOptions.length > 0

  return (
    <>
      <BreadcrumbBar backHref="/formularios" trail="Formularios" current="Categorías" />
      <main className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <CrudMaintainer<Categoria, FormValues>
            titulo="Categorías de formulario"
            descripcion="Agrupación temática de formularios por área. Se administran con nivel TOTAL en el área de la categoría."
            endpoint="nucleo/categorias-formulario"
            queryKey="categorias-formulario"
            columns={columns}
            fields={[
              { name: 'areaId', label: 'Área', type: 'select', options: areaOptions, soloAlta: true },
              { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Trabajos en Altura' },
              { name: 'activo', label: 'Activa', type: 'checkbox' },
            ]}
            schema={schema}
            defaultValues={{ areaId: primeraAreaAdmin?.id ?? 0, nombre: '', activo: true }}
            toFormValues={(row) => ({ areaId: row.areaId, nombre: row.nombre, activo: row.activo })}
            puedeCrear={puedeCrear}
            puedeEditar={(row) => tieneTotal(row.areaCodigo)}
            searchPlaceholder="Buscar categoría…"
            emptyMessage="No hay categorías."
          />
        )}
      </main>
    </>
  )
}
