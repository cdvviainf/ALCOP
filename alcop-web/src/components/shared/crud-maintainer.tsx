'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useForm,
  Controller,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { z } from 'zod'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface CrudColumn<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

export type CrudFieldType = 'text' | 'number' | 'checkbox' | 'select' | 'password'

export interface CrudFieldOption {
  value: string
  label: string
}

export interface CrudField {
  name: string
  label: string
  type?: CrudFieldType
  placeholder?: string
  description?: string
  /** Opciones para type='select'. */
  options?: CrudFieldOption[]
  /** Si true, el campo solo se muestra al crear (no al editar). Útil para contraseñas. */
  soloAlta?: boolean
}

export interface CrudMaintainerProps<T extends { id: string | number }, TForm extends FieldValues> {
  titulo: string
  descripcion?: string
  /** Ruta del recurso bajo /api (p. ej. 'prevencion/niveles-riesgo'). */
  endpoint: string
  /** Clave base de TanStack Query (p. ej. 'niveles-riesgo'). */
  queryKey: string
  columns: CrudColumn<T>[]
  fields: CrudField[]
  schema: z.ZodType<TForm>
  defaultValues: DefaultValues<TForm>
  /** Valores del formulario al editar una fila (default: identidad por nombre de campo). */
  toFormValues?: (row: T) => DefaultValues<TForm>
  /** Etiqueta de la fila en el diálogo de borrado (default: row.nombre ?? #id). */
  rowLabel?: (row: T) => string
  /**
   * Habilita editar/eliminar por fila (solo lectura si es false). Default true.
   * Acepta una función `(row) => boolean` para gatear por el área/estado de cada fila.
   */
  puedeEditar?: boolean | ((row: T) => boolean)
  /** Muestra el botón "Nuevo". Default: el valor booleano de puedeEditar, o false si es función. */
  puedeCrear?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  limit?: number
}

type DialogState<T> = { mode: 'crear' } | { mode: 'editar'; row: T } | null

export function CrudMaintainer<T extends { id: string | number }, TForm extends FieldValues>({
  titulo,
  descripcion,
  endpoint,
  queryKey,
  columns,
  fields,
  schema,
  defaultValues,
  toFormValues,
  rowLabel,
  puedeEditar = true,
  puedeCrear,
  emptyMessage = 'Sin registros.',
  searchPlaceholder = 'Buscar…',
  limit = 20,
}: CrudMaintainerProps<T, TForm>) {
  // Edición por fila; "Nuevo" según puedeCrear (default = puedeEditar si es booleano).
  const editableGeneral = puedeEditar !== false
  const puedeEditarFila = (row: T) =>
    typeof puedeEditar === 'function' ? puedeEditar(row) : puedeEditar
  const mostrarNuevo = puedeCrear ?? (typeof puedeEditar === 'boolean' ? puedeEditar : false)
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState<T>>(null)
  const [eliminando, setEliminando] = useState<T | null>(null)

  // Debounce de la búsqueda + reset de página al cambiar el término.
  useEffect(() => {
    const t = setTimeout(() => {
      setQDebounced(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const listQueryKey = [queryKey, { q: qDebounced, page, limit }] as const

  const { data, isLoading, isError } = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      api
        .get(endpoint, {
          searchParams: {
            page: String(page),
            limit: String(limit),
            ...(qDebounced ? { q: qDebounced } : {}),
          },
        })
        .json<Paginated<T>>(),
  })

  const rows = data?.data ?? []
  const meta = data?.meta

  const invalidar = () => queryClient.invalidateQueries({ queryKey: [queryKey] })

  const crearMutation = useMutation({
    mutationFn: (values: TForm) => api.post(endpoint, { json: values }).json<T>(),
    onSuccess: () => {
      toast.success(`${titulo}: registro creado.`)
      setDialog(null)
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo crear.'),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, values }: { id: string | number; values: TForm }) =>
      api.patch(`${endpoint}/${id}`, { json: values }).json<T>(),
    onSuccess: () => {
      toast.success(`${titulo}: cambios guardados.`)
      setDialog(null)
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo guardar.'),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string | number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      toast.success(`${titulo}: registro eliminado.`)
      setEliminando(null)
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  const guardando = crearMutation.isPending || actualizarMutation.isPending

  const columnasFinales = useMemo<CrudColumn<T>[]>(() => {
    if (!editableGeneral) return columns
    return [
      ...columns,
      {
        key: '__acciones',
        header: '',
        // Acciones por fila: una fila que el usuario no puede editar (p. ej.
        // categoría de un área sin TOTAL) no muestra botones.
        render: (row: T) =>
          puedeEditarFila(row) ? (
            <div className="flex justify-end gap-1">
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
            </div>
          ) : null,
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, puedeEditar])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{titulo}</h1>
          {descripcion ? <p className="text-sm text-muted-foreground">{descripcion}</p> : null}
        </div>
        {mostrarNuevo ? (
          <Button
            size="lg"
            className="font-semibold"
            onClick={() => setDialog({ mode: 'crear' })}
          >
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
          placeholder={searchPlaceholder}
          className="h-10 rounded-lg bg-secondary pl-9 text-sm"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columnasFinales.map((col) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnasFinales.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columnasFinales.length}
                  className="h-24 text-center text-sm text-destructive"
                >
                  No se pudieron cargar los datos.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnasFinales.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columnasFinales.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {meta.total} registro{meta.total === 1 ? '' : 's'} · página {meta.page} de{' '}
            {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      {/* Diálogo de alta/edición */}
      <Dialog open={dialog !== null} onOpenChange={(open) => (!open ? setDialog(null) : undefined)}>
        {dialog ? (
          <CrudFormDialog<TForm>
            key={dialog.mode === 'editar' ? `edit-${dialog.row.id}` : 'create'}
            titulo={titulo}
            fields={fields}
            schema={schema}
            defaultValues={
              dialog.mode === 'editar'
                ? (toFormValues?.(dialog.row) ??
                  (filtrarCampos(dialog.row, fields) as DefaultValues<TForm>))
                : defaultValues
            }
            modo={dialog.mode}
            guardando={guardando}
            onSubmit={(values) => {
              if (dialog.mode === 'editar') {
                actualizarMutation.mutate({ id: dialog.row.id, values })
              } else {
                crearMutation.mutate(values)
              }
            }}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </Dialog>

      {/* Diálogo de confirmación de borrado */}
      <Dialog
        open={eliminando !== null}
        onOpenChange={(open) => (!open ? setEliminando(null) : undefined)}
      >
        {eliminando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar registro</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres eliminar{' '}
                <span className="font-semibold text-foreground">
                  {rowLabel?.(eliminando) ??
                    String((eliminando as Record<string, unknown>).nombre ?? `#${eliminando.id}`)}
                </span>
                ? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={eliminarMutation.isPending}
                onClick={() => eliminarMutation.mutate(eliminando.id)}
              >
                {eliminarMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

/** Toma solo las claves declaradas como campos del formulario desde una fila. */
function filtrarCampos<T>(row: T, fields: CrudField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const r = row as Record<string, unknown>
  for (const f of fields) out[f.name] = r[f.name]
  return out
}

interface CrudFormDialogProps<TForm extends FieldValues> {
  titulo: string
  fields: CrudField[]
  schema: z.ZodType<TForm>
  defaultValues: DefaultValues<TForm>
  modo: 'crear' | 'editar'
  guardando: boolean
  onSubmit: (values: TForm) => void
  onCancel: () => void
}

function CrudFormDialog<TForm extends FieldValues>({
  titulo,
  fields,
  schema,
  defaultValues,
  modo,
  guardando,
  onSubmit,
  onCancel,
}: CrudFormDialogProps<TForm>) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TForm>({
    // El input genérico del schema (con coerciones) no infiere contra FieldValues;
    // el cast es seguro porque el schema valida/transforma al tipo del formulario.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<TForm>,
    defaultValues,
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{modo === 'editar' ? `Editar ${titulo}` : `Nuevo · ${titulo}`}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={handleSubmit((v) => {
          // Al editar no se envían los campos soloAlta (p. ej. password/email):
          // están ocultos y mandarlos vacíos rompe la validación del backend (QA-C-001).
          if (modo === 'editar') {
            const limpio: Record<string, unknown> = { ...v }
            for (const f of fields) if (f.soloAlta) delete limpio[f.name]
            onSubmit(limpio as TForm)
          } else {
            onSubmit(v)
          }
        })}
        className="space-y-4"
      >
        {fields
          .filter((f) => !(f.soloAlta && modo === 'editar'))
          .map((f) => {
            const error = (errors as Record<string, { message?: string } | undefined>)[f.name]
            const tipo = f.type ?? 'text'
            return (
              <div key={f.name} className="space-y-1.5">
                {tipo === 'checkbox' ? (
                  <div className="flex items-center gap-2.5">
                    <Controller
                      name={f.name as never}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      )}
                    />
                    <Label className="cursor-pointer">{f.label}</Label>
                  </div>
                ) : tipo === 'select' ? (
                  <>
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <Controller
                      name={f.name as never}
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value != null ? String(field.value) : undefined}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger id={f.name} className="w-full">
                            <SelectValue placeholder={f.placeholder ?? 'Selecciona…'} />
                          </SelectTrigger>
                          <SelectContent>
                            {(f.options ?? []).map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <Input
                      id={f.name}
                      type={tipo === 'number' ? 'number' : tipo === 'password' ? 'password' : 'text'}
                      placeholder={f.placeholder}
                      autoComplete={tipo === 'password' ? 'new-password' : undefined}
                      aria-invalid={error ? true : undefined}
                      {...register(f.name as never)}
                    />
                  </>
                )}
                {f.description ? (
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                ) : null}
                {error?.message ? (
                  <p className={cn('text-xs text-destructive')}>{error.message}</p>
                ) : null}
              </div>
            )
          })}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? <Loader2 className="animate-spin" /> : null}
            {modo === 'editar' ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
