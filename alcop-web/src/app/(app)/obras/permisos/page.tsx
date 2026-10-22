'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Obra {
  id: number
  codigo: string
  nombre: string
}
interface Usuario {
  id: string
  nombre: string
  email: string
}
interface Acceso {
  id: number
  usuario: { id: string; nombre: string; email: string }
}
interface Titular {
  id: number
  rolObra: 'ADMINISTRADOR' | 'JEFE_DE_TERRENO' | 'PREVENCIONISTA'
  usuario: { id: string; nombre: string; email: string }
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador', hint: 'Recibe las notificaciones de la obra.' },
  { value: 'JEFE_DE_TERRENO', label: 'Jefe de Terreno', hint: 'Requiere acceso a Técnica en su perfil.' },
  { value: 'PREVENCIONISTA', label: 'Prevencionista', hint: 'Requiere acceso a Prevención en su perfil.' },
] as const

export default function PermisosObraPage() {
  const queryClient = useQueryClient()
  const [obraId, setObraId] = useState<number | null>(null)

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []
  const selectedObraId = obraId ?? obras[0]?.id ?? null

  const { data: usuariosResp } = useQuery({
    queryKey: ['usuarios', { all: true }],
    queryFn: () => api.get('usuarios', { searchParams: { limit: '100' } }).json<{ data: Usuario[] }>(),
  })
  const usuarios = usuariosResp?.data ?? []

  const { data: accResp, isLoading: cargandoAccesos } = useQuery({
    queryKey: ['obra-accesos', selectedObraId],
    queryFn: () => api.get(`nucleo/obras/${selectedObraId}/accesos`).json<{ data: Acceso[] }>(),
    enabled: selectedObraId !== null,
  })
  const accesos = accResp?.data ?? []

  const { data: titResp, isLoading: cargandoTitulares } = useQuery({
    queryKey: ['obra-titulares', selectedObraId],
    queryFn: () => api.get(`nucleo/obras/${selectedObraId}/titulares`).json<{ data: Titular[] }>(),
    enabled: selectedObraId !== null,
  })
  const titulares = titResp?.data ?? []

  const invalidarAccesos = () => queryClient.invalidateQueries({ queryKey: ['obra-accesos', selectedObraId] })
  const invalidarTitulares = () => queryClient.invalidateQueries({ queryKey: ['obra-titulares', selectedObraId] })

  const darAcceso = useMutation({
    mutationFn: (usuarioId: string) => api.post(`nucleo/obras/${selectedObraId}/accesos`, { json: { usuarioId } }).json(),
    onSuccess: () => {
      toast.success('Acceso concedido.')
      invalidarAccesos()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo conceder el acceso.'),
  })

  const quitarAcceso = useMutation({
    mutationFn: (accesoId: number) => api.delete(`nucleo/obras/${selectedObraId}/accesos/${accesoId}`),
    onSuccess: () => {
      toast.success('Acceso revocado.')
      invalidarAccesos()
      invalidarTitulares() // revocar acceso también retira sus titularidades
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo revocar el acceso.'),
  })

  const asignarTitular = useMutation({
    mutationFn: (body: { rolObra: string; usuarioId: string }) =>
      api.post(`nucleo/obras/${selectedObraId}/titulares`, { json: body }).json(),
    onSuccess: () => {
      toast.success('Titular asignado.')
      invalidarTitulares()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo asignar.'),
  })

  const quitarTitular = useMutation({
    mutationFn: (titularId: number) => api.delete(`nucleo/obras/${selectedObraId}/titulares/${titularId}`),
    onSuccess: () => {
      toast.success('Titular quitado.')
      invalidarTitulares()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const idsConAcceso = new Set(accesos.map((a) => a.usuario.id))
  const sinAcceso = usuarios.filter((u) => !idsConAcceso.has(u.id))
  const faltan = ROLES.filter((r) => !titulares.some((t) => t.rolObra === r.value)).length

  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Accesos" current="Permisos Obra" />
      <main className="flex-1 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Permisos Obra</h1>
          <p className="text-sm text-muted-foreground">
            Primero da acceso a los usuarios de la obra; luego asigna un titular por rol, elegido entre quienes tienen acceso.
          </p>
        </div>

        <div className="mt-6 max-w-sm space-y-1.5">
          <label className="text-xs font-semibold tracking-[0.12em] text-label">OBRA</label>
          <Select
            value={selectedObraId != null ? String(selectedObraId) : undefined}
            onValueChange={(v) => v != null && setObraId(Number(v))}
            items={Object.fromEntries(obras.map((o) => [String(o.id), `${o.nombre} · ${o.codigo}`]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una obra…" />
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.nombre} · {o.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Usuarios con acceso */}
        <section className="mt-8 max-w-2xl">
          <h2 className="text-sm font-bold text-foreground">Usuarios con acceso</h2>
          <p className="mt-1 text-xs text-muted-foreground">Quienes pueden entrar a esta obra. Revocar el acceso también retira sus titularidades.</p>
          <div className="mt-3 rounded-xl border border-border bg-card p-5">
            <div className="space-y-2">
              {cargandoAccesos ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : accesos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nadie tiene acceso todavía.</p>
              ) : (
                accesos.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{a.usuario.nombre}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.usuario.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Revocar acceso"
                      disabled={quitarAcceso.isPending}
                      onClick={() => quitarAcceso.mutate(a.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3">
              <Select
                value={undefined}
                onValueChange={(usuarioId) => {
                  if (selectedObraId != null && typeof usuarioId === 'string') darAcceso.mutate(usuarioId)
                }}
                items={Object.fromEntries(sinAcceso.map((u) => [u.id, u.nombre]))}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Dar acceso a un usuario…" />
                </SelectTrigger>
                <SelectContent>
                  {sinAcceso.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Titular por rol */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">Titular por rol</h2>
            {faltan > 0 ? (
              <span className="text-xs font-medium text-warn-fg">Faltan {faltan} rol(es) por asignar.</span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {ROLES.map((rol) => {
              const titular = titulares.find((t) => t.rolObra === rol.value) ?? null
              return (
                <div key={rol.value} className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <h3 className="text-sm font-bold text-foreground">{rol.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{rol.hint}</p>

                  <div className="mt-4">
                    {cargandoTitulares ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : titular ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{titular.usuario.nombre}</div>
                          <div className="truncate text-xs text-muted-foreground">{titular.usuario.email}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Quitar titular"
                          disabled={quitarTitular.isPending}
                          onClick={() => quitarTitular.mutate(titular.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin asignar.</p>
                    )}
                  </div>

                  <div className="mt-3">
                    <Select
                      value={undefined}
                      onValueChange={(usuarioId) => {
                        if (selectedObraId != null && typeof usuarioId === 'string') {
                          asignarTitular.mutate({ rolObra: rol.value, usuarioId })
                        }
                      }}
                      items={Object.fromEntries(accesos.map((a) => [a.usuario.id, a.usuario.nombre]))}
                    >
                      <SelectTrigger className="w-full" disabled={accesos.length === 0}>
                        <SelectValue placeholder={accesos.length === 0 ? 'Da acceso primero' : titular ? 'Cambiar titular…' : 'Asignar titular…'} />
                      </SelectTrigger>
                      <SelectContent>
                        {accesos.map((a) => (
                          <SelectItem key={a.usuario.id} value={a.usuario.id}>
                            {a.usuario.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}
