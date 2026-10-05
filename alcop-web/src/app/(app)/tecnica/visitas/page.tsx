import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'

export default function VisitasTecnicaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de visitas técnicas"
        description="Técnica — con ciclo de corrección. Incluye hitos de nidos (6 etapas) y retiro de puntales."
      />
      <DataTable
        columns={[
          { key: 'obra', header: 'Obra' },
          { key: 'inspector', header: 'Inspector' },
          { key: 'estado', header: 'Estado' },
          { key: 'fecha', header: 'Fecha' },
        ]}
        data={[]}
        emptyMessage="Sin visitas registradas."
      />
    </div>
  )
}
