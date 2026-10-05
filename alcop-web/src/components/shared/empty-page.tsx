import { Construction, type LucideIcon } from 'lucide-react'

import { TopBar } from '@/components/layout/top-bar'

/** Página placeholder presentable para secciones aún no diseñadas. */
export function EmptyPage({
  title,
  description,
  icon: Icon = Construction,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <>
      <TopBar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}

        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Icon className="size-7" />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">
            En construcción
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Esta sección estará disponible en una próxima entrega.
          </p>
        </div>
      </main>
    </>
  )
}
