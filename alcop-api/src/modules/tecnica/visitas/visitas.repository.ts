import type { CalidadImagen, Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarVisitaInput, CrearVisitaInput } from './visitas.schema.js'

/** Cliente Prisma o de transacción (para secciones con lock por fila de la visita). */
type DbClient = Prisma.TransactionClient | typeof prisma

const hallazgoInclude = {
  loteUnidad: { select: { id: true, descripcion: true } },
  tipoHallazgo: { select: { id: true, nombre: true } },
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
    include: {
      loteUnidad: { select: { id: true, descripcion: true } },
      tipoHallazgo: { select: { id: true, nombre: true } },
      fotos: {
        orderBy: { orden: 'asc' as const },
        select: { id: true, mimetype: true, calidad: true, tamano: true, ancho: true, alto: true, orden: true },
      },
    },
  },
} as const

const listaInclude = {
  obra: { select: { id: true, codigo: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  _count: { select: { hallazgos: { where: { eliminadoEn: null } } } },
} as const

/** Acceso a datos de Visitas Técnicas (CLAUDE.md §12.2). */
export const visitasRepository = {
  async listar(pagination: PaginationQuery, q?: string, obraId?: number, estado?: 'EN_CURSO' | 'FINALIZADA') {
    const where: Prisma.VisitaTecnicaWhereInput = {
      eliminadoEn: null,
      ...(obraId ? { obraId } : {}),
      ...(estado ? { estado } : {}),
      ...(q ? { obra: { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { codigo: { contains: q, mode: 'insensitive' } }] } } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.visitaTecnica.findMany({ where, skip, take, orderBy: { id: 'desc' }, include: listaInclude }),
      prisma.visitaTecnica.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.visitaTecnica.findFirst({ where: { id, eliminadoEn: null }, include: detalleInclude })
  },

  /** Datos del reporte: visita + hallazgos + fotos CON binario (para embeber en el PDF). */
  async reporteData(id: number) {
    return prisma.visitaTecnica.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        obra: { select: { codigo: true, nombre: true } },
        usuario: { select: { nombre: true } },
        hallazgos: {
          where: { eliminadoEn: null },
          orderBy: { orden: 'asc' },
          include: {
            loteUnidad: { select: { descripcion: true } },
            tipoHallazgo: { select: { nombre: true } },
            fotos: {
              orderBy: { orden: 'asc' },
              select: { mimetype: true, data: { select: { datos: true } } },
            },
          },
        },
      },
    })
  },

  /** Fila mínima para chequeos de existencia/estado/horas (sin incluir hallazgos). */
  async buscarBasica(id: number) {
    return prisma.visitaTecnica.findFirst({
      where: { id, eliminadoEn: null },
      select: { id: true, obraId: true, estado: true, horaInicio: true, horaTermino: true },
    })
  },

  /** Hallazgos "vacíos" de una visita: sin comentario y sin fotos (bloquean finalizar). */
  async contarHallazgosVacios(visitaId: number, db: DbClient = prisma) {
    return db.hallazgoTecnico.count({
      where: { visitaId, eliminadoEn: null, comentario: null, fotos: { none: {} } },
    })
  },

  async obraExiste(obraId: number) {
    return prisma.obra.findFirst({ where: { id: obraId, eliminadoEn: null }, select: { id: true } })
  },

  async crear(data: CrearVisitaInput, usuarioId: string) {
    return prisma.visitaTecnica.create({
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
    return db.visitaTecnica.update({
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
    return db.visitaTecnica.update({
      where: { id },
      data: { estado: 'FINALIZADA', resumenFinal, actualizadoPor },
      include: detalleInclude,
    })
  },

  async softDelete(id: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.visitaTecnica.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  // ─── Hallazgos ─────────────────────────────────────────────────────────────
  async loteUnidadDeObra(loteUnidadId: number, obraId: number, db: DbClient = prisma) {
    return db.loteUnidad.findFirst({
      where: { id: loteUnidadId, obraId, eliminadoEn: null },
      select: { id: true },
    })
  },

  async tipoHallazgoActivo(tipoHallazgoId: number, db: DbClient = prisma) {
    return db.tipoHallazgoTecnico.findFirst({
      where: { id: tipoHallazgoId, eliminadoEn: null, activo: true },
      select: { id: true },
    })
  },

  async contarHallazgos(visitaId: number, db: DbClient = prisma) {
    return db.hallazgoTecnico.count({ where: { visitaId, eliminadoEn: null } })
  },

  async crearHallazgo(
    visitaId: number,
    data: { loteUnidadId: number; tipoHallazgoId: number; comentario: string | null },
    orden: number,
    db: DbClient = prisma
  ) {
    return db.hallazgoTecnico.create({
      data: {
        visitaId,
        loteUnidadId: data.loteUnidadId,
        tipoHallazgoId: data.tipoHallazgoId,
        comentario: data.comentario,
        orden,
      },
      include: hallazgoInclude,
    })
  },

  async buscarHallazgo(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoTecnico.findFirst({
      where: { id: hallazgoId, eliminadoEn: null },
      select: { id: true, visitaId: true },
    })
  },

  async actualizarHallazgo(
    hallazgoId: number,
    data: { loteUnidadId?: number; tipoHallazgoId?: number; comentario?: string | null },
    db: DbClient = prisma
  ) {
    return db.hallazgoTecnico.update({
      where: { id: hallazgoId },
      data: {
        ...(data.loteUnidadId !== undefined ? { loteUnidadId: data.loteUnidadId } : {}),
        ...(data.tipoHallazgoId !== undefined ? { tipoHallazgoId: data.tipoHallazgoId } : {}),
        ...(data.comentario !== undefined ? { comentario: data.comentario } : {}),
      },
      include: hallazgoInclude,
    })
  },

  async softDeleteHallazgo(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoTecnico.update({ where: { id: hallazgoId }, data: { eliminadoEn: new Date() } })
  },

  // ─── Fotos ─────────────────────────────────────────────────────────────────
  async contarFotos(hallazgoId: number, db: DbClient = prisma) {
    return db.hallazgoFoto.count({ where: { hallazgoId } })
  },

  async crearFoto(
    hallazgoId: number,
    meta: { mimetype: string; calidad: CalidadImagen; tamano: number; ancho: number | null; alto: number | null },
    orden: number,
    datos: Buffer,
    db: DbClient = prisma
  ) {
    return db.hallazgoFoto.create({
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

  /** Binario + contexto de una foto para servir la descarga (verifica no-borrados). */
  async buscarFotoParaDescarga(fotoId: number) {
    return prisma.hallazgoFoto.findFirst({
      where: { id: fotoId, hallazgo: { eliminadoEn: null, visita: { eliminadoEn: null } } },
      select: { mimetype: true, data: { select: { datos: true } } },
    })
  },

  /** Contexto de autorización/estado de una foto (visita de su hallazgo). */
  async buscarFotoConVisita(fotoId: number) {
    return prisma.hallazgoFoto.findFirst({
      where: { id: fotoId },
      select: { id: true, hallazgo: { select: { eliminadoEn: true, visita: { select: { id: true, estado: true, eliminadoEn: true } } } } },
    })
  },

  async borrarFoto(fotoId: number, db: DbClient = prisma) {
    // Foto y su binario son hijos sin auditoría → borrado físico (el caller abre la tx).
    await db.hallazgoFotoData.deleteMany({ where: { fotoId } })
    await db.hallazgoFoto.delete({ where: { id: fotoId } })
  },
}
