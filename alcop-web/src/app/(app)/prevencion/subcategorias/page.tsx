'use client'

import { BreadcrumbBar } from '@/components/layout/top-bar'
import { SubcategoriasMaintainer } from '@/components/modules/subcategorias-maintainer'

export default function SubcategoriasPrevencionPage() {
  return (
    <>
      <BreadcrumbBar backHref="/obras" trail="Datos Maestros · Prevención" current="Subcategorías" />
      <main className="flex-1 p-8">
        <SubcategoriasMaintainer area="PREVENCION" />
      </main>
    </>
  )
}
