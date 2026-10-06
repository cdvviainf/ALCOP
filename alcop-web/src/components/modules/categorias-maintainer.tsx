'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
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

function baseColumns(mostrarArea: boolean): CrudColumn<Categoria>[] {
  return [
    ...(mostrarArea
      ? [
          {
            key: 'areaNombre',
            header: 'Área',
            render: (row: Categoria) => <span className="text-muted-foreground">{row.areaNombre}</span>,
          } as CrudColumn<Categoria>,
        ]
      : []),
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
}

/**
 * Mantenedor de CategoriaFormulario. Si `area` viene dado (PREVENCION/TECNICA),
 * la lista se filtra a esa área y el alta queda fijada a ella; si no, muestra
 * todas las áreas accesibles del usuario (filtro server-side).
 */
export function CategoriasMaintainer({ area }: { area?: 'PREVENCION' | 'TECNICA' }) {
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

  const areaFija = area ? areas.find((a) => a.codigo === area) : undefined
  // Áreas que el usuario administra (TOTAL); si hay área fija, solo esa.
  const areasAlta = (areaFija ? [areaFija] : areas).filter((a) => tieneTotal(a.codigo))
  const areaOptions: CrudFieldOption[] = areasAlta.map((a) => ({ value: String(a.id), label: a.nombre }))
  const primeraAreaAdmin = areasAlta[0]
  const puedeCrear = areaOptions.length > 0

  const extraParams = areaFija ? { areaId: String(areaFija.id) } : undefined
  const titulo = areaFija ? `Categorías · ${areaFija.nombre}` : 'Categorías de formulario'

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    )
  }

  return (
    <CrudMaintainer<Categoria, FormValues>
      titulo={titulo}
      descripcion="Agrupación temática de formularios por área. Se administran con nivel TOTAL en el área de la categoría."
      endpoint="nucleo/categorias-formulario"
      queryKey={`categorias-formulario${areaFija ? `-${areaFija.codigo}` : ''}`}
      extraParams={extraParams}
      columns={baseColumns(!areaFija)}
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
  )
}
