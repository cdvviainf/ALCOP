import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'

export default function VisitasPrevencionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas de prevención"
        description="Registro de visitas de prevención de riesgos por obra."
      />
      <DataTable
        columns={[
          { key: 'obra', header: 'Obra' },
          { key: 'inspector', header: 'Inspector' },
          { key: 'fecha', header: 'Fecha' },
        ]}
        data={[]}
        emptyMessage="Sin visitas registradas."
      />
    </div>
  )
}
