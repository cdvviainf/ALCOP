'use client'

import { useParams, notFound } from 'next/navigation'

import { BreadcrumbBar } from '@/components/layout/top-bar'
import { CategoriasMaintainer } from '@/components/modules/categorias-maintainer'

const MAP: Record<string, { codigo: 'PREVENCION' | 'TECNICA'; label: string }> = {
  tecnica: { codigo: 'TECNICA', label: 'Técnica' },
  prevencion: { codigo: 'PREVENCION', label: 'Prevención' },
}

export default function CategoriasPorAreaPage() {
  const params = useParams<{ area: string }>()
  const entry = MAP[params.area]
  if (!entry) notFound()

  return (
    <>
      <BreadcrumbBar backHref="/formularios" trail={`Datos Maestros · ${entry.label}`} current="Categorías" />
      <main className="flex-1 p-8">
        <CategoriasMaintainer area={entry.codigo} />
      </main>
    </>
  )
}
