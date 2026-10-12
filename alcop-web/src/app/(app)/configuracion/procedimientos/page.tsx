'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Link2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VinculosManager } from '@/components/shared/vinculos-manager'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}

interface Procedimiento {
  id: number
  codigo: string
  nombre: string
  vigenciaDesde: string
  vigenciaHasta: string | null
  vigente: boolean
  archivoUrl: string
  activo: boolean
  creadoEn: string
}

interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

function fecha(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '—'
}

type DialogState = { mode: 'crear' } | { mode: 'editar'; row: Procedimiento } | null

export default function ProcedimientosPage() {
  const queryClient = useQueryClient()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['PROCEDIMIENTOS'] === 'TOTAL'

  const [q, setQ] = useState('')
  const [qDeb, setQDeb] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [gestionando, setGestionando] = useState<Procedimiento | null>(null)
  const [eliminando, setEliminando] = useState<Procedimiento | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['procedimientos', { q: qDeb, page }],
    queryFn: () =>
      api
        .get('nucleo/procedimientos', {
          searchParams: { page: String(page), limit: '20', ...(qDeb ? { q: qDeb } : {}) },
        })
        .json<Paginated<Procedimiento>>(),
  })
  const rows = data?.data ?? []
  const meta = data?.meta

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['procedimientos'] })

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`nucleo/procedimientos/${id}`),
    onSuccess: () => {
      toast.success('Procedimiento eliminado.')
      setEliminando(null)
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Procedimientos</h1>
              <p className="text-sm text-muted-foreground">
                Maestro de procedimientos constructivos (PDF normativo). Cada uno apunta a uno o más formularios de control.
              </p>
            </div>
            {puedeEditar ? (
              <Button size="lg" className="font-semibold" onClick={() => setDialog({ mode: 'crear' })}>
                <Plus strokeWidth={2.5} />
                Nuevo
              </Button>
            ) : null}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="h-10 rounded-lg bg-secondary pl-9 text-sm"
            />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Cargando…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-destructive">
                      No se pudieron cargar los datos.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay procedimientos.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.nombre}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.codigo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fecha(row.vigenciaDesde)} → {fecha(row.vigenciaHasta)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                            !row.activo
                              ? 'bg-secondary text-foreground'
                              : row.vigente
                                ? 'bg-ok-bg text-ok-fg'
                                : 'bg-warn-bg text-warn-fg'
                          )}
                        >
                          {!row.activo ? 'INACTIVO' : row.vigente ? 'VIGENTE' : 'NO VIGENTE'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={row.archivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <FileText className="size-4" />
                          Ver PDF
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Formularios"
                            onClick={() => setGestionando(row)}
                          >
                            <Link2 className="size-4" />
                            Formularios
                          </Button>
                          {puedeEditar ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Editar"
                                onClick={() => setDialog({ mode: 'editar', row })}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Eliminar"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setEliminando(row)}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {meta.total} registro{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Alta / edición */}
      <Dialog open={dialog !== null} onOpenChange={(open) => (!open ? setDialog(null) : undefined)}>
        {dialog ? (
          <ProcedimientoFormDialog
            key={dialog.mode === 'editar' ? `edit-${dialog.row.id}` : 'crear'}
            estado={dialog}
            onDone={() => {
              setDialog(null)
              invalidar()
            }}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </Dialog>

      {/* Formularios de control vinculados */}
      <Dialog open={gestionando !== null} onOpenChange={(open) => (!open ? setGestionando(null) : undefined)}>
        {gestionando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Formularios de control · {gestionando.nombre}</DialogTitle>
              <DialogDescription>
                Formularios que verifican el cumplimiento de este procedimiento.
              </DialogDescription>
            </DialogHeader>
            <VinculosManager
              linkedPath={`nucleo/procedimientos/${gestionando.id}/formularios`}
              invalidateKey={['procedimiento-formularios', gestionando.id]}
              catalogoPath="nucleo/formularios"
              linkBody={(formularioId) => ({ formularioId })}
              puedeEditar={puedeEditar}
              emptyMessage="Sin formularios de control."
              addPlaceholder="Agregar formulario…"
            />
          </DialogContent>
        ) : null}
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={eliminando !== null} onOpenChange={(open) => (!open ? setEliminando(null) : undefined)}>
        {eliminando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar procedimiento</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres eliminar{' '}
                <span className="font-semibold text-foreground">{eliminando.nombre}</span>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={eliminar.isPending} onClick={() => eliminar.mutate(eliminando.id)}>
                {eliminar.isPending ? <Loader2 className="animate-spin" /> : null}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}

// ─── Diálogo de alta/edición (React Hook Form + Zod — CLAUDE.md) ───────────────
const formSchema = z
  .object({
    codigo: z.string().trim().min(1, 'El código es obligatorio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    vigenciaDesde: z.string().min(1, 'La vigencia desde es obligatoria'),
    vigenciaHasta: z.string().optional(),
    activo: z.boolean().optional(),
  })
  // Fechas en YYYY-MM-DD: la comparación lexicográfica equivale a la cronológica.
  .refine((d) => !d.vigenciaHasta || d.vigenciaHasta >= d.vigenciaDesde, {
    message: 'El término de vigencia no puede ser anterior al inicio.',
    path: ['vigenciaHasta'],
  })
type ProcForm = z.infer<typeof formSchema>

function ProcedimientoFormDialog({
  estado,
  onDone,
  onCancel,
}: {
  estado: { mode: 'crear' } | { mode: 'editar'; row: Procedimiento }
  onDone: () => void
  onCancel: () => void
}) {
  const esEditar = estado.mode === 'editar'
  const row = esEditar ? estado.row : null

  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProcForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: row?.codigo ?? '',
      nombre: row?.nombre ?? '',
      vigenciaDesde: row ? row.vigenciaDesde.slice(0, 10) : '',
      vigenciaHasta: row?.vigenciaHasta ? row.vigenciaHasta.slice(0, 10) : '',
      activo: row?.activo ?? true,
    },
  })

  async function onSubmit(values: ProcForm) {
    // El PDF no es un campo registrable por RHF (input file no controlado); es
    // obligatorio al crear (lotes-procedimientos.md §6).
    if (!esEditar && !archivo) {
      toast.error('Debes adjuntar el PDF del procedimiento.')
      return
    }
    setGuardando(true)
    try {
      if (esEditar && row) {
        await api.patch(`nucleo/procedimientos/${row.id}`, {
          json: {
            codigo: values.codigo,
            nombre: values.nombre,
            vigenciaDesde: values.vigenciaDesde,
            vigenciaHasta: values.vigenciaHasta || null,
            activo: values.activo,
          },
        })
        if (archivo) {
          const fd = new FormData()
          fd.append('archivo', archivo)
          await api.put(`nucleo/procedimientos/${row.id}/archivo`, { body: fd })
        }
        toast.success('Procedimiento actualizado.')
      } else {
        const fd = new FormData()
        fd.append('codigo', values.codigo)
        fd.append('nombre', values.nombre)
        fd.append('vigenciaDesde', values.vigenciaDesde)
        if (values.vigenciaHasta) fd.append('vigenciaHasta', values.vigenciaHasta)
        if (archivo) fd.append('archivo', archivo)
        await api.post('nucleo/procedimientos', { body: fd })
        toast.success('Procedimiento creado.')
      }
      onDone()
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{esEditar ? 'Editar procedimiento' : 'Nuevo · Procedimiento'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-codigo">Código</Label>
          <Input id="p-codigo" placeholder="Ej. PC-001" aria-invalid={errors.codigo ? true : undefined} {...register('codigo')} />
          {errors.codigo?.message ? <p className="text-xs text-destructive">{errors.codigo.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-nombre">Nombre</Label>
          <Input id="p-nombre" placeholder="Nombre del procedimiento" aria-invalid={errors.nombre ? true : undefined} {...register('nombre')} />
          {errors.nombre?.message ? <p className="text-xs text-destructive">{errors.nombre.message}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-desde">Vigencia desde</Label>
            <Input id="p-desde" type="date" aria-invalid={errors.vigenciaDesde ? true : undefined} {...register('vigenciaDesde')} />
            {errors.vigenciaDesde?.message ? <p className="text-xs text-destructive">{errors.vigenciaDesde.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-hasta">Vigencia hasta</Label>
            <Input id="p-hasta" type="date" aria-invalid={errors.vigenciaHasta ? true : undefined} {...register('vigenciaHasta')} />
            {errors.vigenciaHasta?.message ? <p className="text-xs text-destructive">{errors.vigenciaHasta.message}</p> : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-archivo">{esEditar ? 'Reemplazar PDF (opcional)' : 'PDF del procedimiento'}</Label>
          <Input
            id="p-archivo"
            type="file"
            accept="application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          {esEditar ? <p className="text-xs text-muted-foreground">Deja vacío para conservar el PDF actual.</p> : null}
        </div>
        {esEditar ? (
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2.5">
                <Checkbox checked={Boolean(field.value)} onCheckedChange={(c) => field.onChange(Boolean(c))} />
                <Label className="cursor-pointer">Activo</Label>
              </div>
            )}
          />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? <Loader2 className="animate-spin" /> : null}
            {esEditar ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
