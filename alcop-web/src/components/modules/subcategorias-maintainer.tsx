'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { CrudMaintainer, type CrudColumn, type CrudFieldOption } from '@/components/shared/crud-maintainer'

interface Area {
  id: number
  codigo: string
  nombre: string
}
interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Opcion {
  id: number
  codigo: string
  nombre: string
}
interface Subcategoria extends Record<string, unknown> {
  id: number
  categoriaId: number
  categoriaNombre: string
  areaId: number
  areaCodigo: string
  areaNombre: string
  codigo: string
  nombre: string
  activo: boolean
  creadoEn: string
}

const schema = z.object({
  categoriaId: z.coerce.number().int().positive('Selecciona una categoría'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  activo: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const CAT_FUNCION: Record<string, string> = { PREVENCION: 'PREV_CAT_CATEGORIAS', TECNICA: 'TEC_CAT_CATEGORIAS' }

const columns: CrudColumn<Subcategoria>[] = [
  { key: 'categoriaNombre', header: 'Categoría', render: (row) => <span className="text-muted-foreground">{row.categoriaNombre}</span> },
  { key: 'nombre', header: 'Subcategoría', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'codigo', header: 'Código', render: (row) => <span className="text-xs text-muted-foreground">{row.codigo}</span> },
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

/**
 * Mantenedor de SubcategoriaFormulario, acotado a un área (hoy PREVENCION). Cada
 * subcategoría cuelga de una categoría del área; el alta exige elegir la categoría
 * padre. Permisos: TOTAL en la función Categorías del área.
 */
export function SubcategoriasMaintainer({ area = 'PREVENCION' }: { area?: 'PREVENCION' | 'TECNICA' }) {
  const { data: areasResp, isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('nucleo/areas').json<{ data: Area[] }>(),
  })
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })

  const areaObj = (areasResp?.data ?? []).find((a) => a.codigo === area)
  const puedeTotal = me?.esAdmin === true || me?.permisos?.[CAT_FUNCION[area]] === 'TOTAL'

  // Categorías del área (picker de padre). Solo cuando ya conocemos el área.
  const { data: catResp } = useQuery({
    queryKey: ['categorias-opciones', areaObj?.id],
    queryFn: () =>
      api
        .get('nucleo/categorias-formulario/opciones', { searchParams: { areaId: String(areaObj!.id) } })
        .json<{ data: Opcion[] }>(),
    enabled: !!areaObj,
  })
  const categorias = catResp?.data ?? []
  const categoriaOptions: CrudFieldOption[] = categorias.map((c) => ({ value: String(c.id), label: c.nombre }))

  if (isLoading || !areaObj) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    )
  }

  // Puede crear solo si administra el área y existe al menos una categoría padre.
  const puedeCrear = puedeTotal && categoriaOptions.length > 0

  return (
    <CrudMaintainer<Subcategoria, FormValues>
      titulo={`Subcategorías · ${areaObj.nombre}`}
      descripcion="Nivel anidado bajo la categoría. En Prevención refina la clasificación de hallazgos (categoría › subcategoría)."
      endpoint="nucleo/subcategorias-formulario"
      queryKey={`subcategorias-${area}`}
      extraParams={{ areaId: String(areaObj.id) }}
      columns={columns}
      fields={[
        { name: 'categoriaId', label: 'Categoría', type: 'select', options: categoriaOptions, soloAlta: true },
        { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Casco' },
        { name: 'activo', label: 'Activa', type: 'checkbox' },
      ]}
      schema={schema}
      defaultValues={{ categoriaId: categorias[0]?.id ?? 0, nombre: '', activo: true }}
      toFormValues={(row) => ({ categoriaId: row.categoriaId, nombre: row.nombre, activo: row.activo })}
      puedeCrear={puedeCrear}
      puedeEditar={() => puedeTotal}
      searchPlaceholder="Buscar subcategoría…"
      emptyMessage={categoriaOptions.length === 0 ? 'Crea primero una categoría de Prevención.' : 'No hay subcategorías.'}
    />
  )
}
