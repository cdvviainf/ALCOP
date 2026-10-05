'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { BreadcrumbBar } from '@/components/layout/top-bar'

interface Item {
  id: number
  label: string
  checked: boolean
}

const INITIAL: Item[] = [
  { id: 1, label: 'Casco de seguridad', checked: true },
  { id: 2, label: 'Zapatos de seguridad', checked: true },
  { id: 3, label: 'Guantes de trabajo', checked: false },
  { id: 4, label: 'Lentes de seguridad', checked: true },
  { id: 5, label: 'Chaleco reflectante', checked: false },
]

export default function ChecklistEppPage() {
  const [items, setItems] = useState<Item[]>(INITIAL)
  const [nuevo, setNuevo] = useState('')

  const marcados = useMemo(() => items.filter((i) => i.checked).length, [items])
  const total = items.length
  const pct = total === 0 ? 0 : Math.round((marcados / total) * 100)

  function toggle(id: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    )
  }

  function agregar() {
    const label = nuevo.trim()
    if (!label) return
    setItems((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, label, checked: false },
    ])
    setNuevo('')
  }

  return (
    <>
      <BreadcrumbBar
        backHref="/obras"
        trail="Condominio Mirador Piedra Roja"
        current="Checklist: EPP General"
      />
      <main className="flex-1 p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Lista de ítems */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <ul>
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-center gap-4 py-4',
                    i !== items.length - 1 && 'border-b border-border'
                  )}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggle(item.id)}
                  />
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={cn(
                      'text-left text-base transition-colors',
                      item.checked
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Agregar ítem */}
            <div className="mt-4 flex items-center gap-3">
              <Input
                value={nuevo}
                onChange={(e) => setNuevo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    agregar()
                  }
                }}
                placeholder="Agregar ítem…"
                className="h-12 rounded-lg bg-secondary px-4 text-sm"
              />
              <Button
                type="button"
                onClick={agregar}
                aria-label="Agregar ítem"
                className="size-12 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <Plus className="size-5" strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          {/* Panel derecho */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-semibold tracking-[0.12em] text-label">
                AVANCE
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {marcados}
                <span className="text-xl font-medium text-muted-foreground">
                  {' '}
                  / {total}
                </span>
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <Button
              type="button"
              className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Guardar registro
            </Button>
            <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
              Queda como registro histórico — sin ciclo de corrección
            </p>
          </aside>
        </div>
      </main>
    </>
  )
}
