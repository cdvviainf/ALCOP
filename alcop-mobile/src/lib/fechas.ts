// Fechas en la zona de las obras (igual que la API y la web).
const TZ = 'America/Santiago'

const diaFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const horaFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })

/** Hoy como YYYY-MM-DD. */
export function hoyIso(): string {
  return diaFmt.format(new Date())
}

/** Hora actual como HH:MM. */
export function horaActual(): string {
  return horaFmt.format(new Date())
}

/** YYYY-MM-DD válido. */
export function esFecha(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())
}

/** HH:MM válido. */
export function esHora(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s)
}

/** "2026-11-27" (o ISO completo) → "27-11-2026". */
export function fechaCl(s: string): string {
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}-${m}-${y}`
}
