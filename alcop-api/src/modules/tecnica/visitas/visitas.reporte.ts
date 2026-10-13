import type { EstadoVisita } from '@prisma/client'

/** Datos que consume el reporte (desde visitasRepository.reporteData). */
export interface ReporteData {
  obra: { codigo: string; nombre: string }
  usuario: { nombre: string }
  fecha: Date
  horaInicio: string | null
  horaTermino: string | null
  estado: EstadoVisita
  resumenFinal: string | null
  hallazgos: Array<{
    loteUnidad: { descripcion: string }
    tipoHallazgo: { nombre: string }
    comentario: string | null
    fotos: Array<{ mimetype: string; data: { datos: Uint8Array } | null }>
  }>
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fechaCorta(d: Date): string {
  const iso = d.toISOString().slice(0, 10) // YYYY-MM-DD
  const [y, m, day] = iso.split('-')
  return `${day}-${m}-${y}`
}

/** Construye el HTML self-contained del reporte de una visita (Docs/tecnica.md §5.5). */
export function construirHtmlReporte(v: ReporteData): string {
  const horas =
    v.horaInicio || v.horaTermino ? `${v.horaInicio ?? '—'} a ${v.horaTermino ?? '—'}` : 'No registrada'

  // Lotes inspeccionados: unidades distintas con hallazgos, en orden de aparición.
  const lotesSet = new Set<string>()
  for (const h of v.hallazgos) lotesSet.add(h.loteUnidad.descripcion)
  const lotes = [...lotesSet]

  // Hallazgos agrupados por tipo.
  const porTipo = new Map<string, ReporteData['hallazgos']>()
  for (const h of v.hallazgos) {
    const k = h.tipoHallazgo.nombre
    if (!porTipo.has(k)) porTipo.set(k, [])
    porTipo.get(k)!.push(h)
  }

  const seccionLotes = lotes.length
    ? `<ul class="lotes">${lotes.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
    : '<p class="muted">Sin lotes inspeccionados.</p>'

  const seccionHallazgos = [...porTipo.entries()]
    .map(([tipo, items]) => {
      const filas = items
        .map((h) => {
          const fotos = h.fotos
            .filter((f) => f.data)
            .map(
              (f) =>
                `<img class="foto" src="data:${f.mimetype};base64,${Buffer.from(f.data!.datos).toString('base64')}" />`
            )
            .join('')
          return `<div class="hallazgo">
            <div class="h-head"><span class="unidad">${esc(h.loteUnidad.descripcion)}</span></div>
            ${h.comentario ? `<p class="comentario">${esc(h.comentario)}</p>` : '<p class="muted">Sin comentario.</p>'}
            ${fotos ? `<div class="fotos">${fotos}</div>` : ''}
          </div>`
        })
        .join('')
      return `<div class="grupo"><h3>${esc(tipo)} <span class="count">(${items.length})</span></h3>${filas}</div>`
    })
    .join('')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 12px; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 2px solid #e5484d; padding-bottom: 4px; color: #e5484d; }
  h3 { font-size: 13px; margin: 14px 0 6px; }
  .count { color: #888; font-weight: normal; }
  .muted { color: #888; }
  .meta { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .meta td { padding: 3px 8px 3px 0; vertical-align: top; }
  .meta td.k { color: #666; width: 130px; font-weight: 600; }
  .lotes { margin: 0; padding-left: 18px; columns: 3; }
  .lotes li { margin: 2px 0; }
  .grupo { margin-bottom: 10px; }
  .hallazgo { border: 1px solid #e3e3e3; border-radius: 6px; padding: 8px 10px; margin: 6px 0; page-break-inside: avoid; }
  .unidad { font-weight: 700; }
  .comentario { margin: 4px 0; white-space: pre-wrap; }
  .fotos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .foto { width: 150px; height: 110px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .resumen { white-space: pre-wrap; border: 1px solid #e3e3e3; border-radius: 6px; padding: 10px; background: #fafafa; }
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #eee; }
</style></head><body>
  <h1>Reporte de Visita Técnica</h1>
  <span class="badge">${v.estado === 'FINALIZADA' ? 'FINALIZADA' : 'EN CURSO'}</span>
  <table class="meta">
    <tr><td class="k">Inspector</td><td>${esc(v.usuario.nombre)}</td></tr>
    <tr><td class="k">Obra</td><td>${esc(v.obra.nombre)} · ${esc(v.obra.codigo)}</td></tr>
    <tr><td class="k">Fecha</td><td>${fechaCorta(v.fecha)}</td></tr>
    <tr><td class="k">Horario</td><td>${horas}</td></tr>
  </table>

  <h2>Lotes inspeccionados</h2>
  ${seccionLotes}

  <h2>Hallazgos por tipo</h2>
  ${seccionHallazgos || '<p class="muted">Sin hallazgos.</p>'}

  <h2>Resumen final</h2>
  <div class="resumen">${v.resumenFinal ? esc(v.resumenFinal) : '<span class="muted">Sin resumen.</span>'}</div>
</body></html>`
}
