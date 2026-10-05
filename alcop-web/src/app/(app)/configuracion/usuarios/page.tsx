import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios y perfiles"
        description="Gestión de usuarios y niveles de acceso por Área (Prevención / Técnica)."
      />
      <DataTable
        columns={[
          { key: 'nombre', header: 'Nombre' },
          { key: 'email', header: 'Email' },
          { key: 'nivelPrevencion', header: 'Nivel Prevención' },
          { key: 'nivelTecnica', header: 'Nivel Técnica' },
        ]}
        data={[]}
        emptyMessage="Sin usuarios registrados."
      />
    </div>
  )
}
