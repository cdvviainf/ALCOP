import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalisisIaPrevencionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis IA — Prevención"
        description="Fotos de una inspección → informe editable (Obra, Inspector, Fecha y hora, Ubicación, Imágenes, Observaciones)."
      />
      <Card>
        <CardHeader>
          <CardTitle>Informe asistido por IA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          El usuario siempre revisa y edita el informe antes de guardarlo como
          reporte definitivo. En desarrollo el proveedor de IA es mock.
        </CardContent>
      </Card>
    </div>
  )
}
