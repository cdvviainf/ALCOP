import type { EstadoVisita, PlazoUnidad } from '@prisma/client'

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
    categoria: { nombre: string }
    subcategoria: { nombre: string }
    nivelRiesgo: { nombre: string }
    plazoValor: number
    plazoUnidad: PlazoUnidad
    comentario: string
    fotos: Array<{ mimetype: string; data: { datos: Uint8Array } | null }>
  }>
}

type ReporteHallazgo = ReporteData['hallazgos'][number]

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fechaCorta(d: Date): string {
  const iso = d.toISOString().slice(0, 10)
  const [y, m, day] = iso.split('-')
  return `${day}-${m}-${y}`
}

function plazoTexto(h: ReporteHallazgo): string {
  const unidad = h.plazoUnidad === 'HORAS' ? 'hora' : 'día'
  return `${h.plazoValor} ${unidad}${h.plazoValor === 1 ? '' : 's'}`
}

/** HTML self-contained del reporte de una visita de prevención (Docs/prevencion.md). */
export function construirHtmlReporte(v: ReporteData): string {
  const horas = v.horaInicio || v.horaTermino ? `${v.horaInicio ?? '—'} a ${v.horaTermino ?? '—'}` : 'No registrada'

  // Hallazgos agrupados por Categoría (clasificación primaria de prevención).
  const porCategoria = new Map<string, ReporteHallazgo[]>()
  for (const h of v.hallazgos) {
    const k = h.categoria.nombre
    if (!porCategoria.has(k)) porCategoria.set(k, [])
    porCategoria.get(k)!.push(h)
  }

  const filaDe = (h: ReporteHallazgo) => {
    const fotos = h.fotos
      .filter((f) => f.data)
      .map((f) => `<img class="foto" src="data:${f.mimetype};base64,${Buffer.from(f.data!.datos).toString('base64')}" />`)
      .join('')
    return `<div class="hallazgo">
      <div class="h-head">
        <span class="sub">${esc(h.subcategoria.nombre)}</span>
        <span class="badge">${esc(h.nivelRiesgo.nombre)}</span>
        <span class="plazo">Plazo: ${esc(plazoTexto(h))}</span>
      </div>
      <p class="comentario">${esc(h.comentario)}</p>
      ${fotos ? `<div class="fotos">${fotos}</div>` : ''}
    </div>`
  }

  const seccionHallazgos = [...porCategoria.entries()]
    .map(
      ([cat, items]) =>
        `<div class="grupo"><h3>${esc(cat)} <span class="count">(${items.length})</span></h3>${items.map(filaDe).join('')}</div>`
    )
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
  .grupo { margin-bottom: 10px; }
  .hallazgo { border: 1px solid #e3e3e3; border-radius: 6px; padding: 8px 10px; margin: 6px 0; page-break-inside: avoid; }
  .h-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sub { font-weight: 700; }
  .plazo { color: #666; font-size: 11px; }
  .comentario { margin: 4px 0; white-space: pre-wrap; }
  .fotos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .foto { width: 150px; height: 110px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .resumen { white-space: pre-wrap; border: 1px solid #e3e3e3; border-radius: 6px; padding: 10px; background: #fafafa; }
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #eee; }
</style></head><body>
  <h1>Reporte de Visita de Prevención</h1>
  <span class="badge">${v.estado === 'FINALIZADA' ? 'FINALIZADA' : 'EN CURSO'}</span>
  <table class="meta">
    <tr><td class="k">Inspector</td><td>${esc(v.usuario.nombre)}</td></tr>
    <tr><td class="k">Obra</td><td>${esc(v.obra.nombre)} · ${esc(v.obra.codigo)}</td></tr>
    <tr><td class="k">Fecha</td><td>${fechaCorta(v.fecha)}</td></tr>
    <tr><td class="k">Horario</td><td>${horas}</td></tr>
  </table>

  <h2>Hallazgos por categoría</h2>
  ${seccionHallazgos || '<p class="muted">Sin hallazgos.</p>'}

  <h2>Resumen final</h2>
  <div class="resumen">${v.resumenFinal ? esc(v.resumenFinal) : '<span class="muted">Sin resumen.</span>'}</div>
</body></html>`
}
