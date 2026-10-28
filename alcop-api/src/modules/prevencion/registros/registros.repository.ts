import { Prisma, type CalidadImagen } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import type { EstadoRegistro } from './registros.types.js'

type DbClient = Prisma.TransactionClient | typeof prisma

const obraSelect = { select: { id: true, codigo: true, nombre: true } } as const
const formularioSelect = { select: { id: true, codigo: true, nombre: true } } as const

const preguntaSelect = {
  orderBy: { orden: 'asc' as const },
  select: {
    id: true,
    orden: true,
    texto: true,
    tipoRespuesta: true,
    obligatoria: true,
    permiteFoto: true,
    fotoObligatoria: true,
    opciones: true,
  },
} as const

const fotoSelect = {
  orderBy: { orden: 'asc' as const },
  select: { id: true, mimetype: true, orden: true },
} as const

// Una RespuestaPregunta "con contenido": algún valor no nulo o ≥1 foto. Se usa para
// derivar `enProgreso` sin contar filas vacías (QA-RP-007).
const conContenido: Prisma.RespuestaPreguntaWhereInput = {
  OR: [
    { valorTexto: { not: null } },
    { valorNumero: { not: null } },
    { valorCheckbox: { not: null } },
    { valorSeleccionMultiple: { isEmpty: false } },
    { fotos: { some: {} } },
  ],
}

/** Filtro de registros (formularios agendados) por obra y estado derivado. */
function buildWhere(obraId: number, estado: EstadoRegistro | undefined, hoyDate: Date): Prisma.FormularioProgramadoWhereInput {
  const programacion: Prisma.ProgramacionPrevencionWhereInput = {
    eliminadoEn: null,
    obraId,
    obra: { eliminadoEn: null },
  }
  const where: Prisma.FormularioProgramadoWhereInput = { eliminadoEn: null, programacion }
  if (estado === 'COMPLETADO') {
    where.respuesta = { estado: 'CERRADO' }
  } else if (estado) {
    where.OR = [{ respuesta: null }, { respuesta: { estado: 'BORRADOR' } }]
    if (estado === 'POR_APLICAR') programacion.fecha = { gt: hoyDate }
    else if (estado === 'VIGENTE') programacion.fecha = hoyDate
    else programacion.fecha = { lt: hoyDate }
  }
  return where
}

export const registrosRepository = {
  async obraViva(obraId: number): Promise<boolean> {
    const o = await prisma.obra.findFirst({ where: { id: obraId, eliminadoEn: null }, select: { id: true } })
    return o !== null
  },

  async listar(pagination: PaginationQuery, obraId: number, estado: EstadoRegistro | undefined, hoyDate: Date) {
    const where = buildWhere(obraId, estado, hoyDate)
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.formularioProgramado.findMany({
        where,
        skip,
        take,
        orderBy: [{ programacion: { fecha: 'asc' } }, { id: 'asc' }],
        include: {
          programacion: { select: { fecha: true, obra: obraSelect } },
          formulario: formularioSelect,
          respuesta: {
          select: { id: true, estado: true, fechaRevision: true, _count: { select: { respuestas: { where: conContenido } } } },
        },
        },
      }),
      prisma.formularioProgramado.count({ where }),
    ])
    return { rows, total }
  },

  /** Registro con formulario+preguntas y la respuesta (borrador/cerrado) con sus fotos. */
  async buscarRegistro(fpId: number, db: DbClient = prisma) {
    return db.formularioProgramado.findFirst({
      where: {
        id: fpId,
        eliminadoEn: null,
        programacion: { eliminadoEn: null, obra: { eliminadoEn: null } },
      },
      include: {
        programacion: { select: { fecha: true, obra: obraSelect } },
        formulario: { select: { id: true, codigo: true, nombre: true, activo: true, preguntas: preguntaSelect } },
        respuesta: {
          select: {
            id: true,
            estado: true,
            fechaRevision: true,
            respuestas: {
              select: {
                preguntaId: true,
                valorTexto: true,
                valorNumero: true,
                valorCheckbox: true,
                valorSeleccionMultiple: true,
                fotos: fotoSelect,
              },
            },
          },
        },
      },
    })
  },

  /** Datos crudos del registro para el PDF (incluye binario de fotos). */
  async reporteData(fpId: number) {
    return prisma.formularioProgramado.findFirst({
      where: { id: fpId, eliminadoEn: null, programacion: { eliminadoEn: null, obra: { eliminadoEn: null } } },
      include: {
        programacion: { select: { fecha: true, obra: { select: { codigo: true, nombre: true } } } },
        formulario: { select: { codigo: true, nombre: true, preguntas: preguntaSelect } },
        respuesta: {
          select: {
            estado: true,
            fechaRevision: true,
            usuario: { select: { nombre: true } },
            respuestas: {
              select: {
                preguntaId: true,
                valorTexto: true,
                valorNumero: true,
                valorCheckbox: true,
                valorSeleccionMultiple: true,
                fotos: { orderBy: { orden: 'asc' }, select: { mimetype: true, data: { select: { datos: true } } } },
              },
            },
          },
        },
      },
    })
  },

  /** Bloquea el registro (FOR UPDATE) para serializar guardar/cerrar/fotos. */
  async lockRegistro(tx: Prisma.TransactionClient, fpId: number): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: number }>
    >`SELECT id FROM "FormularioProgramado" WHERE id = ${fpId} AND "eliminadoEn" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  /** Garantiza una RespuestaFormulario (borrador) para el registro; única por fp. */
  async ensureRespuesta(
    data: { formularioProgramadoId: number; formularioId: number; obraId: number; usuarioId: string },
    db: DbClient = prisma
  ) {
    return db.respuestaFormulario.upsert({
      where: { formularioProgramadoId: data.formularioProgramadoId },
      update: {},
      create: {
        formularioProgramadoId: data.formularioProgramadoId,
        formularioId: data.formularioId,
        obraId: data.obraId,
        usuarioId: data.usuarioId,
        creadoPor: data.usuarioId,
      },
      select: { id: true, estado: true },
    })
  },

  async upsertRespuestaPregunta(
    respuestaFormularioId: number,
    preguntaId: number,
    valores: {
      valorTexto: string | null
      valorNumero: number | null
      valorCheckbox: string | null
      valorSeleccionMultiple: string[]
    },
    db: DbClient = prisma
  ) {
    return db.respuestaPregunta.upsert({
      where: { respuestaFormularioId_preguntaId: { respuestaFormularioId, preguntaId } },
      update: valores,
      create: { respuestaFormularioId, preguntaId, ...valores },
      select: { id: true },
    })
  },

  /** Garantiza una RespuestaPregunta (sin pisar valores) para adjuntarle fotos. */
  async ensureRespuestaPregunta(respuestaFormularioId: number, preguntaId: number, db: DbClient = prisma) {
    return db.respuestaPregunta.upsert({
      where: { respuestaFormularioId_preguntaId: { respuestaFormularioId, preguntaId } },
      update: {},
      create: { respuestaFormularioId, preguntaId },
      select: { id: true },
    })
  },

  async tocarRespuesta(id: number, actualizadoPor: string, db: DbClient = prisma) {
    return db.respuestaFormulario.update({ where: { id }, data: { actualizadoPor } })
  },

  async cerrar(id: number, fechaRevision: Date, cerradoPor: string, db: DbClient = prisma) {
    // usuarioId pasa a ser quien cierra ("Completado por" del reporte); el creador
    // del borrador queda en creadoPor (QA-RP-005).
    return db.respuestaFormulario.update({
      where: { id },
      data: { estado: 'CERRADO', fechaRevision, usuarioId: cerradoPor, actualizadoPor: cerradoPor },
    })
  },

  // ─── Fotos ──────────────────────────────────────────────────────────────────
  async contarFotos(respuestaPreguntaId: number, db: DbClient = prisma) {
    return db.respuestaPreguntaFoto.count({ where: { respuestaPreguntaId } })
  },

  async crearFoto(
    respuestaPreguntaId: number,
    meta: { mimetype: string; calidad: CalidadImagen; tamano: number; ancho: number | null; alto: number | null },
    orden: number,
    datos: Buffer,
    db: DbClient = prisma
  ) {
    return db.respuestaPreguntaFoto.create({
      data: {
        respuestaPreguntaId,
        mimetype: meta.mimetype,
        calidad: meta.calidad,
        tamano: meta.tamano,
        ancho: meta.ancho,
        alto: meta.alto,
        orden,
        data: { create: { datos } },
      },
      select: { id: true, mimetype: true, orden: true },
    })
  },

  async buscarFotoParaDescarga(fotoId: number) {
    return prisma.respuestaPreguntaFoto.findFirst({
      where: {
        id: fotoId,
        respuestaPregunta: { respuestaFormulario: { formularioProgramado: { eliminadoEn: null } } },
      },
      select: { mimetype: true, data: { select: { datos: true } } },
    })
  },

  /** Foto con su registro, para validar antes de borrar (no cerrado). */
  async buscarFotoConRegistro(fotoId: number, db: DbClient = prisma) {
    return db.respuestaPreguntaFoto.findFirst({
      where: { id: fotoId },
      select: {
        id: true,
        respuestaPregunta: {
          select: {
            respuestaFormulario: {
              select: { estado: true, formularioProgramadoId: true, formularioProgramado: { select: { eliminadoEn: true } } },
            },
          },
        },
      },
    })
  },

  async borrarFoto(fotoId: number, db: DbClient = prisma) {
    await db.respuestaPreguntaFotoData.deleteMany({ where: { fotoId } })
    await db.respuestaPreguntaFoto.delete({ where: { id: fotoId } })
  },
}
