import type { CalidadImagen, Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarVisitaInput, CrearVisitaInput } from './visitas.schema.js'

/** Cliente Prisma o de transacción (para secciones con lock por fila de la visita). */
type DbClient = Prisma.TransactionClient | typeof prisma

const hallazgoInclude = {
  categoria: { select: { id: true, nombre: true } },
  subcategoria: { select: { id: true, nombre: true } },
  nivelRiesgo: { select: { id: true, nombre: true } },
  fotos: {
    orderBy: { orden: 'asc' as const },
    select: { id: true, mimetype: true, calidad: true, tamano: true, ancho: true, alto: true, orden: true },
  },
} as const

const detalleInclude = {
  obra: { select: { id: true, codigo: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  hallazgos: {
    where: { eliminadoEn: null },
    orderBy: { orden: 'asc' as const },
    include: hallazgoInclude,
  },
} as const

const listaInclude = {
  obra: { select: { id: true, codigo: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  _count: { select: { hallazgos: { where: { eliminadoEn: null } } } },
} as const

/** Acceso a datos de Visitas de Prevención (CLAUDE.md §12.2). */
export const visitasRepository = {
  async listar(
    pagination: PaginationQuery,
    opts: {
      q?: string
      obraId?: number
      usuarioId?: string
      estado?: 'EN_CURSO' | 'FINALIZADA'
      orden: 'fecha' | 'obra' | 'inspector'
      dir: 'asc' | 'desc'
    }
  ) {
    const { q, obraId, usuarioId, estado, orden, dir } = opts
    const where: Prisma.VisitaPrevencionWhereInput = {
      eliminadoEn: null,
      ...(obraId ? { obraId } : {}),
      ...(usuarioId ? { usuarioId } : {}),
      ...(estado ? { estado } : {}),
      ...(q ? { obra: { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { codigo: { contains: q, mode: 'insensitive' } }] } } : {}),
    }
    const orderBy: Prisma.VisitaPrevencionOrderByWithRelationInput[] =
      orden === 'obra'
        ? [{ obra: { nombre: dir } }, { id: 'desc' }]
        : orden === 'inspector'
          ? [{ usuario: { nombre: dir } }, { id: 'desc' }]
          : [{ fecha: dir }, { id: dir }]
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.visitaPrevencion.findMany({ where, skip, take, orderBy, include: listaInclude }),
      prisma.visitaPrevencion.count({ where }),
    ])
    return { rows, total }
  },

  async inspectores() {
    const rows = await prisma.visitaPrevencion.findMany({
      where: { eliminadoEn: null },
      distinct: ['usuarioId'],
      orderBy: { usuario: { nombre: 'asc' } },
      select: { usuario: { select: { id: true, nombre: true } } },
    })
    return rows.map((r) => r.usuario)
  },

  async buscarPorId(id: number) {
    return prisma.visitaPrevencion.findFirst({ where: { id, eliminadoEn: null }, include: detalleInclude })
  },

  /** Datos del reporte: visita + hallazgos + fotos CON binario (para embeber en el PDF). */
  async reporteData(id: number) {
    return prisma.visitaPrevencion.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        obra: { select: { codigo: true, nombre: true } },
        usuario: { select: { nombre: true } },
        hallazgos: {
          where: { eliminadoEn: null },
          orderBy: { orden: 'asc' },
          include: {
            categoria: { select: { nombre: true } },
            subcategoria: { select: { nombre: true } },
            nivelRiesgo: { select: { nombre: true } },
            fotos: { orderBy: { orden: 'asc' }, select: { mimetype: true, data: { select: { datos: true } } } },
          },
        },
      },
    })
  },

  async buscarBasica(id: number) {
    return prisma.visitaPrevencion.findFirst({
      where: { id, eliminadoEn: null },
      select: { id: true, obraId: true, estado: true, horaInicio: true, horaTermino: true },
    })
  },

  /** Hallazgos (prevención) sin ninguna foto — bloquean finalizar (≥1 foto obligatoria). */
  async contarHallazgosSinFoto(visitaId: number, db: DbClient = prisma) {
    return db.hallazgoPrevencion.count({ where: { visitaId, eliminadoEn: null, fotos: { none: {} } } })
  },

  async obraExiste(obraId: number) {
    return prisma.obra.findFirst({ where: { id: obraId, eliminadoEn: null }, select: { id: true } })
  },

  /** Bloquea la obra viva (FOR UPDATE) — serializa crear-visita vs borrar-obra (QA-OKA-018). */
  async lockObraViva(tx: Prisma.TransactionClient, obraId: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number }>
    >`SELECT id FROM "Obra" WHERE id = ${obraId} AND "eliminadoEn" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  async crear(data: CrearVisitaInput, usuarioId: string, db: DbClient = prisma) {
    return db.visitaPrevencion.create({
      data: {
        obraId: data.obraId,
        usuarioId,
        fecha: data.fecha,
        horaInicio: data.horaInicio ?? null,
        horaTermino: data.horaTermino ?? null,
        creadoPor: usuarioId,
      },
      include: detalleInclude,
    })
  },

  async actualizar(id: number, data: ActualizarVisitaInput, actualizadoPor: string, db: DbClient = prisma) {
    return db.visitaPrevencion.update({
      where: { id },
      data: {
        ...(data.fecha !== undefined ? { fecha: data.fecha } : {}),
        ...(data.horaInicio !== undefined ? { horaInicio: data.horaInicio } : {}),
        ...(data.horaTermino !== undefined ? { horaTermino: data.horaTermino } : {}),
        actualizadoPor,
      },
      include: detalleInclude,
    })
  },

  async finalizar(id: number, resumenFinal: string | null, actualizadoPor: string, db: DbClient = prisma) {
    return db.visitaPrevencion.update({
      where: { id },
      data: { estado: 'FINALIZADA', resumenFinal, actualizadoPor },
      include: detalleInclude,
    })
  },

  async softDelete(id: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.visitaPrevencion.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  // ─── Clasificación ──────────────────────────────────────────────────────────
  /** Categoría activa del área PREVENCION. */
  async categoriaPrevencion(categoriaId: number, db: DbClient = prisma) {
    return db.categoriaFormulario.findFirst({
      where: { id: categoriaId, eliminadoEn: null, activo: true, area: { codigo: 'PREVENCION' } },
      select: { id: true },
    })
  },

  /** Subcategoría activa que pertenece a la categoría dada. */
  async subcategoriaDeCategoria(subcategoriaId: number, categoriaId: number, db: DbClient = prisma) {
    return db.subcategoriaFormulario.findFirst({
      where: { id: subcategoriaId, categoriaId, eliminadoEn: null, activo: true },
      select: { id: true },
    })
  },

  async nivelRiesgoActivo(nivelRiesgoId: number, db: DbClient = prisma) {
    return db.nivelRiesgo.findFirst({ where: { id: nivelRiesgoId, eliminadoEn: null, activo: true }, select: { id: true } })
  },

  // ─── Hallazgos ────────────────────────────────────────────────────────────
  async contarHallazgos(visitaId: number, db: DbClient = prisma) {
    return db.hallazgoPrevencion.count({ where: { visitaId, eliminadoEn: null } })
  },

  async crearHallazgo(
    visitaId: number,
    data: {
      categoriaId: number
      subcategoriaId: number
      nivelRiesgoId: number
      plazoValor: number
      plazoUnidad: 'DIAS' | 'HORAS'
      comentario: string
      creadoPor: string
    },
    orden: number,
    db: DbClient = prisma
  ) {
    return db.hallazgoPrevencion.create({
      data: { visitaId, ...data, orden },
      include: hallazgoInclude,
    })
  },

  async buscarHallazgo(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoPrevencion.findFirst({
      where: { id: hallazgoId, eliminadoEn: null },
      select: { id: true, visitaId: true, categoriaId: true, subcategoriaId: true },
    })
  },

  async buscarHallazgoDetalle(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoPrevencion.findFirst({ where: { id: hallazgoId }, include: hallazgoInclude })
  },

  async actualizarHallazgo(
    hallazgoId: number,
    data: {
      categoriaId?: number
      subcategoriaId?: number
      nivelRiesgoId?: number
      plazoValor?: number
      plazoUnidad?: 'DIAS' | 'HORAS'
      comentario?: string
    },
    actualizadoPor: string,
    db: DbClient = prisma
  ) {
    return db.hallazgoPrevencion.update({
      where: { id: hallazgoId },
      data: {
        ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
        ...(data.subcategoriaId !== undefined ? { subcategoriaId: data.subcategoriaId } : {}),
        ...(data.nivelRiesgoId !== undefined ? { nivelRiesgoId: data.nivelRiesgoId } : {}),
        ...(data.plazoValor !== undefined ? { plazoValor: data.plazoValor } : {}),
        ...(data.plazoUnidad !== undefined ? { plazoUnidad: data.plazoUnidad } : {}),
        ...(data.comentario !== undefined ? { comentario: data.comentario } : {}),
        actualizadoPor,
      },
      include: hallazgoInclude,
    })
  },

  async softDeleteHallazgo(hallazgoId: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.hallazgoPrevencion.update({ where: { id: hallazgoId }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  // ─── Fotos ──────────────────────────────────────────────────────────────────
  async contarFotos(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoPrevencionFoto.count({ where: { hallazgoId } })
  },

  async crearFoto(
    hallazgoId: number,
    meta: { mimetype: string; calidad: CalidadImagen; tamano: number; ancho: number | null; alto: number | null },
    orden: number,
    datos: Buffer,
    db: DbClient = prisma
  ) {
    return db.hallazgoPrevencionFoto.create({
      data: {
        hallazgoId,
        mimetype: meta.mimetype,
        calidad: meta.calidad,
        tamano: meta.tamano,
        ancho: meta.ancho,
        alto: meta.alto,
        orden,
        data: { create: { datos } },
      },
      select: { id: true, mimetype: true, calidad: true, tamano: true, ancho: true, alto: true, orden: true },
    })
  },

  async buscarFotoParaDescarga(fotoId: number) {
    return prisma.hallazgoPrevencionFoto.findFirst({
      where: { id: fotoId, hallazgo: { eliminadoEn: null, visita: { eliminadoEn: null } } },
      select: { mimetype: true, data: { select: { datos: true } } },
    })
  },

  async buscarFotoConVisita(fotoId: number) {
    return prisma.hallazgoPrevencionFoto.findFirst({
      where: { id: fotoId },
      select: { id: true, hallazgo: { select: { eliminadoEn: true, visita: { select: { id: true, estado: true, eliminadoEn: true } } } } },
    })
  },

  async borrarFoto(fotoId: number, db: DbClient = prisma) {
    await db.hallazgoPrevencionFotoData.deleteMany({ where: { fotoId } })
    await db.hallazgoPrevencionFoto.delete({ where: { id: fotoId } })
  },
}
