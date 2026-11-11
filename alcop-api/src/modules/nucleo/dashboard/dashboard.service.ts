import type { AreaProgramacion, EstadoObra, NivelAcceso } from '@prisma/client'
import type { AlcanceObras } from '../../../shared/obra-alcance.js'
import { dashboardRepository } from './dashboard.repository.js'
import { NotFoundError } from '../../../shared/errors.js'
import type { VisitasMensualesDTO } from './dashboard.types.js'
import type { AgendaItemDTO, AreaResumenDTO, CategoriaConteoDTO, DashboardDTO, ObraResumenDTO } from './dashboard.types.js'

const TZ_OBRA = 'America/Santiago'
const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_OBRA, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Fecha @db.Date (UTC medianoche) → 'YYYY-MM-DD'. */
const dia = (d: Date) => d.toISOString().slice(0, 10)

function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return dia(d)
}

export interface ContextoDashboard {
  alcance: AlcanceObras
  permisos: Record<string, NivelAcceso>
}

/** ≥ LECTURA en alguna de las funciones (esAdmin siempre). */
function puede(ctx: ContextoDashboard, codigos: string[]): boolean {
  if (ctx.alcance.esAdmin) return true
  return codigos.some((c) => (ctx.permisos[c] ?? 'SIN_ACCESO') !== 'SIN_ACCESO')
}

type Catalogo = Array<{ id: number; codigo: string; nombre: string; activo: boolean }>

/**
 * Arma el conteo por categoría de catálogo. Incluye las activas aunque estén en 0
 * y las inactivas solo si tienen hallazgos (histórico).
 */
function porCategoria(catalogo: Catalogo, conteo: Map<number | null, number>, sinTipo = false): CategoriaConteoDTO[] {
  const out: CategoriaConteoDTO[] = catalogo
    .filter((c) => c.activo || (conteo.get(c.id) ?? 0) > 0)
    .map((c) => ({ id: c.id, codigo: c.codigo, nombre: c.nombre, n: conteo.get(c.id) ?? 0 }))
  const nulos = conteo.get(null) ?? 0
  if (sinTipo && nulos > 0) out.push({ id: null, codigo: 'SIN_TIPO', nombre: 'Sin tipo', n: nulos })
  return out
}

/** Dashboard (Panel de obras y resumen): visibilidad por obra (acceso) y por área (perfil). */
export const dashboardService = {
  async obtener(ctx: ContextoDashboard, dias: number): Promise<DashboardDTO> {
    const verTecnica = puede(ctx, ['TEC_INSPECCION'])
    const verPrevencion = puede(ctx, ['PREV_INSPECCION'])
    const areasAgenda: AreaProgramacion[] = []
    if (puede(ctx, ['PREV_REGISTROS', 'PREV_PROGRAMACION'])) areasAgenda.push('PREVENCION')
    if (puede(ctx, ['TEC_REGISTROS', 'TEC_PROGRAMACION'])) areasAgenda.push('TECNICA')
    const registrar: AreaProgramacion[] = []
    if (puede(ctx, ['PREV_REGISTROS'])) registrar.push('PREVENCION')
    if (puede(ctx, ['TEC_REGISTROS'])) registrar.push('TECNICA')

    const hoy = fmtDia.format(new Date())
    const limite = sumarDias(hoy, dias)

    const obras = await dashboardRepository.obrasVisibles(ctx.alcance)
    const ids = obras.map((o) => o.id)

    const [visTec, visPrev, hallTec, hallPrev, tipos, niveles, agendaRows] = await Promise.all([
      verTecnica ? dashboardRepository.visitasTecnicasPorObra(ids) : [],
      verPrevencion ? dashboardRepository.visitasPrevencionPorObra(ids) : [],
      verTecnica ? dashboardRepository.hallazgosTecnicosPorObraTipo(ids) : [],
      verPrevencion ? dashboardRepository.hallazgosPrevencionPorObraNivel(ids) : [],
      verTecnica ? dashboardRepository.tiposHallazgo() : [],
      verPrevencion ? dashboardRepository.nivelesRiesgo() : [],
      dashboardRepository.agendaDelUsuario(ctx.alcance.usuarioId, ids, areasAgenda, new Date(`${limite}T00:00:00Z`)),
    ])

    // ─── Conteos por obra ───────────────────────────────────────────────────
    const visTecObra = new Map(visTec.map((r) => [r.obraId, r._count._all]))
    const visPrevObra = new Map(visPrev.map((r) => [r.obraId, r._count._all]))
    const hallTecObra = new Map<number, Map<number | null, number>>()
    const hallTecTotal = new Map<number | null, number>()
    for (const r of hallTec) {
      const m = hallTecObra.get(r.obraId) ?? new Map<number | null, number>()
      m.set(r.tipoId, (m.get(r.tipoId) ?? 0) + r.n)
      hallTecObra.set(r.obraId, m)
      hallTecTotal.set(r.tipoId, (hallTecTotal.get(r.tipoId) ?? 0) + r.n)
    }
    const hallPrevObra = new Map<number, Map<number | null, number>>()
    const hallPrevTotal = new Map<number | null, number>()
    for (const r of hallPrev) {
      const m = hallPrevObra.get(r.obraId) ?? new Map<number | null, number>()
      m.set(r.nivelId, (m.get(r.nivelId) ?? 0) + r.n)
      hallPrevObra.set(r.obraId, m)
      hallPrevTotal.set(r.nivelId, (hallPrevTotal.get(r.nivelId) ?? 0) + r.n)
    }

    const resumenTec = (visitas: number, conteo: Map<number | null, number>): AreaResumenDTO => ({
      visitas,
      hallazgos: porCategoria(tipos, conteo, true),
    })
    const resumenPrev = (visitas: number, conteo: Map<number | null, number>): AreaResumenDTO => ({
      visitas,
      hallazgos: porCategoria(niveles, conteo),
    })

    const porEstado: Record<EstadoObra, number> = { SIN_INICIAR: 0, EN_EJECUCION: 0, SUSPENDIDA: 0, TERMINADA: 0 }
    for (const o of obras) porEstado[o.estado]++

    const porObra: ObraResumenDTO[] = obras.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      nombre: o.nombre,
      estado: o.estado,
      tecnica: verTecnica ? resumenTec(visTecObra.get(o.id) ?? 0, hallTecObra.get(o.id) ?? new Map()) : null,
      prevencion: verPrevencion ? resumenPrev(visPrevObra.get(o.id) ?? 0, hallPrevObra.get(o.id) ?? new Map()) : null,
    }))

    // ─── Agenda ─────────────────────────────────────────────────────────────
    // Prevención: vence el mismo día agendado y se cumple al CERRAR su registro.
    // Técnica: ventana inicio–término; su cumplimiento aún no se registra contra la
    // programación (programacion-prevencion.md v0.2 — diferido), así que no se
    // marca como atrasada: sale mientras la ventana siga vigente.
    const atrasadas: AgendaItemDTO[] = []
    const proximas: AgendaItemDTO[] = []
    for (const r of agendaRows) {
      const tec = r.programacion.area === 'TECNICA'
      const fecha = tec && r.fechaInicio ? dia(r.fechaInicio) : dia(r.programacion.fecha)
      const vence = tec && r.fechaTermino ? dia(r.fechaTermino) : dia(r.programacion.fecha)
      const item: AgendaItemDTO = {
        id: r.id,
        area: r.programacion.area,
        fecha,
        vence,
        enBorrador: r.respuesta?.estado === 'BORRADOR',
        obra: r.programacion.obra,
        formulario: r.formulario,
      }
      if (vence < hoy) {
        if (!tec) atrasadas.push(item)
      } else if (fecha <= limite) {
        proximas.push(item)
      }
    }
    const porFecha = (a: AgendaItemDTO, b: AgendaItemDTO) => a.fecha.localeCompare(b.fecha) || a.id - b.id
    atrasadas.sort(porFecha)
    proximas.sort(porFecha)

    return {
      hoy,
      permisos: { tecnica: verTecnica, prevencion: verPrevencion, agenda: areasAgenda, registrar },
      obras: { total: obras.length, porEstado },
      tecnica: verTecnica
        ? resumenTec(
            visTec.reduce((s, r) => s + r._count._all, 0),
            hallTecTotal
          )
        : null,
      prevencion: verPrevencion
        ? resumenPrev(
            visPrev.reduce((s, r) => s + r._count._all, 0),
            hallPrevTotal
          )
        : null,
      porObra,
      agenda: { dias, atrasadas, proximas },
    }
  },

  /** Serie mensual de visitas por área; filtrable por una obra visible (si no, 404). */
  async visitasMensuales(ctx: ContextoDashboard, meses: number, obraId?: number): Promise<VisitasMensualesDTO> {
    const verTecnica = puede(ctx, ['TEC_INSPECCION'])
    const verPrevencion = puede(ctx, ['PREV_INSPECCION'])

    const visibles = (await dashboardRepository.obrasVisibles(ctx.alcance)).map((o) => o.id)
    if (obraId !== undefined && !visibles.includes(obraId)) throw new NotFoundError('Obra', String(obraId))
    const ids = obraId !== undefined ? [obraId] : visibles

    const [anio, mes] = fmtDia.format(new Date()).split('-').map(Number)
    const lista: string[] = []
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(anio, mes - 1 - i, 1))
      lista.push(d.toISOString().slice(0, 7))
    }
    const desde = new Date(`${lista[0]}-01T00:00:00Z`)

    const [tec, prev] = await Promise.all([
      verTecnica ? dashboardRepository.visitasTecnicasPorMes(ids, desde) : null,
      verPrevencion ? dashboardRepository.visitasPrevencionPorMes(ids, desde) : null,
    ])
    const serie = (rows: Array<{ mes: string; n: number }> | null) => {
      if (!rows) return null
      const m = new Map(rows.map((r) => [r.mes, r.n]))
      return lista.map((k) => m.get(k) ?? 0)
    }
    return { obraId: obraId ?? null, meses: lista, tecnica: serie(tec), prevencion: serie(prev) }
  },
}
