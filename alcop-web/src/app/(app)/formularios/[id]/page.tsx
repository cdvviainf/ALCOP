'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { api } from '@/lib/api'
import { BreadcrumbBar } from '@/components/layout/top-bar'
import { FormularioBuilder, type BuilderValues } from '@/components/modules/formulario-builder'

interface PreguntaDetalle {
  texto: string
  tipoRespuesta: 'CHECKBOX' | 'SELECCION_MULTIPLE' | 'NUMERO' | 'TEXTO' | 'TEXTO_LARGO'
  obligatoria: boolean
  permiteFoto: boolean
  fotoObligatoria: boolean
  opciones: string[]
}
interface FormularioDetalle {
  id: number
  codigo: string
  nombre: string
  areaId: number
  categoriaId: number
  requiereObra: boolean
  activo: boolean
  tieneRespuestas: boolean
  preguntas: PreguntaDetalle[]
}

export default function EditarFormularioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['formulario', id],
    queryFn: () => api.get(`nucleo/formularios/${id}`).json<FormularioDetalle>(),
    retry: false,
  })

  const initial: BuilderValues | null = data
    ? {
        codigo: data.codigo,
        nombre: data.nombre,
        areaId: data.areaId,
        categoriaId: data.categoriaId,
        requiereObra: data.requiereObra,
        activo: data.activo,
        preguntas: data.preguntas.map((p) => ({
          texto: p.texto,
          tipoRespuesta: p.tipoRespuesta,
          obligatoria: p.obligatoria,
          permiteFoto: p.permiteFoto,
          fotoObligatoria: p.fotoObligatoria,
          opcionesText: p.opciones.join('\n'),
        })),
      }
    : null

  return (
    <>
      <BreadcrumbBar backHref="/formularios" trail="Formularios" current={data?.nombre ?? 'Editar'} />
      <main className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : isError || !initial ? (
          <p className="text-sm text-destructive">No se pudo cargar el formulario.</p>
        ) : (
          <FormularioBuilder
            modo="editar"
            initial={initial}
            formularioId={Number(id)}
            preguntasEditables={!data?.tieneRespuestas}
          />
        )}
      </main>
    </>
  )
}
