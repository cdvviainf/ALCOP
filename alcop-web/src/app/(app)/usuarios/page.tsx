'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import {
  CrudMaintainer,
  type CrudColumn,
  type CrudFieldOption,
} from '@/components/shared/crud-maintainer'

interface PerfilLite {
  id: number
  nombre: string
}

interface Usuario extends Record<string, unknown> {
  id: string
  nombre: string
  email: string
  activo: boolean
  esAdmin: boolean
  perfil: { id: number; nombre: string } | null
  creadoEn: string
}

// Schema laxo compartido alta/edición: email/password solo se muestran en alta
// (soloAlta) y el backend valida estrictamente el alta (crearUsuarioSchema).
const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  esAdmin: z.boolean(),
  perfilId: z.coerce.number().int().positive().optional(),
  activo: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const columns: CrudColumn<Usuario>[] = [
  { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'email', header: 'Email', render: (row) => <span className="text-muted-foreground">{row.email}</span> },
  {
    key: 'perfil',
    header: 'Perfil',
    render: (row) =>
      row.esAdmin ? (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
          ADMINISTRADOR
        </span>
      ) : (
        <span className="text-muted-foreground">{row.perfil?.nombre ?? '—'}</span>
      ),
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
        {row.activo ? 'ACTIVO' : 'INACTIVO'}
      </span>
    ),
  },
]

export default function UsuariosPage() {
  const { data: perfilesResp, isLoading } = useQuery({
    queryKey: ['perfiles'],
    queryFn: () => api.get('nucleo/perfiles', { searchParams: { limit: '100' } }).json<{ data: PerfilLite[] }>(),
  })
  const perfiles = perfilesResp?.data ?? []
  const perfilOptions: CrudFieldOption[] = perfiles.map((p) => ({ value: String(p.id), label: p.nombre }))

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
          <CrudMaintainer<Usuario, FormValues>
            titulo="Usuarios"
            descripcion="Altas, perfiles y estado. El alta la realiza un administrador (el email es el login y no se edita)."
            endpoint="usuarios"
            queryKey="usuarios"
            columns={columns}
            fields={[
              { name: 'nombre', label: 'Nombre', placeholder: 'Nombre y apellido' },
              { name: 'email', label: 'Email (login)', type: 'text', placeholder: 'persona@alcop.cl', soloAlta: true },
              {
                name: 'password',
                label: 'Contraseña',
                type: 'password',
                description: 'Mínimo 8 caracteres.',
                soloAlta: true,
              },
              {
                name: 'esAdmin',
                label: 'Administrador (acceso total)',
                type: 'checkbox',
                description: 'Si se marca, el perfil se ignora.',
              },
              { name: 'perfilId', label: 'Perfil', type: 'select', options: perfilOptions },
              { name: 'activo', label: 'Activo', type: 'checkbox' },
            ]}
            schema={schema}
            defaultValues={{
              nombre: '',
              email: '',
              password: '',
              esAdmin: false,
              perfilId: perfiles[0]?.id ?? 0,
              activo: true,
            }}
            toFormValues={(row) => ({
              nombre: row.nombre,
              email: row.email,
              password: '',
              esAdmin: row.esAdmin,
              perfilId: row.perfil?.id ?? perfiles[0]?.id ?? 0,
              activo: row.activo,
            })}
            rowLabel={(row) => row.nombre}
            searchPlaceholder="Buscar por nombre o email…"
            emptyMessage="No hay usuarios."
          />
        )}
      </main>
    </>
  )
}
