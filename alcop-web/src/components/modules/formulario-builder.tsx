'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

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

interface Area {
  id: number
  codigo: string
  nombre: string
}
interface Categoria {
  id: number
  nombre: string
}
interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}

const TIPOS: Array<{ value: string; label: string }> = [
  { value: 'CHECKBOX', label: 'Checkbox (Cumple / No cumple / N.A.)' },
  { value: 'SELECCION_MULTIPLE', label: 'Selección múltiple' },
  { value: 'NUMERO', label: 'Número' },
  { value: 'TEXTO', label: 'Texto' },
  { value: 'TEXTO_LARGO', label: 'Texto largo' },
]

const FORM_FUNCION: Record<string, string> = { PREVENCION: 'PREV_FORMULARIOS', TECNICA: 'TEC_FORMULARIOS' }
// Crear categoría al vuelo exige la función Categorías del área (no la de
// Formularios): el botón inline solo se ofrece a quien puede crearlas (QA-FD-004).
const CAT_FUNCION: Record<string, string> = { PREVENCION: 'PREV_CAT_CATEGORIAS', TECNICA: 'TEC_CAT_CATEGORIAS' }

const preguntaForm = z.object({
  texto: z.string().trim().min(1, 'El texto es obligatorio'),
  tipoRespuesta: z.enum(['CHECKBOX', 'SELECCION_MULTIPLE', 'NUMERO', 'TEXTO', 'TEXTO_LARGO']),
  obligatoria: z.boolean(),
  permiteFoto: z.boolean(),
  fotoObligatoria: z.boolean(),
  // Siempre presente (los defaults la inicializan en ''); evita desajuste de
  // tipos input/output del resolver.
  opcionesText: z.string(),
})

const builderSchema = z
  .object({
    codigo: z.string().trim().min(1, 'El código es obligatorio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    areaId: z.number().int().positive('Selecciona un área'),
    categoriaId: z.number().int().positive('Selecciona una categoría'),
    requiereObra: z.boolean(),
    activo: z.boolean(),
    preguntas: z.array(preguntaForm).min(1, 'Agrega al menos una pregunta'),
  })
  .superRefine((data, ctx) => {
    data.preguntas.forEach((p, i) => {
      if (p.tipoRespuesta === 'SELECCION_MULTIPLE') {
        const ops = (p.opcionesText ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
        if (ops.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Mínimo 2 opciones (una por línea).',
            path: ['preguntas', i, 'opcionesText'],
          })
        }
      }
    })
  })

export type BuilderValues = z.infer<typeof builderSchema>

const PREGUNTA_VACIA: BuilderValues['preguntas'][number] = {
  texto: '',
  tipoRespuesta: 'CHECKBOX',
  obligatoria: true,
  permiteFoto: false,
  fotoObligatoria: false,
  opcionesText: '',
}

function opcionesDe(opcionesText: string): string[] {
  return opcionesText.split('\n').map((s) => s.trim()).filter(Boolean)
}

/** Formulario (plantilla) — alta o edición. En edición, el área es inmutable. */
export function FormularioBuilder({
  modo,
  initial,
  formularioId,
  preguntasEditables = true,
}: {
  modo: 'crear' | 'editar'
  initial: BuilderValues
  formularioId?: number
  /** Si false (el formulario ya tiene respuestas), las preguntas no se editan (§6). */
  preguntasEditables?: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const { data: areasResp } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('nucleo/areas').json<{ data: Area[] }>(),
  })
  const areas = areasResp?.data ?? []
  // Solo áreas con TOTAL (puede administrar plantillas de esa área). Depende de
  // `areasResp` (ref estable de react-query), no del array recreado cada render.
  const areasPermitidas = useMemo(
    () =>
      (areasResp?.data ?? []).filter(
        (a) => me?.esAdmin === true || me?.permisos?.[FORM_FUNCION[a.codigo]] === 'TOTAL'
      ),
    [areasResp, me]
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BuilderValues>({
    resolver: zodResolver(builderSchema),
    defaultValues: initial,
  })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'preguntas' })

  const areaId = watch('areaId')
  const preguntas = watch('preguntas')

  // ¿Puede crear categorías en el área seleccionada? (función Categorías del área).
  const areaCodigoSel = areas.find((a) => a.id === areaId)?.codigo
  const puedeCrearCategoria =
    !!areaCodigoSel && (me?.esAdmin === true || me?.permisos?.[CAT_FUNCION[areaCodigoSel]] === 'TOTAL')

  const { data: catResp } = useQuery({
    queryKey: ['categorias-de-area', areaId],
    queryFn: () =>
      api
        .get('nucleo/categorias-formulario/opciones', { searchParams: { areaId: String(areaId) } })
        .json<{ data: Categoria[] }>(),
    enabled: areaId > 0,
  })
  const categorias = catResp?.data ?? []

  const guardar = useMutation({
    mutationFn: (values: BuilderValues) => {
      const preguntas = values.preguntas.map((p) => ({
        texto: p.texto,
        tipoRespuesta: p.tipoRespuesta,
        obligatoria: p.obligatoria,
        permiteFoto: p.permiteFoto,
        fotoObligatoria: p.permiteFoto ? p.fotoObligatoria : false,
        opciones: p.tipoRespuesta === 'SELECCION_MULTIPLE' ? opcionesDe(p.opcionesText ?? '') : [],
      }))
      if (modo === 'editar' && formularioId) {
        // Área y requiereObra son inmutables; `preguntas` solo si son editables
        // (no hay respuestas) — así desactivar un formulario con respuestas
        // envía solo metadata y no es rechazado (QA-FD-003).
        const json: Record<string, unknown> = {
          codigo: values.codigo,
          nombre: values.nombre,
          categoriaId: values.categoriaId,
          activo: values.activo,
        }
        if (preguntasEditables) json.preguntas = preguntas
        return api.patch(`nucleo/formularios/${formularioId}`, { json }).json()
      }
      // Alta: `activo` y `requiereObra` los fija el backend (QA-FD-006/007).
      return api
        .post('nucleo/formularios', {
          json: {
            codigo: values.codigo,
            nombre: values.nombre,
            areaId: values.areaId,
            categoriaId: values.categoriaId,
            preguntas,
          },
        })
        .json()
    },
    onSuccess: () => {
      toast.success(modo === 'editar' ? 'Formulario actualizado.' : 'Formulario creado.')
      router.push('/formularios')
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo guardar.'),
  })

  // Crear categoría al vuelo dentro del área seleccionada (QA-FD-004, §10).
  const [nuevaCat, setNuevaCat] = useState('')
  const [creandoCat, setCreandoCat] = useState(false)
  const crearCategoria = useMutation({
    mutationFn: (nombre: string) =>
      api.post('nucleo/categorias-formulario', { json: { areaId, nombre } }).json<{ id: number }>(),
    onSuccess: async (cat) => {
      toast.success('Categoría creada.')
      await queryClient.invalidateQueries({ queryKey: ['categorias-de-area', areaId] })
      setValue('categoriaId', cat.id, { shouldValidate: true })
      setNuevaCat('')
      setCreandoCat(false)
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo crear la categoría.'),
  })

  return (
    <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="max-w-3xl space-y-8">
      {/* Metadata */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold text-foreground">Datos del formulario</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-nombre">Nombre</Label>
            <Input id="f-nombre" placeholder="Ej. Checklist EPP General" {...register('nombre')} />
            {errors.nombre?.message ? <p className="text-xs text-destructive">{errors.nombre.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-codigo">Código</Label>
            <Input id="f-codigo" placeholder="Ej. SSOMA-E-001" {...register('codigo')} />
            {errors.codigo?.message ? <p className="text-xs text-destructive">{errors.codigo.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-area">Área</Label>
            {modo === 'editar' ? (
              <Input id="f-area" value={areas.find((a) => a.id === areaId)?.nombre ?? ''} disabled readOnly />
            ) : (
              <Controller
                name="areaId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => {
                      field.onChange(Number(v))
                      setValue('categoriaId', 0) // al cambiar de área, limpia la categoría
                    }}
                    items={Object.fromEntries(areasPermitidas.map((a) => [String(a.id), a.nombre]))}
                  >
                    <SelectTrigger id="f-area" className="w-full">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {areasPermitidas.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.areaId?.message ? <p className="text-xs text-destructive">{errors.areaId.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-categoria">Categoría</Label>
            {creandoCat ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={nuevaCat}
                  onChange={(e) => setNuevaCat(e.target.value)}
                  placeholder="Nombre de la categoría"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (nuevaCat.trim()) crearCategoria.mutate(nuevaCat.trim())
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!nuevaCat.trim() || crearCategoria.isPending}
                  onClick={() => crearCategoria.mutate(nuevaCat.trim())}
                >
                  {crearCategoria.isPending ? <Loader2 className="animate-spin" /> : 'Crear'}
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancelar" onClick={() => setCreandoCat(false)}>
                  <X />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Controller
                  name="categoriaId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                      items={Object.fromEntries(categorias.map((c) => [String(c.id), c.nombre]))}
                    >
                      <SelectTrigger id="f-categoria" className="w-full" disabled={areaId <= 0}>
                        <SelectValue placeholder={areaId > 0 ? 'Selecciona…' : 'Elige un área primero'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {puedeCrearCategoria ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Nueva categoría"
                    onClick={() => setCreandoCat(true)}
                  >
                    <Plus />
                  </Button>
                ) : null}
              </div>
            )}
            {errors.categoriaId?.message ? <p className="text-xs text-destructive">{errors.categoriaId.message}</p> : null}
          </div>
        </div>
        {/* La plantilla nace activa (§5.1) y siempre ligada a obra (§6): el estado
            solo se expone en edición; requiereObra no es configurable en Etapa 1. */}
        {modo === 'editar' ? (
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
                Activo
              </label>
            )}
          />
        ) : null}
      </section>

      {/* Preguntas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Preguntas</h2>
          {preguntasEditables ? (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...PREGUNTA_VACIA })}>
              <Plus className="size-4" />
              Agregar pregunta
            </Button>
          ) : null}
        </div>
        {typeof errors.preguntas?.message === 'string' ? (
          <p className="text-xs text-destructive">{errors.preguntas.message}</p>
        ) : null}

        {!preguntasEditables ? (
          <p className="rounded-lg bg-warn-bg px-4 py-3 text-xs font-medium text-warn-fg">
            Este formulario ya tiene respuestas registradas: sus preguntas no se pueden modificar. Puedes editar el nombre, el código, la categoría y el estado.
          </p>
        ) : null}

        {!preguntasEditables ? (
          <div className="space-y-2">
            {preguntas?.map((p, i) => (
              <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                  #{i + 1} · {p.texto}
                </div>
                <div className="text-xs text-muted-foreground">
                  {TIPOS.find((t) => t.value === p.tipoRespuesta)?.label ?? p.tipoRespuesta}
                  {p.obligatoria ? ' · obligatoria' : ''}
                  {p.permiteFoto ? (p.fotoObligatoria ? ' · foto obligatoria' : ' · con foto') : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="space-y-4">
          {fields.map((f, i) => {
            const tipo = preguntas?.[i]?.tipoRespuesta
            const errP = errors.preguntas?.[i]
            return (
              <div key={f.id} className="space-y-3 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="mt-2 text-xs font-semibold text-label">#{i + 1}</span>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`p-${i}-texto`}>Pregunta</Label>
                    <Input id={`p-${i}-texto`} placeholder="Texto del punto de chequeo" {...register(`preguntas.${i}.texto`)} />
                    {errP?.texto?.message ? <p className="text-xs text-destructive">{errP.texto.message}</p> : null}
                  </div>
                  <div className="mt-6 flex gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ArrowUp />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Bajar" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}>
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar"
                      className="text-destructive hover:text-destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(i)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de respuesta</Label>
                    <Controller
                      name={`preguntas.${i}.tipoRespuesta`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                          items={Object.fromEntries(TIPOS.map((t) => [t.value, t.label]))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex items-end gap-6 pb-1">
                    <Controller
                      name={`preguntas.${i}.obligatoria`}
                      control={control}
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
                          Obligatoria
                        </label>
                      )}
                    />
                    <Controller
                      name={`preguntas.${i}.permiteFoto`}
                      control={control}
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
                          Permite foto
                        </label>
                      )}
                    />
                    {preguntas?.[i]?.permiteFoto ? (
                      <Controller
                        name={`preguntas.${i}.fotoObligatoria`}
                        control={control}
                        render={({ field }) => (
                          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                            <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
                            Foto obligatoria
                          </label>
                        )}
                      />
                    ) : null}
                  </div>
                </div>

                {tipo === 'SELECCION_MULTIPLE' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor={`p-${i}-ops`}>Opciones (una por línea, mínimo 2)</Label>
                    <textarea
                      id={`p-${i}-ops`}
                      rows={3}
                      className={cn(
                        'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
                        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      )}
                      placeholder={'Opción A\nOpción B\nOpción C'}
                      {...register(`preguntas.${i}.opcionesText`)}
                    />
                    {errP?.opcionesText?.message ? (
                      <p className="text-xs text-destructive">{errP.opcionesText.message}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/formularios')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? <Loader2 className="animate-spin" /> : null}
          {modo === 'editar' ? 'Guardar cambios' : 'Crear formulario'}
        </Button>
      </div>
    </form>
  )
}

export { PREGUNTA_VACIA }
