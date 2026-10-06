'use client'

import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import { CrudMaintainer, type CrudColumn } from '@/components/shared/crud-maintainer'

interface Me {
  perfil: { nivelPrevencion: string; nivelTecnica: string }
}

interface NivelRiesgo extends Record<string, unknown> {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  creadoEn: string
}

// `codigo` lo genera el backend (slug del nombre); el form solo pide los campos editables.
const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  orden: z.coerce.number().int().min(0, 'El orden no puede ser negativo'),
  activo: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const columns: CrudColumn<NivelRiesgo>[] = [
  {
    key: 'orden',
    header: 'Orden',
    render: (row) => <span className="tabular-nums text-muted-foreground">{row.orden}</span>,
  },
  { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-medium">{row.nombre}</span> },
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
        {row.activo ? 'ACTIVO' : 'INACTIVO'}
      </span>
    ),
  },
]

export default function NivelesRiesgoPage() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })

  const puedeEditar = me?.perfil.nivelPrevencion === 'TOTAL'

  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Prevención" current="Niveles de riesgo" />
      <main className="flex-1 p-8">
        <CrudMaintainer<NivelRiesgo, FormValues>
          titulo="Niveles de riesgo"
          descripcion="Severidad de los hallazgos de prevención (Alto, Medio, Observación…)."
          endpoint="prevencion/niveles-riesgo"
          queryKey="niveles-riesgo"
          columns={columns}
          fields={[
            { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Alto' },
            {
              name: 'orden',
              label: 'Orden',
              type: 'number',
              description: 'Posición en la lista (menor aparece primero).',
            },
            { name: 'activo', label: 'Activo', type: 'checkbox' },
          ]}
          schema={schema}
          defaultValues={{ nombre: '', orden: 0, activo: true }}
          toFormValues={(row) => ({ nombre: row.nombre, orden: row.orden, activo: row.activo })}
          puedeEditar={puedeEditar}
          searchPlaceholder="Buscar nivel…"
          emptyMessage="No hay niveles de riesgo."
        />
      </main>
    </>
  )
}
