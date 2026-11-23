import { Loader2 } from 'lucide-react'

export interface ColumnaTarjeta<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

interface TarjetasMovilProps<T> {
  columns: ColumnaTarjeta<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  isError?: boolean
  emptyMessage?: string
  /** Toque en la tarjeta (p. ej. abrir el detalle). */
  onRowClick?: (row: T) => void
}

/**
 * Versión de una tabla para pantallas chicas (< md): cada fila es una tarjeta.
 * El título es la columna `nombre` (o la primera); las con `header` vacío (acciones) van arriba
 * a la derecha; el resto como pares etiqueta: valor. La tabla se oculta en < md.
 */
export function TarjetasMovil<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  emptyMessage = 'Sin registros.',
  onRowClick,
}: TarjetasMovilProps<T>) {
  const valor = (col: ColumnaTarjeta<T>, row: T) =>
    col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')

  if (isLoading || isError || rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground md:hidden">
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </span>
        ) : isError ? (
          <span className="text-destructive">No se pudieron cargar los datos.</span>
        ) : (
          emptyMessage
        )}
      </div>
    )
  }

  const acciones = columns.filter((c) => !c.header)
  const conHeader = columns.filter((c) => c.header)
  // Título: la columna "nombre" si existe (en mantenedores la 1ª suele ser el código); si no, la primera.
  const titulo = conHeader.find((c) => c.key === 'nombre') ?? conHeader[0]
  const resto = conHeader.filter((c) => c !== titulo)

  return (
    <ul className="space-y-3 md:hidden">
      {rows.map((row) => (
        <li
          key={rowKey(row)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={
            'rounded-xl border border-border bg-card p-4' + (onRowClick ? ' cursor-pointer active:bg-secondary' : '')
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 font-semibold break-words text-foreground">
              {titulo ? valor(titulo, row) : null}
            </div>
            {acciones.length ? (
              // Las acciones no deben disparar el toque de la tarjeta.
              <div className="-mt-1 -mr-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {acciones.map((c) => (
                  <div key={c.key}>{valor(c, row)}</div>
                ))}
              </div>
            ) : null}
          </div>
          {resto.length ? (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {resto.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-muted-foreground">{c.header}</dt>
                  <dd className="min-w-0 break-words text-foreground">{valor(c, row)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
