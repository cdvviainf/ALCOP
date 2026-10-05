import { PageHeader } from '@/components/shared/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Panel de obras y resumen (home). Visibilidad por perfil pendiente de cablear
 * contra GET /api/usuarios/me (nivelPrevencion / nivelTecnica).
 */
export default function PanelPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de obras y resumen"
        description="Vista general de las obras en curso. La visibilidad se ajustará según el acceso por Área del usuario."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Obras activas', value: '—' },
          { title: 'Hallazgos de prevención', value: '—' },
          { title: 'Visitas técnicas por resolver', value: '—' },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardDescription>{kpi.title}</CardDescription>
              <CardTitle className="text-3xl">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Datos reales al conectar alcop-api.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
