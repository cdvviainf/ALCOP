import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

/** Cliente Prisma o de transacción (secciones con lock por fila de la obra). */
type DbClient = Prisma.TransactionClient | typeof prisma

const diaInclude = {
  usuario: { select: { id: true, nombre: true } },
  formularios: {
    where: { eliminadoEn: null },
    orderBy: { orden: 'asc' as const },
    select: {
      id: true,
      orden: true,
      formulario: { select: { id: true, codigo: true, nombre: true } },
    },
  },
} as const

/** Acceso a datos de Programación de Prevención (CLAUDE.md §12.2). */
export const programacionRepository = {
  /** ¿La obra existe y está viva? (404 del calendario, QA-PP-002). */
  async obraViva(obraId: number): Promise<boolean> {
    const o = await prisma.obra.findFirst({ where: { id: obraId, eliminadoEn: null }, select: { id: true } })
    return o !== null
  },

  /** Agendamientos vivos de una obra viva en el rango [desde, hasta) (el mes del calendario). */
  async listarRango(obraId: number, desde: Date, hasta: Date) {
    return prisma.programacionPrevencion.findMany({
      where: { obraId, eliminadoEn: null, obra: { eliminadoEn: null }, fecha: { gte: desde, lt: hasta } },
      orderBy: { fecha: 'asc' },
      include: diaInclude,
    })
  },

  async buscarDia(id: number) {
    return prisma.programacionPrevencion.findFirst({
      where: { id, eliminadoEn: null, obra: { eliminadoEn: null } },
      include: diaInclude,
    })
  },

  async buscarDiaBasico(id: number, db: DbClient = prisma) {
    return db.programacionPrevencion.findFirst({ where: { id, eliminadoEn: null }, select: { id: true } })
  },

  /** Agendamiento vivo de (obra, fecha), para reutilizar/anexar en vez de duplicar. */
  async buscarPorObraFecha(obraId: number, fecha: Date, db: DbClient = prisma) {
    return db.programacionPrevencion.findFirst({
      where: { obraId, fecha, eliminadoEn: null },
      select: { id: true },
    })
  },

  /** Bloquea el día vivo (FOR UPDATE) — serializa quitar líneas en paralelo (QA-PP-005). */
  async lockDia(tx: Prisma.TransactionClient, id: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number }>
    >`SELECT id FROM "ProgramacionPrevencion" WHERE id = ${id} AND "eliminadoEn" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  /** Bloquea la obra viva (FOR UPDATE) — serializa agendar vs borrar la obra. */
  async lockObraViva(tx: Prisma.TransactionClient, obraId: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number }>
    >`SELECT id FROM "Obra" WHERE id = ${obraId} AND "eliminadoEn" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  /** Titular PREVENCIONISTA vivo de la obra (snapshot del responsable). */
  async titularPrevencionista(obraId: number, db: DbClient = prisma): Promise<string | null> {
    const row = await db.obraTitular.findFirst({
      where: { obraId, rolObra: 'PREVENCIONISTA', eliminadoEn: null },
      select: { usuarioId: true },
    })
    return row?.usuarioId ?? null
  },

  async crearDia(
    data: { obraId: number; fecha: Date; comentario: string | null; usuarioId: string | null; creadoPor: string },
    db: DbClient = prisma
  ) {
    return db.programacionPrevencion.create({
      data: {
        obraId: data.obraId,
        fecha: data.fecha,
        comentario: data.comentario,
        usuarioId: data.usuarioId,
        creadoPor: data.creadoPor,
      },
      select: { id: true },
    })
  },

  async actualizarComentario(id: number, comentario: string | null, actualizadoPor: string, db: DbClient = prisma) {
    return db.programacionPrevencion.update({ where: { id }, data: { comentario, actualizadoPor } })
  },

  async softDeleteDia(id: number, eliminadoPor: string, db: DbClient = prisma) {
    const ahora = new Date()
    await db.formularioProgramado.updateMany({
      where: { programacionId: id, eliminadoEn: null },
      data: { eliminadoEn: ahora, eliminadoPor },
    })
    await db.programacionPrevencion.update({ where: { id }, data: { eliminadoEn: ahora, eliminadoPor } })
  },

  /** Formulario activo del área PREVENCION (validación de lo agendable). */
  async formularioPrevencionActivo(formularioId: number, db: DbClient = prisma) {
    return db.formulario.findFirst({
      where: { id: formularioId, eliminadoEn: null, activo: true, area: { codigo: 'PREVENCION' } },
      select: { id: true },
    })
  },

  /** Ids de formulario ya agendados (vivos) en un día + el mayor orden usado. */
  async lineasVivas(programacionId: number, db: DbClient = prisma) {
    const rows = await db.formularioProgramado.findMany({
      where: { programacionId, eliminadoEn: null },
      select: { formularioId: true, orden: true },
    })
    const ids = new Set(rows.map((r) => r.formularioId))
    const maxOrden = rows.reduce((m, r) => Math.max(m, r.orden), -1)
    return { ids, maxOrden, total: rows.length }
  },

  async crearLinea(
    programacionId: number,
    formularioId: number,
    orden: number,
    creadoPor: string,
    db: DbClient = prisma
  ) {
    return db.formularioProgramado.create({ data: { programacionId, formularioId, orden, creadoPor } })
  },

  /** Bloquea un FormularioProgramado (FOR UPDATE) — serializa con el cierre (QA-RP-009). */
  async lockFp(tx: Prisma.TransactionClient, fpId: number): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "FormularioProgramado" WHERE id = ${fpId} AND "eliminadoEn" IS NULL FOR UPDATE`
  },

  /** Bloquea TODOS los FormularioProgramado vivos del día, en orden determinista (QA-RP-009). */
  async lockFpsDeDia(tx: Prisma.TransactionClient, programacionId: number): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "FormularioProgramado" WHERE "programacionId" = ${programacionId} AND "eliminadoEn" IS NULL ORDER BY id FOR UPDATE`
  },

  /** ¿El formulario programado tiene un registro CERRADO? (histórico, QA-RP-009). */
  async fpTieneRespuestaCerrada(fpId: number, db: DbClient = prisma): Promise<boolean> {
    const r = await db.respuestaFormulario.findFirst({
      where: { formularioProgramadoId: fpId, estado: 'CERRADO' },
      select: { id: true },
    })
    return r !== null
  },

  /** ¿Algún formulario vivo del día tiene un registro CERRADO? (QA-RP-009). */
  async diaTieneRespuestaCerrada(programacionId: number, db: DbClient = prisma): Promise<boolean> {
    const r = await db.respuestaFormulario.findFirst({
      where: { estado: 'CERRADO', formularioProgramado: { programacionId, eliminadoEn: null } },
      select: { id: true },
    })
    return r !== null
  },

  async buscarLinea(fpId: number, programacionId: number, db: DbClient = prisma) {
    return db.formularioProgramado.findFirst({
      where: { id: fpId, programacionId, eliminadoEn: null },
      select: { id: true },
    })
  },

  async softDeleteLinea(fpId: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.formularioProgramado.update({ where: { id: fpId }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  /** Picker: formularios activos de Prevención (para el multiselect del día). */
  async opcionesFormularios(q?: string) {
    return prisma.formulario.findMany({
      where: {
        eliminadoEn: null,
        activo: true,
        area: { codigo: 'PREVENCION' },
        ...(q
          ? { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { codigo: { contains: q, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    })
  },
}
