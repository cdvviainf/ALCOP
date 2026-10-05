import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalisisIaTecnicaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis IA — Técnica"
        description="Fotos de una visita técnica → informe editable en el formato fijo antes de guardarlo como reporte."
      />
      <Card>
        <CardHeader>
          <CardTitle>Informe asistido por IA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Mismo flujo que Prevención: la IA nunca escribe un reporte final sin
          pasar por la revisión del usuario.
        </CardContent>
      </Card>
    </div>
  )
}
