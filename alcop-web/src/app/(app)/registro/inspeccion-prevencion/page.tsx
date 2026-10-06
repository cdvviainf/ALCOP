import { ShieldCheck } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function InspeccionPrevencionPage() {
  return (
    <EmptyPage
      title="Inspección Prevención"
      description="Registro de hallazgos y visitas de prevención."
      icon={ShieldCheck}
    />
  )
}
