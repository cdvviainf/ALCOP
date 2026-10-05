import { Users } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function UsuariosPage() {
  return (
    <EmptyPage
      title="Usuarios"
      description="Usuarios, perfiles y accesos por Área."
      icon={Users}
    />
  )
}
