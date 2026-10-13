import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { PreguntaInput } from './formularios.schema.js'

const detalleInclude = {
  area: { select: { codigo: true, nombre: true } },
  categoria: { select: { nombre: true } },
  preguntas: { orderBy: { orden: 'asc' } },
  _count: { select: { respuestas: true } },
} as const

/** Mapea preguntas de entrada a filas Prisma (orden = posición; opciones solo si aplica). */
function preguntasCreate(preguntas: PreguntaInput[]) {
  return preguntas.map((p, i) => ({
    orden: i + 1,
    texto: p.texto,
    tipoRespuesta: p.tipoRespuesta,
    obligatoria: p.obligatoria,
    permiteFoto: p.permiteFoto,
    // Foto obligatoria solo si además permite foto.
    fotoObligatoria: p.permiteFoto ? p.fotoObligatoria : false,
    opciones: p.tipoRespuesta === 'SELECCION_MULTIPLE' ? p.opciones : [],
  }))
}

/** Acceso a datos de Formulario y sus preguntas (CLAUDE.md §12.2). */
export const formulariosRepository = {
  async listar(
    pagination: PaginationQuery,
    q?: string,
    areaId?: number,
    categoriaId?: number,
    codigosArea?: string[]
  ) {
    const where: Prisma.FormularioWhereInput = {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(areaId ? { areaId } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      // Restringe a las áreas accesibles del solicitante (visibilidad §6).
      ...(codigosArea ? { area: { codigo: { in: codigosArea } } } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.formulario.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          area: { select: { codigo: true, nombre: true } },
          categoria: { select: { nombre: true } },
          _count: { select: { preguntas: true } },
        },
      }),
      prisma.formulario.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: number) {
    return prisma.formulario.findFirst({ where: { id, eliminadoEn: null }, include: detalleInclude })
  },

  /** Fila con el código de área, sin preguntas (para chequeos de autorización/estado). */
  async buscarBasico(id: number) {
    return prisma.formulario.findFirst({
      where: { id, eliminadoEn: null },
      select: { id: true, areaId: true, area: { select: { codigo: true } } },
    })
  },

  async buscarArea(areaId: number) {
    return prisma.area.findUnique({ where: { id: areaId }, select: { id: true, codigo: true, nombre: true } })
  },

  async buscarCategoria(categoriaId: number) {
    return prisma.categoriaFormulario.findFirst({
      where: { id: categoriaId, eliminadoEn: null },
      select: { id: true, areaId: true },
    })
  },

  async existeCodigo(codigo: string, exceptoId?: number) {
    const existe = await prisma.formulario.findFirst({
      where: { codigo, eliminadoEn: null, ...(exceptoId ? { id: { not: exceptoId } } : {}) },
      select: { id: true },
    })
    return existe !== null
  },

  async contarRespuestas(formularioId: number) {
    return prisma.respuestaFormulario.count({ where: { formularioId } })
  },

  async crear(
    data: {
      codigo: string
      nombre: string
      areaId: number
      categoriaId: number
      requiereObra: boolean
      activo: boolean
      creadoPor: string
    },
    preguntas: PreguntaInput[]
  ) {
    return prisma.formulario.create({
      data: { ...data, preguntas: { create: preguntasCreate(preguntas) } },
      include: detalleInclude,
    })
  },

  async actualizar(
    id: number,
    data: {
      codigo?: string
      nombre?: string
      categoriaId?: number
      requiereObra?: boolean
      activo?: boolean
    },
    preguntas?: PreguntaInput[]
  ) {
    // Si vienen preguntas, se reemplaza el set completo (borra + recrea) en una
    // transacción. El service ya garantizó que el formulario no tiene respuestas.
    return prisma.$transaction(async (tx) => {
      if (preguntas) await tx.pregunta.deleteMany({ where: { formularioId: id } })
      return tx.formulario.update({
        where: { id },
        data: {
          ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
          ...(data.requiereObra !== undefined ? { requiereObra: data.requiereObra } : {}),
          ...(data.activo !== undefined ? { activo: data.activo } : {}),
          ...(preguntas ? { preguntas: { create: preguntasCreate(preguntas) } } : {}),
        },
        include: detalleInclude,
      })
    })
  },

  async softDelete(id: number) {
    // El modelo Formulario solo tiene `eliminadoEn` (sin `eliminadoPor`/audit —
    // retrofit de auditoría pendiente, ver nucleo-compartido.md §10).
    return prisma.formulario.update({ where: { id }, data: { eliminadoEn: new Date() } })
  },

  // ─── Picker (para vincular formularios a un procedimiento) ─────────────────
  async listarOpciones(q?: string) {
    const where: Prisma.FormularioWhereInput = {
      eliminadoEn: null,
      activo: true,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    return prisma.formulario.findMany({
      where,
      take: 100,
      orderBy: { id: 'desc' },
      select: { id: true, codigo: true, nombre: true },
    })
  },
}
