import type { AreaProgramacion } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { whereObrasVisibles, type AlcanceObras } from '../../../shared/obra-alcance.js'

/**
 * Agregados del Dashboard (CLAUDE.md §12.2). Todo se acota a las obras visibles del
 * usuario: primero se resuelven sus ids y el resto de las consultas filtra por
 * `obraId IN (...)` con agregaciones en la BD (groupBy / COUNT), nunca filas sueltas.
 */
export const dashboardRepository = {
  async obrasVisibles(alcance: AlcanceObras) {
    return prisma.obra.findMany({
      where: { eliminadoEn: null, ...whereObrasVisibles(alcance) },
      select: { id: true, codigo: true, nombre: true, estado: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    })
  },

  async visitasTecnicasPorObra(obraIds: number[]) {
    return prisma.visitaTecnica.groupBy({
      by: ['obraId'],
      where: { obraId: { in: obraIds }, eliminadoEn: null },
      _count: { _all: true },
    })
  },

  async visitasPrevencionPorObra(obraIds: number[]) {
    return prisma.visitaPrevencion.groupBy({
      by: ['obraId'],
      where: { obraId: { in: obraIds }, eliminadoEn: null },
      _count: { _all: true },
    })
  },

  /** Hallazgos técnicos (tipoRegistro HALLAZGO; las notas técnicas no cuentan) por obra × tipo. */
  async hallazgosTecnicosPorObraTipo(obraIds: number[]) {
    if (!obraIds.length) return []
    return prisma.$queryRaw<Array<{ obraId: number; tipoId: number | null; n: number }>>`
      SELECT v."obraId" AS "obraId", h."tipoHallazgoId" AS "tipoId", COUNT(*)::int AS n
      FROM "HallazgoTecnico" h
      JOIN "VisitaTecnica" v ON v.id = h."visitaId"
      WHERE h."eliminadoEn" IS NULL AND v."eliminadoEn" IS NULL
        AND h."tipoRegistro" = 'HALLAZGO'
        AND v."obraId" = ANY(${obraIds})
      GROUP BY 1, 2`
  },

  /** Hallazgos de prevención por obra × nivel de riesgo. */
  async hallazgosPrevencionPorObraNivel(obraIds: number[]) {
    if (!obraIds.length) return []
    return prisma.$queryRaw<Array<{ obraId: number; nivelId: number; n: number }>>`
      SELECT v."obraId" AS "obraId", h."nivelRiesgoId" AS "nivelId", COUNT(*)::int AS n
      FROM "HallazgoPrevencion" h
      JOIN "VisitaPrevencion" v ON v.id = h."visitaId"
      WHERE h."eliminadoEn" IS NULL AND v."eliminadoEn" IS NULL
        AND v."obraId" = ANY(${obraIds})
      GROUP BY 1, 2`
  },

  /** Visitas por mes ('YYYY-MM') desde `desde` (día @ UTC medianoche, como se guarda `fecha`). */
  async visitasTecnicasPorMes(obraIds: number[], desde: Date) {
    if (!obraIds.length) return []
    return prisma.$queryRaw<Array<{ mes: string; n: number }>>`
      SELECT to_char(v.fecha, 'YYYY-MM') AS mes, COUNT(*)::int AS n
      FROM "VisitaTecnica" v
      WHERE v."eliminadoEn" IS NULL AND v.fecha >= ${desde} AND v."obraId" = ANY(${obraIds})
      GROUP BY 1`
  },

  async visitasPrevencionPorMes(obraIds: number[], desde: Date) {
    if (!obraIds.length) return []
    return prisma.$queryRaw<Array<{ mes: string; n: number }>>`
      SELECT to_char(v.fecha, 'YYYY-MM') AS mes, COUNT(*)::int AS n
      FROM "VisitaPrevencion" v
      WHERE v."eliminadoEn" IS NULL AND v.fecha >= ${desde} AND v."obraId" = ANY(${obraIds})
      GROUP BY 1`
  },

  async tiposHallazgo() {
    return prisma.tipoHallazgoTecnico.findMany({
      where: { eliminadoEn: null },
      select: { id: true, codigo: true, nombre: true, orden: true, activo: true },
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    })
  },

  async nivelesRiesgo() {
    return prisma.nivelRiesgo.findMany({
      where: { eliminadoEn: null },
      select: { id: true, codigo: true, nombre: true, orden: true, activo: true },
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    })
  },

  /**
   * Formularios agendados donde el usuario es el responsable del día, sin cerrar
   * (sin respuesta o en BORRADOR), agendados hasta `limite`. El service clasifica
   * en atrasadas / próximas.
   */
  async agendaDelUsuario(usuarioId: string, obraIds: number[], areas: AreaProgramacion[], limite: Date) {
    if (!obraIds.length || !areas.length) return []
    return prisma.formularioProgramado.findMany({
      where: {
        eliminadoEn: null,
        formulario: { eliminadoEn: null },
        programacion: {
          eliminadoEn: null,
          usuarioId,
          obraId: { in: obraIds },
          area: { in: areas },
          fecha: { lte: limite },
        },
        OR: [{ respuesta: { is: null } }, { respuesta: { is: { estado: 'BORRADOR' } } }],
      },
      select: {
        id: true,
        fechaInicio: true,
        fechaTermino: true,
        formulario: { select: { id: true, codigo: true, nombre: true } },
        respuesta: { select: { estado: true } },
        programacion: {
          select: { area: true, fecha: true, obra: { select: { id: true, codigo: true, nombre: true } } },
        },
      },
      orderBy: [{ programacion: { fecha: 'asc' } }, { id: 'asc' }],
      take: 300,
    })
  },
}
