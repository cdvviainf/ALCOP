'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Workflow } from 'lucide-react'
import { z } from 'zod'

import { api } from '@/lib/api'
import { cn } from 'cn'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CrudMaintainer, type CrudColumn } from '@/components/shared/crud-maintainer'
import { VinculosManager } from '@/components/shared/vinculos-manager'

interface Me {
  esAdmin: boolean
  permisos: Record<string, string>
}

interface TipoLote extends Record<string, unknown> {
  id: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  procedimientosCount: number
  creadoEn: string
}

const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  orden: z.coerce.number().int().min(0),
  activo: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export default function TiposLotePage() {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('usuarios/me').json<Me>(),
    retry: false,
  })
  const puedeEditar = me?.esAdmin === true || me?.permisos?.['TIPOS_LOTE'] === 'TOTAL'

  // Gestión de procedimientos vinculados (M:N) de una fila.
  const [gestionando, setGestionando] = useState<TipoLote | null>(null)

  const columns: CrudColumn<TipoLote>[] = [
    { key: 'nombre', header: 'Tipo de lote', render: (row) => <span className="font-medium">{row.nombre}</span> },
    { key: 'codigo', header: 'Código', render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.codigo}</span> },
    {
      key: 'activo',
      header: 'Estado',
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
            row.activo ? 'bg-ok-bg text-ok-fg' : 'bg-secondary text-foreground'
          )}
        >
          {row.activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
      ),
    },
    {
      key: 'procedimientosCount',
      header: 'Procedimientos',
      render: (row) => <span className="text-muted-foreground">{row.procedimientosCount}</span>,
    },
    {
      key: '__procs',
      header: '',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => setGestionando(row)}>
          <Workflow className="size-4" />
          Gestionar
        </Button>
      ),
    },
  ]

  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <CrudMaintainer<TipoLote, FormValues>
            titulo="Tipos de Lote"
            descripcion="Maestro de tipos de unidad que componen una obra (Casa, Departamento, Bodega, Portería…). A cada tipo se le asignan procedimientos constructivos."
            endpoint="nucleo/tipos-lote"
            queryKey="tipos-lote"
            columns={columns}
            fields={[
              { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Casa' },
              { name: 'orden', label: 'Orden', type: 'number' },
              { name: 'activo', label: 'Activo', type: 'checkbox', soloEdicion: true },
            ]}
            schema={schema}
            defaultValues={{ nombre: '', orden: 0, activo: true }}
            toFormValues={(row) => ({ nombre: row.nombre, orden: row.orden, activo: row.activo })}
            rowLabel={(row) => row.nombre}
            puedeEditar={puedeEditar}
            searchPlaceholder="Buscar por nombre o código…"
            emptyMessage="No hay tipos de lote."
          />
        )}
      </main>

      <Dialog open={gestionando !== null} onOpenChange={(open) => (!open ? setGestionando(null) : undefined)}>
        {gestionando ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Procedimientos · {gestionando.nombre}</DialogTitle>
              <DialogDescription>
                Procedimientos constructivos asociados a este tipo de lote. Determinan qué formularios de control aplican.
              </DialogDescription>
            </DialogHeader>
            <VinculosManager
              linkedPath={`nucleo/tipos-lote/${gestionando.id}/procedimientos`}
              invalidateKey={['tipo-lote-procedimientos', gestionando.id]}
              catalogoPath="nucleo/procedimientos/opciones"
              linkBody={(procedimientoId) => ({ procedimientoId })}
              puedeEditar={puedeEditar}
              emptyMessage="Sin procedimientos asociados."
              addPlaceholder="Agregar procedimiento…"
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}
