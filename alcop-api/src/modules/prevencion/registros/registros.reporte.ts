import type { Prisma, TipoRespuesta } from '@prisma/client'

/** Datos que consume el reporte (desde registrosRepository.reporteData). */
export interface ReporteData {
  programacion: { fecha: Date; obra: { codigo: string; nombre: string } }
  formulario: {
    codigo: string
    nombre: string
    preguntas: Array<{
      id: number
      orden: number
      texto: string
      tipoRespuesta: TipoRespuesta
      opciones: string[]
    }>
  }
  respuesta: {
    estado: string
    fechaRevision: Date | null
    usuario: { nombre: string }
    respuestas: Array<{
      preguntaId: number
      valorTexto: string | null
      valorNumero: Prisma.Decimal | null
      valorCheckbox: string | null
      valorSeleccionMultiple: string[]
      fotos: Array<{ mimetype: string; data: { datos: Uint8Array } | null }>
    }>
  } | null
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function fechaCorta(d: Date): string {
  const [y, m, day] = d.toISOString().slice(0, 10).split('-')
  return `${day}-${m}-${y}`
}

type RespuestaRow = NonNullable<ReporteData['respuesta']>['respuestas'][number]

function valorTexto(tipo: TipoRespuesta, r: RespuestaRow | undefined): string {
  if (!r) return '<span class="muted">Sin respuesta.</span>'
  switch (tipo) {
    case 'NUMERO':
      return r.valorNumero !== null ? esc(String(r.valorNumero)) : '<span class="muted">Sin respuesta.</span>'
    case 'CHECKBOX':
      return r.valorCheckbox ? esc(r.valorCheckbox) : '<span class="muted">Sin respuesta.</span>'
    case 'SELECCION_MULTIPLE':
      return r.valorSeleccionMultiple.length ? esc(r.valorSeleccionMultiple.join(', ')) : '<span class="muted">Sin respuesta.</span>'
    case 'TEXTO':
    case 'TEXTO_LARGO':
      return r.valorTexto ? esc(r.valorTexto) : '<span class="muted">Sin respuesta.</span>'
  }
}

/** HTML self-contained del reporte de un registro de formulario (cerrado). */
export function construirHtmlReporte(reg: ReporteData): string {
  const porPregunta = new Map((reg.respuesta?.respuestas ?? []).map((r) => [r.preguntaId, r]))

  const bloques = [...reg.formulario.preguntas]
    .sort((a, b) => a.orden - b.orden)
    .map((p) => {
      const r = porPregunta.get(p.id)
      const fotos = (r?.fotos ?? [])
        .filter((f) => f.data)
        .map((f) => `<img class="foto" src="data:${f.mimetype};base64,${Buffer.from(f.data!.datos).toString('base64')}" />`)
        .join('')
      return `<div class="item">
        <p class="preg">${esc(p.texto)}</p>
        <p class="resp">${valorTexto(p.tipoRespuesta, r)}</p>
        ${fotos ? `<div class="fotos">${fotos}</div>` : ''}
      </div>`
    })
    .join('')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 12px; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 2px solid #e5484d; padding-bottom: 4px; color: #e5484d; }
  .muted { color: #888; }
  .meta { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .meta td { padding: 3px 8px 3px 0; vertical-align: top; }
  .meta td.k { color: #666; width: 140px; font-weight: 600; }
  .item { border: 1px solid #e3e3e3; border-radius: 6px; padding: 8px 10px; margin: 6px 0; page-break-inside: avoid; }
  .preg { font-weight: 700; margin: 0 0 4px; }
  .resp { margin: 0; white-space: pre-wrap; }
  .fotos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .foto { width: 150px; height: 110px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #eee; }
</style></head><body>
  <h1>Registro de Formulario</h1>
  <span class="badge">COMPLETADO</span>
  <table class="meta">
    <tr><td class="k">Formulario</td><td>${esc(reg.formulario.nombre)} · ${esc(reg.formulario.codigo)}</td></tr>
    <tr><td class="k">Obra</td><td>${esc(reg.programacion.obra.nombre)} · ${esc(reg.programacion.obra.codigo)}</td></tr>
    <tr><td class="k">Fecha programada</td><td>${fechaCorta(reg.programacion.fecha)}</td></tr>
    <tr><td class="k">Fecha de revisión</td><td>${reg.respuesta?.fechaRevision ? fechaCorta(reg.respuesta.fechaRevision) : '—'}</td></tr>
    <tr><td class="k">Completado por</td><td>${reg.respuesta ? esc(reg.respuesta.usuario.nombre) : '—'}</td></tr>
  </table>

  <h2>Respuestas</h2>
  ${bloques || '<p class="muted">Sin preguntas.</p>'}
</body></html>`
}
