import { BarChart } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function AnaliticaPage() {
  return (
    <EmptyPage
      title="Analítica"
      description="Indicadores y semáforo por obra."
      icon={BarChart}
    />
  )
}
