'use client'

import { BreadcrumbBar } from '@/components/layout/top-bar'
import { CategoriasMaintainer } from '@/components/modules/categorias-maintainer'

export default function CategoriasFormularioPage() {
  return (
    <>
      <BreadcrumbBar backHref="/formularios" trail="Formularios" current="Categorías" />
      <main className="flex-1 p-8">
        <CategoriasMaintainer />
      </main>
    </>
  )
}
