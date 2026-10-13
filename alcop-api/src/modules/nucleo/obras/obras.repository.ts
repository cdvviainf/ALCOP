import type { Prisma, RolObra } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

/** Cliente Prisma o cliente de transacción (para operaciones atómicas). */
type DbClient = Prisma.TransactionClient | typeof prisma
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { ActualizarObraInput, CrearObraInput } from './obras.schema.js'

const titularInclude = {
  usuario: { select: { id: true, nombre: true, email: true } },
} as const

/** Acceso a datos de Obra y sus titulares (CLAUDE.md §12.2). */
export const obrasRepository = {
  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.ObraWhereInput = {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.obra.findMany({ where, skip, take, orderBy: { id: 'desc' } }),
      prisma.obra.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.obra.findFirst({ where: { id, eliminadoEn: null } })
  },

  async crear(data: CrearObraInput, creadoPor: string) {
    return prisma.obra.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        mandante: data.mandante ?? null,
        direccion: data.direccion ?? null,
        comuna: data.comuna ?? null,
        fechaInicio: data.fechaInicio ?? null,
        fechaTerminoEstimada: data.fechaTerminoEstimada ?? null,
        estado: 'SIN_INICIAR', // nace SIN_INICIAR (nucleo-compartido.md §5.1)
        creadoPor,
      },
    })
  },

  async actualizar(id: number, data: ActualizarObraInput, actualizadoPor: string) {
    return prisma.obra.update({
      where: { id },
      data: {
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.mandante !== undefined ? { mandante: data.mandante } : {}),
        ...(data.direccion !== undefined ? { direccion: data.direccion } : {}),
        ...(data.comuna !== undefined ? { comuna: data.comuna } : {}),
        ...(data.fechaInicio !== undefined ? { fechaInicio: data.fechaInicio } : {}),
        ...(data.fechaTerminoEstimada !== undefined ? { fechaTerminoEstimada: data.fechaTerminoEstimada } : {}),
        ...(data.estado !== undefined ? { estado: data.estado } : {}),
        actualizadoPor,
      },
    })
  },

  async softDelete(id: number, eliminadoPor: string) {
    return prisma.obra.update({
      where: { id },
      data: { eliminadoEn: new Date(), eliminadoPor },
    })
  },

  async contarRespuestas(obraId: number) {
    return prisma.respuestaFormulario.count({ where: { obraId } })
  },

  // ─── Titulares ──────────────────────────────────────────────────────────
  async listarTitulares(obraId: number) {
    return prisma.usuarioObra.findMany({
      where: { obraId, eliminadoEn: null },
      orderBy: [{ rolObra: 'asc' }, { id: 'asc' }],
      include: titularInclude,
    })
  },

  async buscarTitular(id: number) {
    return prisma.usuarioObra.findFirst({ where: { id, eliminadoEn: null }, include: titularInclude })
  },

  async existeTitular(obraId: number, rolObra: RolObra, usuarioId: string) {
    const existente = await prisma.usuarioObra.findFirst({
      where: { obraId, rolObra, usuarioId, eliminadoEn: null },
      select: { id: true },
    })
    return existente !== null
  },

  async crearTitular(obraId: number, rolObra: RolObra, usuarioId: string, creadoPor: string) {
    // El @@unique([obraId, rolObra, usuarioId]) incluye las filas soft-deleted:
    // si existe una asignación previa (retirada), se revive en vez de insertar
    // (evita el P2002 — OBR-001).
    const existente = await prisma.usuarioObra.findFirst({ where: { obraId, rolObra, usuarioId } })
    if (existente) {
      // Reactivación: conserva creadoEn/creadoPor originales; el actor queda en
      // actualizadoPor (actualizadoEn lo pone @updatedAt). OBR-008.
      return prisma.usuarioObra.update({
        where: { id: existente.id },
        data: { eliminadoEn: null, eliminadoPor: null, actualizadoPor: creadoPor },
        include: titularInclude,
      })
    }
    return prisma.usuarioObra.create({
      data: { obraId, rolObra, usuarioId, creadoPor },
      include: titularInclude,
    })
  },

  async softDeleteTitular(id: number, eliminadoPor: string) {
    return prisma.usuarioObra.update({
      where: { id },
      data: { eliminadoEn: new Date(), eliminadoPor },
    })
  },

  async buscarUsuarioParaTitular(usuarioId: string) {
    return prisma.usuario.findFirst({
      where: { id: usuarioId, eliminadoEn: null, activo: true },
      select: {
        id: true,
        esAdmin: true,
        perfil: { select: { areaPrevencion: true, areaTecnica: true } },
      },
    })
  },

  // ─── Lotes de la obra ─────────────────────────────────────────────────────
  async listarLotes(obraId: number) {
    return prisma.obraLote.findMany({
      where: { obraId, eliminadoEn: null },
      orderBy: [{ tipoLote: { orden: 'asc' } }, { id: 'asc' }],
      include: { tipoLote: { select: { id: true, codigo: true, nombre: true, activo: true } } },
    })
  },

  async buscarLote(id: number) {
    return prisma.obraLote.findFirst({
      where: { id, eliminadoEn: null },
      include: { tipoLote: { select: { id: true, codigo: true, nombre: true, activo: true } } },
    })
  },

  async tipoLoteActivo(tipoLoteId: number) {
    return prisma.tipoLote.findFirst({
      where: { id: tipoLoteId, eliminadoEn: null, activo: true },
      select: { id: true },
    })
  },

  // Los métodos de lote/unidad aceptan un cliente de transacción (`db`) para que
  // el cambio de ObraLote y la sincronización de LoteUnidad sean atómicos
  // (QA-OLA-A-006). Por defecto usan el cliente global.
  async crearLote(obraId: number, tipoLoteId: number, cantidad: number, creadoPor: string, db: DbClient = prisma) {
    // El @@unique([obraId, tipoLoteId]) incluye filas soft-deleted: si existe una
    // configuración previa retirada, se revive en vez de insertar (evita P2002).
    const existente = await db.obraLote.findFirst({ where: { obraId, tipoLoteId } })
    if (existente) {
      if (existente.eliminadoEn === null) return null // conflicto real: ya está activo
      return db.obraLote.update({
        where: { id: existente.id },
        data: { cantidad, eliminadoEn: null, eliminadoPor: null, actualizadoPor: creadoPor },
        include: { tipoLote: { select: { id: true, codigo: true, nombre: true, activo: true } } },
      })
    }
    return db.obraLote.create({
      data: { obraId, tipoLoteId, cantidad, creadoPor },
      include: { tipoLote: { select: { id: true, codigo: true, nombre: true, activo: true } } },
    })
  },

  async actualizarLote(id: number, cantidad: number, actualizadoPor: string, db: DbClient = prisma) {
    return db.obraLote.update({
      where: { id },
      data: { cantidad, actualizadoPor },
      include: { tipoLote: { select: { id: true, codigo: true, nombre: true, activo: true } } },
    })
  },

  async softDeleteLote(id: number, eliminadoPor: string, db: DbClient = prisma) {
    return db.obraLote.update({ where: { id }, data: { eliminadoEn: new Date(), eliminadoPor } })
  },

  // ─── Unidades de lote (autogeneradas desde ObraLote — Docs/tecnica.md §5.1) ──
  /** Todas las unidades de un tipo en la obra (incluye soft-deleted, para revivir). */
  async unidadesDelTipo(obraId: number, tipoLoteId: number, db: DbClient = prisma) {
    return db.loteUnidad.findMany({
      where: { obraId, tipoLoteId },
      select: { id: true, correlativo: true, descripcion: true, eliminadoEn: true },
    })
  },

  /** De un set de unidades, cuáles tienen hallazgos (bloquean su eliminación). */
  async unidadesConHallazgos(ids: number[], db: DbClient = prisma) {
    if (ids.length === 0) return []
    const rows = await db.hallazgoTecnico.groupBy({
      by: ['loteUnidadId'],
      where: { loteUnidadId: { in: ids }, eliminadoEn: null },
      _count: { _all: true },
    })
    return rows.map((r) => r.loteUnidadId)
  },

  /** Aplica la sincronización de unidades (crear/revivir/renombrar/quitar). Usa el
   *  `db` dado (la transacción la abre el service para incluir también el ObraLote). */
  async aplicarSyncUnidades(
    obraId: number,
    tipoLoteId: number,
    aCrear: Array<{ correlativo: number; descripcion: string }>,
    aRevivir: Array<{ id: number; descripcion: string }>,
    aRenombrar: Array<{ id: number; descripcion: string }>,
    idsQuitar: number[],
    db: DbClient = prisma
  ) {
    if (aCrear.length) {
      await db.loteUnidad.createMany({
        data: aCrear.map((u) => ({ obraId, tipoLoteId, correlativo: u.correlativo, descripcion: u.descripcion })),
      })
    }
    for (const r of aRevivir) {
      await db.loteUnidad.update({ where: { id: r.id }, data: { eliminadoEn: null, descripcion: r.descripcion } })
    }
    // Reajuste de descripción cuando cambia el ancho del padding (p. ej. al cruzar 999).
    for (const r of aRenombrar) {
      await db.loteUnidad.update({ where: { id: r.id }, data: { descripcion: r.descripcion } })
    }
    if (idsQuitar.length) {
      await db.loteUnidad.updateMany({ where: { id: { in: idsQuitar } }, data: { eliminadoEn: new Date() } })
    }
  },

  /** Unidades activas de una obra (para el selector de hallazgos). */
  async listarUnidades(obraId: number) {
    return prisma.loteUnidad.findMany({
      where: { obraId, eliminadoEn: null },
      orderBy: [{ tipoLote: { orden: 'asc' } }, { tipoLoteId: 'asc' }, { correlativo: 'asc' }],
      select: {
        id: true,
        descripcion: true,
        correlativo: true,
        tipoLote: { select: { id: true, nombre: true } },
      },
    })
  },

  /**
   * Derivación de formularios aplicables (lotes-procedimientos.md §5.4): recorre
   * Obra → Lotes activos → TipoLote activo → Procedimiento activo → Formulario
   * activo, considerando solo filas no eliminadas en toda la cadena.
   */
  async lotesParaDerivacion(obraId: number) {
    return prisma.obraLote.findMany({
      where: { obraId, eliminadoEn: null, tipoLote: { eliminadoEn: null, activo: true } },
      orderBy: [{ tipoLote: { orden: 'asc' } }, { id: 'asc' }],
      include: {
        tipoLote: {
          select: {
            id: true,
            nombre: true,
            procedimientos: {
              where: { procedimiento: { eliminadoEn: null, activo: true } },
              include: {
                procedimiento: {
                  select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    formularios: {
                      where: { formulario: { eliminadoEn: null, activo: true } },
                      include: {
                        formulario: { select: { id: true, codigo: true, nombre: true, areaId: true, activo: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  },
}
