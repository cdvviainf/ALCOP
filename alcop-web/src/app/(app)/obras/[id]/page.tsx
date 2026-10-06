'use client'

import { useParams } from 'next/navigation'
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

interface Me {
  perfil: { nivelPrevencion: string; nivelTecnica: string }
}
interface Obra {
  id: number
  codigo: string
  nombre: string
  estado: string
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

export default function ObraTitularesPage() {
  const params = useParams<{ id: string }>()
  const obraId = Number(params.id)
  const queryClient = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const esAdmin = me?.perfil.nivelPrevencion === 'TOTAL' && me?.perfil.nivelTecnica === 'TOTAL'

  const { data: obra } = useQuery({
    queryKey: ['obra', obraId],
    queryFn: () => api.get(`nucleo/obras/${obraId}`).json<Obra>(),
    enabled: Number.isFinite(obraId),
  })

  // OBR-009: límite de 100 usuarios sin búsqueda — suficiente para Etapa 1
  // (~24 usuarios). Agregar búsqueda/paginación al crecer la base (ver spec §10).
  const { data: usuariosResp } = useQuery({
    queryKey: ['usuarios', { all: true }],
    queryFn: () => api.get('usuarios', { searchParams: { limit: '100' } }).json<{ data: Usuario[] }>(),
    enabled: esAdmin,
  })
  const usuarios = usuariosResp?.data ?? []

  const { data: titResp, isLoading } = useQuery({
    queryKey: ['obra-titulares', obraId],
    queryFn: () => api.get(`nucleo/obras/${obraId}/titulares`).json<{ data: Titular[] }>(),
    enabled: Number.isFinite(obraId),
  })
  const titulares = titResp?.data ?? []

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['obra-titulares', obraId] })

  const asignar = useMutation({
    mutationFn: (body: { rolObra: string; usuarioId: string }) =>
      api.post(`nucleo/obras/${obraId}/titulares`, { json: body }).json(),
    onSuccess: () => {
      toast.success('Titular asignado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo asignar.'),
  })

  const quitar = useMutation({
    mutationFn: (titularId: number) => api.delete(`nucleo/obras/${obraId}/titulares/${titularId}`),
    onSuccess: () => {
      toast.success('Titular quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const faltan = ROLES.filter((r) => !titulares.some((t) => t.rolObra === r.value)).length

  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Obras" current={obra?.nombre ?? 'Titulares'} />
      <main className="flex-1 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {obra ? obra.nombre : 'Obra'}{' '}
            {obra ? <span className="font-mono text-base text-muted-foreground">· {obra.codigo}</span> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            Titulares de notificación. Se permite más de un usuario por rol.
            {faltan > 0 ? (
              <span className="ml-1 font-medium text-warn-fg">Faltan {faltan} rol(es) por asignar.</span>
            ) : null}
          </p>
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
                        {esAdmin ? (
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
                        ) : null}
                      </div>
                    ))
                  )}
                </div>

                {esAdmin ? (
                  <div className="mt-3">
                    <Select
                      value={undefined}
                      onValueChange={(usuarioId) => {
                        if (typeof usuarioId === 'string') {
                          asignar.mutate({ rolObra: rol.value, usuarioId })
                        }
                      }}
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
                ) : null}
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
