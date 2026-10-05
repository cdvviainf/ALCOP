import { Flag } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function HallazgosPage() {
  return (
    <EmptyPage
      title="Hallazgos"
      description="Registro de hallazgos de prevención por obra."
      icon={Flag}
    />
  )
}
