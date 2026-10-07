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
  codigo: string
  nombre: string
}
interface Usuario {
  id: string
  nombre: string
  email: string
}
interface Titular {
  id: number
  rolObra: 'ADMINISTRADOR' | 'JEFE_DE_TERRENO' | 'PREVENCIONISTA'
  usuario: { id: string; nombre: string; email: string }
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador', hint: 'Recibe las notificaciones de la obra.' },
  { value: 'JEFE_DE_TERRENO', label: 'Jefe de Terreno', hint: 'Requiere acceso a Técnica.' },
  { value: 'PREVENCIONISTA', label: 'Prevencionista', hint: 'Requiere acceso a Prevención.' },
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

  const { data: titResp, isLoading } = useQuery({
    queryKey: ['obra-titulares', selectedObraId],
    queryFn: () => api.get(`nucleo/obras/${selectedObraId}/titulares`).json<{ data: Titular[] }>(),
    enabled: selectedObraId !== null,
  })
  const titulares = titResp?.data ?? []

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['obra-titulares', selectedObraId] })

  const asignar = useMutation({
    mutationFn: (body: { rolObra: string; usuarioId: string }) =>
      api.post(`nucleo/obras/${selectedObraId}/titulares`, { json: body }).json(),
    onSuccess: () => {
      toast.success('Titular asignado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo asignar.'),
  })

  const quitar = useMutation({
    mutationFn: (titularId: number) => api.delete(`nucleo/obras/${selectedObraId}/titulares/${titularId}`),
    onSuccess: () => {
      toast.success('Titular quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const faltan = ROLES.filter((r) => !titulares.some((t) => t.rolObra === r.value)).length

  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Accesos" current="Permisos Obra" />
      <main className="flex-1 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Permisos Obra</h1>
          <p className="text-sm text-muted-foreground">
            Asociación de usuarios por obra (titulares de notificación). Se permite más de un usuario por rol.
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
          {faltan > 0 ? (
            <p className="text-xs font-medium text-warn-fg">Faltan {faltan} rol(es) por asignar en esta obra.</p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ROLES.map((rol) => {
            const asignados = titulares.filter((t) => t.rolObra === rol.value)
            const yaIds = new Set(asignados.map((t) => t.usuario.id))
            const disponibles = usuarios.filter((u) => !yaIds.has(u.id))
            return (
              <div
                key={rol.value}
                className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <h2 className="text-sm font-bold text-foreground">{rol.label}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{rol.hint}</p>

                <div className="mt-4 space-y-2">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : asignados.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin asignar.</p>
                  ) : (
                    asignados.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{t.usuario.nombre}</div>
                          <div className="truncate text-xs text-muted-foreground">{t.usuario.email}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Quitar"
                          disabled={quitar.isPending}
                          onClick={() => quitar.mutate(t.id)}
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
                      if (selectedObraId != null && typeof usuarioId === 'string') {
                        asignar.mutate({ rolObra: rol.value, usuarioId })
                      }
                    }}
                    items={Object.fromEntries(disponibles.map((u) => [u.id, u.nombre]))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Agregar usuario…" />
                    </SelectTrigger>
                    <SelectContent>
                      {disponibles.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
