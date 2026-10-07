import type { Prisma, RolObra } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
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
}
