'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}
interface Obra {
  id: number
  codigo: string
  nombre: string
}
interface TipoLote {
  id: number
  codigo: string
  nombre: string
}
interface ObraLote {
  id: number
  cantidad: number
  tipoLote: { id: number; codigo: string; nombre: string; activo: boolean }
}
interface FormularioAplicable {
  id: number
  codigo: string
  nombre: string
  areaId: number
  procedimientos: Array<{ id: number; codigo: string; nombre: string }>
  tiposLote: Array<{ id: number; nombre: string }>
}

export default function LotesObraPage() {
  const queryClient = useQueryClient()
  const [obraId, setObraId] = useState<number | null>(null)
  const [nuevoTipo, setNuevoTipo] = useState<string | undefined>(undefined)
  const [nuevaCantidad, setNuevaCantidad] = useState('1')

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['OBRAS'] === 'TOTAL'

  const { data: obrasResp } = useQuery({
    queryKey: ['obras', { all: true }],
    queryFn: () => api.get('nucleo/obras', { searchParams: { limit: '100' } }).json<{ data: Obra[] }>(),
  })
  const obras = obrasResp?.data ?? []
  const selectedObraId = obraId ?? obras[0]?.id ?? null

  const { data: tiposResp } = useQuery({
    queryKey: ['tipos-lote-opciones'],
    queryFn: () => api.get('nucleo/tipos-lote/opciones').json<{ data: TipoLote[] }>(),
  })
  const tipos = tiposResp?.data ?? []

  const { data: lotesResp, isLoading } = useQuery({
    queryKey: ['obra-lotes', selectedObraId],
    queryFn: () => api.get(`nucleo/obras/${selectedObraId}/lotes`).json<{ data: ObraLote[] }>(),
    enabled: selectedObraId !== null,
  })
  const lotes = lotesResp?.data ?? []

  const { data: aplicablesResp } = useQuery({
    queryKey: ['obra-formularios-aplicables', selectedObraId],
    queryFn: () =>
      api.get(`nucleo/obras/${selectedObraId}/formularios-aplicables`).json<{ data: FormularioAplicable[] }>(),
    enabled: selectedObraId !== null,
  })
  const aplicables = aplicablesResp?.data ?? []

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['obra-lotes', selectedObraId] })
    queryClient.invalidateQueries({ queryKey: ['obra-formularios-aplicables', selectedObraId] })
  }

  const agregar = useMutation({
    mutationFn: (body: { tipoLoteId: number; cantidad: number }) =>
      api.post(`nucleo/obras/${selectedObraId}/lotes`, { json: body }).json(),
    onSuccess: () => {
      toast.success('Lote agregado.')
      setNuevoTipo(undefined)
      setNuevaCantidad('1')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo agregar.'),
  })

  const actualizar = useMutation({
    mutationFn: ({ loteId, cantidad }: { loteId: number; cantidad: number }) =>
      api.patch(`nucleo/obras/${selectedObraId}/lotes/${loteId}`, { json: { cantidad } }).json(),
    onSuccess: () => {
      toast.success('Cantidad actualizada.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo actualizar.'),
  })

  const quitar = useMutation({
    mutationFn: (loteId: number) => api.delete(`nucleo/obras/${selectedObraId}/lotes/${loteId}`),
    onSuccess: () => {
      toast.success('Lote quitado.')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo quitar.'),
  })

  const yaIds = new Set(lotes.map((l) => l.tipoLote.id))
  const tiposDisponibles = tipos.filter((t) => !yaIds.has(t.id))

  function handleAgregar() {
    const cantidad = Number(nuevaCantidad)
    if (!nuevoTipo || !Number.isInteger(cantidad) || cantidad < 1) {
      toast.error('Selecciona un tipo de lote y una cantidad válida (≥ 1).')
      return
    }
    agregar.mutate({ tipoLoteId: Number(nuevoTipo), cantidad })
  }

  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Configuración" current="Lotes de Obra" />
      <main className="flex-1 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Lotes de Obra</h1>
          <p className="text-sm text-muted-foreground">
            Composición de la obra por tipo de lote (cantidad). Determina qué procedimientos y formularios de control aplican.
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Composición de lotes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-foreground">Composición</h2>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : lotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Esta obra aún no tiene lotes configurados.</p>
              ) : (
                lotes.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {l.tipoLote.nombre}
                        {!l.tipoLote.activo ? <span className="ml-2 text-xs text-warn-fg">(inactivo)</span> : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{l.tipoLote.codigo}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        defaultValue={l.cantidad}
                        disabled={!puedeEditar}
                        className="h-9 w-20"
                        onBlur={(e) => {
                          const cantidad = Number(e.target.value)
                          if (Number.isInteger(cantidad) && cantidad >= 1 && cantidad !== l.cantidad) {
                            actualizar.mutate({ loteId: l.id, cantidad })
                          } else {
                            e.target.value = String(l.cantidad)
                          }
                        }}
                      />
                      {puedeEditar ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Quitar"
                          disabled={quitar.isPending}
                          onClick={() => quitar.mutate(l.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            {puedeEditar ? (
              <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold tracking-[0.12em] text-label">TIPO DE LOTE</label>
                  <Select
                    value={nuevoTipo}
                    onValueChange={(v) => typeof v === 'string' && setNuevoTipo(v)}
                    items={Object.fromEntries(tiposDisponibles.map((t) => [String(t.id), t.nombre]))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDisponibles.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.nombre} · {t.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1.5">
                  <label className="text-xs font-semibold tracking-[0.12em] text-label">CANTIDAD</label>
                  <Input
                    type="number"
                    min={1}
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Button onClick={handleAgregar} disabled={agregar.isPending} className="h-10">
                  {agregar.isPending ? <Loader2 className="animate-spin" /> : <Plus strokeWidth={2.5} />}
                  Agregar
                </Button>
              </div>
            ) : null}
          </div>

          {/* Formularios de control aplicables (derivado) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-foreground">Formularios de control aplicables</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Derivado de los lotes → procedimientos → formularios. Se recalcula al cambiar la composición.
            </p>
            <div className="mt-4 space-y-2">
              {aplicables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hay formularios aplicables. Configura lotes con procedimientos que apunten a formularios.
                </p>
              ) : (
                aplicables.map((f) => (
                  <div key={f.id} className="rounded-lg border border-border px-3 py-2.5">
                    <div className="text-sm font-medium text-foreground">{f.nombre}</div>
                    <div className="font-mono text-xs text-muted-foreground">{f.codigo}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {f.procedimientos.map((p) => (
                        <Badge key={p.id} variant="secondary" className="text-[10px]">
                          {p.codigo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
