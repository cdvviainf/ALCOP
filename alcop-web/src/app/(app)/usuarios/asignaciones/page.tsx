'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Obra {
  id: number
  nombre: string
  comuna: string | null
}
interface Usuario {
  id: string
  nombre: string
  email: string
}
interface Asignacion {
  id: number
  obraId: number
  rolObra: 'ADMINISTRADOR' | 'JEFE_DE_TERRENO' | 'PREVENCIONISTA'
  usuario: { id: string; nombre: string; email: string }
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador', hint: 'Recibe las notificaciones de la obra.' },
  { value: 'JEFE_DE_TERRENO', label: 'Jefe de Terreno', hint: 'Requiere acceso a Técnica.' },
  { value: 'PREVENCIONISTA', label: 'Prevencionista', hint: 'Requiere acceso a Prevención.' },
] as const

export default function AsignacionesPage() {
  const queryClient = useQueryClient()
  // `obraId` es la selección explícita del usuario; si aún no eligió, cae a la
  // primera obra. Derivado (sin setState en efecto) para cumplir el lint de
  // React 19 (react-hooks/set-state-in-effect — QA-C-005).
  const [obraId, setObraId] = useState<number | null>(null)

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []

  const { data: usuariosResp } = useQuery({
    queryKey: ['usuarios', { all: true }],
    queryFn: () => api.get('usuarios', { searchParams: { limit: '100' } }).json<{ data: Usuario[] }>(),
  })
  const usuarios = usuariosResp?.data ?? []

  const selectedObraId = obraId ?? obras[0]?.id ?? null

  const { data: asignResp, isLoading: cargandoAsign } = useQuery({
    queryKey: ['usuario-obras', selectedObraId],
    queryFn: () =>
      api
        .get('nucleo/usuario-obras', { searchParams: { obraId: String(selectedObraId) } })
        .json<{ data: Asignacion[] }>(),
    enabled: selectedObraId !== null,
  })
  const asignaciones = asignResp?.data ?? []

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['usuario-obras', selectedObraId] })

  const asignar = useMutation({
    mutationFn: (body: { obraId: number; rolObra: string; usuarioId: string }) =>
      api.post('nucleo/usuario-obras', { json: body }).json(),
    onSuccess: () => {
      toast.success('Titular asignado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo asignar.'),
  })

  const quitar = useMutation({
    mutationFn: (id: number) => api.delete(`nucleo/usuario-obras/${id}`),
    onSuccess: () => {
      toast.success('Asignación quitada.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const titularDe = (rol: string) => asignaciones.find((a) => a.rolObra === rol)

  return (
    <>
      <BreadcrumbBar backHref="/usuarios" trail="Usuarios" current="Asignaciones por obra" />
      <main className="flex-1 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Asignaciones por obra</h1>
          <p className="text-sm text-muted-foreground">
            Un titular por rol en cada obra. Al cambiar el titular se reemplaza al anterior.
          </p>
        </div>

        <div className="mt-6 max-w-sm space-y-1.5">
          <label className="text-xs font-semibold tracking-[0.12em] text-label">OBRA</label>
          <Select
            value={selectedObraId != null ? String(selectedObraId) : undefined}
            onValueChange={(v) => v != null && setObraId(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una obra…" />
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.nombre}
                  {o.comuna ? ` · ${o.comuna}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ROLES.map((rol) => {
            const titular = titularDe(rol.value)
            return (
              <div
                key={rol.value}
                className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">{rol.label}</h2>
                  {titular ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar"
                      disabled={quitar.isPending}
                      onClick={() => quitar.mutate(titular.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{rol.hint}</p>

                <div className="mt-4">
                  {cargandoAsign ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Select
                      value={titular?.usuario.id ?? undefined}
                      onValueChange={(usuarioId) => {
                        if (selectedObraId != null && typeof usuarioId === 'string') {
                          asignar.mutate({ obraId: selectedObraId, rolObra: rol.value, usuarioId })
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {titular ? (
                  <p className="mt-2 text-xs text-muted-foreground">{titular.usuario.email}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
