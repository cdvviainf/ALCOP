'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { TopBar } from '@/components/layout/top-bar'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CALIDADES: Array<{ value: string; label: string; hint: string }> = [
  { value: 'ORIGINAL', label: 'Original', hint: 'Sin recomprimir (tope ~4000px). Mayor peso.' },
  { value: 'OPTIMIZADA', label: 'Optimizada', hint: '~2000px, buena calidad. Recomendada.' },
  { value: 'MEDIA', label: 'Media', hint: '~1280px. Equilibrio.' },
  { value: 'BAJA', label: 'Baja', hint: '~800px. Menor peso.' },
]

export default function CalidadImagenPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['config-calidad-imagen'],
    queryFn: () => api.get('nucleo/configuracion/calidad-imagen').json<{ calidadImagenDefault: string }>(),
    retry: false,
  })

  const cambiar = useMutation({
    mutationFn: (valor: string) =>
      api.patch('nucleo/configuracion/calidad-imagen', { json: { valor } }).json<{ calidadImagenDefault: string }>(),
    onSuccess: () => {
      toast.success('Calidad por defecto actualizada.')
      queryClient.invalidateQueries({ queryKey: ['config-calidad-imagen'] })
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo actualizar.'),
  })

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <div className="max-w-xl space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Calidad de imagen</h1>
            <p className="text-sm text-muted-foreground">
              Calidad sugerida por defecto al subir fotos de hallazgos. El inspector puede cambiarla por foto.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando…
            </div>
          ) : (
            <div className="space-y-1.5 rounded-xl border border-border bg-card p-6">
              <Label>Calidad por defecto</Label>
              <Select
                value={data?.calidadImagenDefault}
                onValueChange={(v) => typeof v === 'string' && cambiar.mutate(v)}
                items={Object.fromEntries(CALIDADES.map((c) => [c.value, c.label]))}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {CALIDADES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="pt-1 text-xs text-muted-foreground">
                {CALIDADES.find((c) => c.value === data?.calidadImagenDefault)?.hint ?? ''}
              </p>
              {cambiar.isPending ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  <Loader2 className="mr-1 inline size-3 animate-spin" />
                  Guardando…
                </p>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
