'use client'

import { BreadcrumbBar } from '@/components/layout/top-bar'
import { FormularioBuilder, PREGUNTA_VACIA, type BuilderValues } from '@/components/modules/formulario-builder'

const INICIAL: BuilderValues = {
  codigo: '',
  nombre: '',
  areaId: 0,
  categoriaId: 0,
  requiereObra: true,
  activo: true,
  preguntas: [{ ...PREGUNTA_VACIA }],
}

export default function NuevoFormularioPage() {
  return (
    <>
      <BreadcrumbBar backHref="/formularios" trail="Formularios" current="Nuevo" />
      <main className="flex-1 p-8">
        <FormularioBuilder modo="crear" initial={INICIAL} />
      </main>
    </>
  )
}
