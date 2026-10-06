import { HardHat } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function InspeccionTecnicaPage() {
  return (
    <EmptyPage
      title="Inspección Técnica"
      description="Registro de visitas técnicas (hitos de nidos y retiro de puntales)."
      icon={HardHat}
    />
  )
}
