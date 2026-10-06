'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Users } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import {
  CrudMaintainer,
  type CrudColumn,
  type CrudFieldOption,
} from '@/components/shared/crud-maintainer'

interface Me {
  perfil: { nivelPrevencion: string; nivelTecnica: string }
}

interface Obra extends Record<string, unknown> {
  id: number
  codigo: string
  nombre: string
  mandante: string | null
  direccion: string | null
  comuna: string | null
  fechaInicio: string | null
  fechaTerminoEstimada: string | null
  estado: 'SIN_INICIAR' | 'EN_EJECUCION' | 'SUSPENDIDA' | 'TERMINADA'
  creadoEn: string
}

const ESTADOS: CrudFieldOption[] = [
  { value: 'SIN_INICIAR', label: 'Sin iniciar' },
  { value: 'EN_EJECUCION', label: 'En ejecución' },
  { value: 'SUSPENDIDA', label: 'Suspendida' },
  { value: 'TERMINADA', label: 'Terminada' },
]

// Campos opcionales: '' -> null, para poder limpiarlos (el backend acepta null
// y coacciona las fechas con z.coerce.date()). OBR-005.
const opcText = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().trim().min(1).nullable().optional()
)
const opcFecha = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().nullable().optional()
)

const schema = z
  .object({
    codigo: z.string().trim().min(1, 'El código es obligatorio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    mandante: opcText,
    direccion: opcText,
    comuna: opcText,
    estado: z.enum(['SIN_INICIAR', 'EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA']),
    fechaInicio: opcFecha,
    fechaTerminoEstimada: opcFecha,
  })
  // El término no puede ser anterior al inicio (OBR-004).
  .refine(
    (d) => !d.fechaInicio || !d.fechaTerminoEstimada || new Date(d.fechaTerminoEstimada) >= new Date(d.fechaInicio),
    { message: 'El término no puede ser anterior al inicio.', path: ['fechaTerminoEstimada'] }
  )
type FormValues = z.infer<typeof schema>

function EstadoBadge({ estado }: { estado: Obra['estado'] }) {
  const label = ESTADOS.find((e) => e.value === estado)?.label ?? estado
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        estado === 'EN_EJECUCION'
          ? 'bg-ok-bg text-ok-fg'
          : estado === 'SUSPENDIDA'
            ? 'bg-warn-bg text-warn-fg'
            : 'bg-secondary text-foreground'
      )}
    >
      {label.toUpperCase()}
    </span>
  )
}

const columns: CrudColumn<Obra>[] = [
  { key: 'codigo', header: 'Código', render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.codigo}</span> },
  { key: 'nombre', header: 'Obra', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'comuna', header: 'Comuna', render: (row) => <span className="text-muted-foreground">{row.comuna ?? '—'}</span> },
  { key: 'estado', header: 'Estado', render: (row) => <EstadoBadge estado={row.estado} /> },
  {
    key: '__titulares',
    header: '',
    render: (row) => (
      <Link
        href={`/obras/${row.id}`}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-secondary"
      >
        <Users className="size-3.5" />
        Titulares
      </Link>
    ),
  },
]

function fechaInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export default function ObrasPage() {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const esAdmin = me?.perfil.nivelPrevencion === 'TOTAL' && me?.perfil.nivelTecnica === 'TOTAL'

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <CrudMaintainer<Obra, FormValues>
            titulo="Obras"
            descripcion="Raíz del sistema. Código único, estado y titulares de notificación por obra."
            endpoint="nucleo/obras"
            queryKey="obras"
            columns={columns}
            fields={[
              { name: 'codigo', label: 'Código', placeholder: 'Ej. MPR' },
              { name: 'nombre', label: 'Nombre', placeholder: 'Nombre de la obra' },
              { name: 'mandante', label: 'Mandante' },
              { name: 'direccion', label: 'Dirección' },
              { name: 'comuna', label: 'Comuna' },
              { name: 'estado', label: 'Estado', type: 'select', options: ESTADOS, soloEdicion: true },
              { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date' },
              { name: 'fechaTerminoEstimada', label: 'Término estimado', type: 'date' },
            ]}
            schema={schema}
            defaultValues={{
              codigo: '',
              nombre: '',
              mandante: '',
              direccion: '',
              comuna: '',
              estado: 'SIN_INICIAR',
              fechaInicio: '',
              fechaTerminoEstimada: '',
            }}
            toFormValues={(row) => ({
              codigo: row.codigo,
              nombre: row.nombre,
              mandante: row.mandante ?? '',
              direccion: row.direccion ?? '',
              comuna: row.comuna ?? '',
              estado: row.estado,
              fechaInicio: fechaInput(row.fechaInicio),
              fechaTerminoEstimada: fechaInput(row.fechaTerminoEstimada),
            })}
            rowLabel={(row) => row.nombre}
            puedeEditar={esAdmin}
            searchPlaceholder="Buscar por nombre o código…"
            emptyMessage="No hay obras."
          />
        )}
      </main>
    </>
  )
}
