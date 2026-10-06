'use client'

import { z } from 'zod'

import { cn } from 'cn'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import {
  CrudMaintainer,
  type CrudColumn,
  type CrudFieldOption,
} from '@/components/shared/crud-maintainer'

interface Perfil extends Record<string, unknown> {
  id: number
  nombre: string
  nivelPrevencion: string
  nivelTecnica: string
  usuariosActivos: number
  creadoEn: string
}

const NIVELES: CrudFieldOption[] = [
  { value: 'SIN_ACCESO', label: 'Sin acceso' },
  { value: 'LECTURA', label: 'Lectura' },
  { value: 'TOTAL', label: 'Total' },
]

const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  nivelPrevencion: z.enum(['SIN_ACCESO', 'LECTURA', 'TOTAL']),
  nivelTecnica: z.enum(['SIN_ACCESO', 'LECTURA', 'TOTAL']),
})
type FormValues = z.infer<typeof schema>

function NivelBadge({ nivel }: { nivel: string }) {
  const label = NIVELES.find((n) => n.value === nivel)?.label ?? nivel
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        nivel === 'TOTAL'
          ? 'bg-ok-bg text-ok-fg'
          : nivel === 'LECTURA'
            ? 'bg-secondary text-foreground'
            : 'bg-warn-bg text-warn-fg'
      )}
    >
      {label}
    </span>
  )
}

const columns: CrudColumn<Perfil>[] = [
  { key: 'nombre', header: 'Perfil', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'nivelPrevencion', header: 'Prevención', render: (row) => <NivelBadge nivel={row.nivelPrevencion} /> },
  { key: 'nivelTecnica', header: 'Técnica', render: (row) => <NivelBadge nivel={row.nivelTecnica} /> },
  {
    key: 'usuariosActivos',
    header: 'Usuarios',
    render: (row) => <span className="tabular-nums text-muted-foreground">{row.usuariosActivos}</span>,
  },
]

export default function PerfilesPage() {
  // La página la protege requireAdmin en el backend; el front muestra los
  // controles siempre y el API rechaza (403) si no es administrador.
  return (
    <>
      <BreadcrumbBar backHref="/usuarios" trail="Usuarios" current="Perfiles" />
      <main className="flex-1 p-8">
        <CrudMaintainer<Perfil, FormValues>
          titulo="Perfiles"
          descripcion="Nivel de acceso por Área. El nivel gobierna quién crea/elimina (TOTAL) vs. solo ve y completa (LECTURA)."
          endpoint="nucleo/perfiles"
          queryKey="perfiles"
          columns={columns}
          fields={[
            { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Prevencionista de obra' },
            { name: 'nivelPrevencion', label: 'Nivel en Prevención', type: 'select', options: NIVELES },
            { name: 'nivelTecnica', label: 'Nivel en Técnica', type: 'select', options: NIVELES },
          ]}
          schema={schema}
          defaultValues={{ nombre: '', nivelPrevencion: 'SIN_ACCESO', nivelTecnica: 'SIN_ACCESO' }}
          toFormValues={(row) => ({
            nombre: row.nombre,
            nivelPrevencion: row.nivelPrevencion as FormValues['nivelPrevencion'],
            nivelTecnica: row.nivelTecnica as FormValues['nivelTecnica'],
          })}
          searchPlaceholder="Buscar perfil…"
          emptyMessage="No hay perfiles."
        />
      </main>
    </>
  )
}
