'use client'

import { BreadcrumbBar } from '@/components/layout/top-bar'
import { CategoriasMaintainer } from '@/components/modules/categorias-maintainer'

export default function CategoriasPrevencionPage() {
  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Datos Maestros · Prevención" current="Categorías" />
      <main className="flex-1 p-8">
        <CategoriasMaintainer
          area="PREVENCION"
          descripcion="Clasificación de los hallazgos de las visitas de prevención (categoría › subcategoría)."
        />
      </main>
    </>
  )
}
