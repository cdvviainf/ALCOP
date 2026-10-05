import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'

export default function FormulariosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Formularios dinámicos"
        description="Motor de formularios 100% dinámico (checklists por sección), compartido por Prevención y Técnica."
      />
      <DataTable
        columns={[
          { key: 'nombre', header: 'Formulario' },
          { key: 'categoria', header: 'Categoría' },
          { key: 'preguntas', header: 'Preguntas' },
        ]}
        data={[]}
        emptyMessage="Sin formularios creados."
      />
    </div>
  )
}
