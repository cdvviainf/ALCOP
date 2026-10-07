'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { BreadcrumbBar } from '@/components/layout/top-bar'
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

interface Perfil {
  id: number
  nombre: string
  areaPrevencion: boolean
  areaTecnica: boolean
  usuariosActivos: number
}

function AreaBadge({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        on ? 'bg-ok-bg text-ok-fg' : 'bg-secondary text-muted-foreground'
      )}
    >
      {on ? 'SÍ' : 'NO'}
    </span>
  )
}

export default function PerfilesPage() {
  const queryClient = useQueryClient()
  const [eliminando, setEliminando] = useState<Perfil | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['perfiles'],
    queryFn: () => api.get('nucleo/perfiles', { searchParams: { limit: '100' } }).json<{ data: Perfil[] }>(),
  })
  const perfiles = data?.data ?? []

  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`nucleo/perfiles/${id}`),
    onSuccess: () => {
      toast.success('Perfil eliminado.')
      setEliminando(null)
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar.'),
  })

  return (
    <>
      <BreadcrumbBar backHref="/usuarios" trail="Accesos" current="Perfiles" />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Perfiles</h1>
            <p className="text-sm text-muted-foreground">
              Acceso granular por función. Marca el área y asigna el nivel de cada función.
            </p>
          </div>
          <Button size="lg" className="font-semibold" render={<Link href="/usuarios/perfiles/nuevo" />} nativeButton={false}>
            <Plus strokeWidth={2.5} />
            Nuevo
          </Button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Prevención</TableHead>
                <TableHead>Técnica</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Cargando…
                    </span>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-destructive">
                    No se pudieron cargar los perfiles.
                  </TableCell>
                </TableRow>
              ) : perfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay perfiles.
                  </TableCell>
                </TableRow>
              ) : (
                perfiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>
                      <AreaBadge on={p.areaPrevencion} />
                    </TableCell>
                    <TableCell>
                      <AreaBadge on={p.areaTecnica} />
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{p.usuariosActivos}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar"
                          render={<Link href={`/usuarios/perfiles/${p.id}`} />}
                          nativeButton={false}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Eliminar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setEliminando(p)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={eliminando !== null} onOpenChange={(open) => (!open ? setEliminando(null) : undefined)}>
        {eliminando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar perfil</DialogTitle>
              <DialogDescription>
                ¿Seguro que quieres eliminar{' '}
                <span className="font-semibold text-foreground">{eliminando.nombre}</span>? Esta acción no se
                puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={eliminar.isPending}
                onClick={() => eliminar.mutate(eliminando.id)}
              >
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
