'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Nivel = 'SIN_ACCESO' | 'LECTURA' | 'TOTAL'
type Area = 'TRANSVERSAL' | 'PREVENCION' | 'TECNICA'

interface Funcion {
  id: number
  codigo: string
  nombre: string
  area: Area
  orden: number
}
interface Perfil {
  id: number
  nombre: string
  areaPrevencion: boolean
  areaTecnica: boolean
  permisos: { funcionId: number; codigo: string; nivel: Nivel }[]
}

const NIVELES: { value: Nivel; label: string }[] = [
  { value: 'SIN_ACCESO', label: 'Sin acceso' },
  { value: 'LECTURA', label: 'Lectura' },
  { value: 'TOTAL', label: 'Total' },
]
const NIVEL_ITEMS = Object.fromEntries(NIVELES.map((n) => [n.value, n.label]))

function NivelSelect({ value, onChange }: { value: Nivel; onChange: (v: Nivel) => void }) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as Nivel)} items={NIVEL_ITEMS}>
      <SelectTrigger className="h-8 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {NIVELES.map((n) => (
          <SelectItem key={n.value} value={n.value}>
            {n.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PerfilForm({ funciones, perfil }: { funciones: Funcion[]; perfil: Perfil | null }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [nombre, setNombre] = useState(perfil?.nombre ?? '')
  const [areaPrevencion, setAreaPrevencion] = useState(perfil?.areaPrevencion ?? false)
  const [areaTecnica, setAreaTecnica] = useState(perfil?.areaTecnica ?? false)
  const [niveles, setNiveles] = useState<Record<number, Nivel>>(() => {
    const base: Record<number, Nivel> = {}
    for (const f of funciones) base[f.id] = 'SIN_ACCESO'
    for (const p of perfil?.permisos ?? []) base[p.funcionId] = p.nivel
    return base
  })

  const setNivel = (funcionId: number, nivel: Nivel) =>
    setNiveles((prev) => ({ ...prev, [funcionId]: nivel }))

  const obras = funciones.find((f) => f.codigo === 'OBRAS')
  const prevFns = funciones.filter((f) => f.area === 'PREVENCION')
  const tecFns = funciones.filter((f) => f.area === 'TECNICA')

  const guardar = useMutation({
    mutationFn: () => {
      const body = {
        nombre: nombre.trim(),
        areaPrevencion,
        areaTecnica,
        permisos: funciones.map((f) => ({ funcionId: f.id, nivel: niveles[f.id] ?? 'SIN_ACCESO' })),
      }
      return perfil
        ? api.patch(`nucleo/perfiles/${perfil.id}`, { json: body }).json()
        : api.post('nucleo/perfiles', { json: body }).json()
    },
    onSuccess: () => {
      toast.success(perfil ? 'Perfil actualizado.' : 'Perfil creado.')
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      router.push('/usuarios/perfiles')
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo guardar.'),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }
    guardar.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Prevencionista de obra" />
      </div>

      {/* Transversal: Obras */}
      {obras ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Obras</h2>
              <p className="text-xs text-muted-foreground">Acceso al mantenedor de obras.</p>
            </div>
            <NivelSelect value={niveles[obras.id] ?? 'SIN_ACCESO'} onChange={(v) => setNivel(obras.id, v)} />
          </div>
        </div>
      ) : null}

      {/* Área Prevención */}
      <AreaCard
        titulo="Área Prevención"
        activa={areaPrevencion}
        onToggle={setAreaPrevencion}
        funciones={prevFns}
        niveles={niveles}
        setNivel={setNivel}
      />

      {/* Área Técnica */}
      <AreaCard
        titulo="Área Técnica"
        activa={areaTecnica}
        onToggle={setAreaTecnica}
        funciones={tecFns}
        niveles={niveles}
        setNivel={setNivel}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/usuarios/perfiles')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? <Loader2 className="animate-spin" /> : null}
          {perfil ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}

function AreaCard({
  titulo,
  activa,
  onToggle,
  funciones,
  niveles,
  setNivel,
}: {
  titulo: string
  activa: boolean
  onToggle: (v: boolean) => void
  funciones: Funcion[]
  niveles: Record<number, Nivel>
  setNivel: (funcionId: number, nivel: Nivel) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <Checkbox checked={activa} onCheckedChange={(c) => onToggle(Boolean(c))} />
        <h2 className="text-sm font-bold text-foreground">{titulo}</h2>
      </div>
      {activa ? (
        <div className="mt-4 space-y-3">
          {funciones.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-4">
              <span className="text-sm text-foreground">{f.nombre}</span>
              <NivelSelect value={niveles[f.id] ?? 'SIN_ACCESO'} onChange={(v) => setNivel(f.id, v)} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Área deshabilitada; sus funciones quedan sin acceso.</p>
      )}
    </div>
  )
}

export default function PerfilEditorPage() {
  const params = useParams<{ id: string }>()
  const esNuevo = params.id === 'nuevo'
  const perfilId = esNuevo ? null : Number(params.id)

  const { data: funcResp, isLoading: cargandoFunc } = useQuery({
    queryKey: ['funciones'],
    queryFn: () => api.get('nucleo/funciones').json<{ data: Funcion[] }>(),
  })

  const { data: perfil, isLoading: cargandoPerfil } = useQuery({
    queryKey: ['perfil', perfilId],
    queryFn: () => api.get(`nucleo/perfiles/${perfilId}`).json<Perfil>(),
    enabled: perfilId !== null,
  })

  const cargando = cargandoFunc || (perfilId !== null && cargandoPerfil)

  return (
    <>
      <BreadcrumbBar backHref="/usuarios/perfiles" trail="Perfiles" current={esNuevo ? 'Nuevo' : (perfil?.nombre ?? 'Editar')} />
      <main className="flex-1 p-8">
        {cargando || !funcResp ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <PerfilForm funciones={funcResp.data} perfil={perfil ?? null} />
        )}
      </main>
    </>
  )
}
