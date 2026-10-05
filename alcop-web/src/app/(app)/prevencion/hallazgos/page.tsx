import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'

export default function HallazgosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de hallazgos"
        description="Prevención — sin ciclo de corrección: un hallazgo se ingresa, se reporta y queda como registro."
      />
      <DataTable
        columns={[
          { key: 'obra', header: 'Obra' },
          { key: 'descripcion', header: 'Descripción' },
          { key: 'nivelRiesgo', header: 'Nivel de riesgo' },
          { key: 'fecha', header: 'Fecha' },
        ]}
        data={[]}
        emptyMessage="Sin hallazgos registrados."
      />
    </div>
  )
}
