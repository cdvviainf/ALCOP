import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { PaginationQuery } from '../../../shared/pagination.js'
import { toPrismaRange } from '../../../shared/pagination.js'
import { registrosRepository as respuestasRepository } from '../../prevencion/registros/registros.repository.js'
import type { EstadoRegistroTecnico } from './registros.schema.js'

type DbClient = Prisma.TransactionClient | typeof prisma

const obraSelect = { select: { id: true, codigo: true, nombre: true } } as const

// Un registro técnico es una respuesta directa (sin calendario) a un formulario del
// área Técnica, de una obra viva. Todo acceso pasa por este filtro: así las rutas de
// Técnica nunca alcanzan un registro agendado de Prevención.
const esRegistroTecnico = {
  formularioProgramadoId: null,
  formulario: { area: { codigo: 'TECNICA' } },
  obra: { eliminadoEn: null },
} satisfies Prisma.RespuestaFormularioWhereInput

const respuestaSelect = {
  preguntaId: true,
  valorTexto: true,
  valorNumero: true,
  valorCheckbox: true,
  valorSeleccionMultiple: true,
} as const

const preguntaArgs = {
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

export const registrosTecnicaRepository = {
  // Escritura de respuestas y fotos: misma tabla y reglas que Registro Prevención.
  upsertRespuestaPregunta: respuestasRepository.upsertRespuestaPregunta,
  ensureRespuestaPregunta: respuestasRepository.ensureRespuestaPregunta,
  tocarRespuesta: respuestasRepository.tocarRespuesta,
  cerrar: respuestasRepository.cerrar,
  contarFotos: respuestasRepository.contarFotos,
  crearFoto: respuestasRepository.crearFoto,
  borrarFoto: respuestasRepository.borrarFoto,
  obraViva: respuestasRepository.obraViva,

  /** Formularios técnicos que se pueden aplicar: activos y con preguntas. */
  async formulariosAplicables() {
    return prisma.formulario.findMany({
      where: { eliminadoEn: null, activo: true, area: { codigo: 'TECNICA' }, preguntas: { some: {} } },
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    })
  },

  async formularioAplicable(formularioId: number) {
    return prisma.formulario.findFirst({
      where: { id: formularioId, eliminadoEn: null, activo: true, area: { codigo: 'TECNICA' }, preguntas: { some: {} } },
      select: { id: true },
    })
  },

  async borradorAbierto(obraId: number, formularioId: number) {
    return prisma.respuestaFormulario.findFirst({
      where: { ...esRegistroTecnico, obraId, formularioId, estado: 'BORRADOR' },
      select: { id: true },
    })
  },

  async crear(data: { obraId: number; formularioId: number; usuarioId: string }) {
    return prisma.respuestaFormulario.create({
      data: { obraId: data.obraId, formularioId: data.formularioId, usuarioId: data.usuarioId, creadoPor: data.usuarioId },
      select: { id: true },
    })
  },

  async listar(pagination: PaginationQuery, obraId: number, estado: EstadoRegistroTecnico | undefined) {
    const where: Prisma.RespuestaFormularioWhereInput = {
      ...esRegistroTecnico,
      obraId,
      ...(estado ? { estado: estado === 'COMPLETADO' ? 'CERRADO' : 'BORRADOR' } : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.respuestaFormulario.findMany({
        where,
        skip,
        take,
        orderBy: [{ fechaHora: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          estado: true,
          fechaHora: true,
          fechaRevision: true,
          obra: obraSelect,
          formulario: { select: { id: true, codigo: true, nombre: true } },
          usuario: { select: { nombre: true } },
        },
      }),
      prisma.respuestaFormulario.count({ where }),
    ])
    return { rows, total }
  },

  async buscar(id: number, db: DbClient = prisma) {
    return db.respuestaFormulario.findFirst({
      where: { ...esRegistroTecnico, id },
      select: {
        id: true,
        estado: true,
        fechaHora: true,
        fechaRevision: true,
        obra: obraSelect,
        formulario: { select: { id: true, codigo: true, nombre: true, activo: true, preguntas: preguntaArgs } },
        respuestas: {
          select: {
            ...respuestaSelect,
            fotos: { orderBy: { orden: 'asc' as const }, select: { id: true, mimetype: true, orden: true } },
          },
        },
      },
    })
  },

  /** Datos crudos para el PDF (incluye el binario de las fotos). */
  async reporteData(id: number) {
    return prisma.respuestaFormulario.findFirst({
      where: { ...esRegistroTecnico, id },
      select: {
        estado: true,
        fechaHora: true,
        fechaRevision: true,
        obra: { select: { codigo: true, nombre: true } },
        usuario: { select: { nombre: true } },
        formulario: { select: { codigo: true, nombre: true, preguntas: preguntaArgs } },
        respuestas: {
          select: {
            ...respuestaSelect,
            fotos: { orderBy: { orden: 'asc' as const }, select: { mimetype: true, data: { select: { datos: true } } } },
          },
        },
      },
    })
  },

  /** Bloquea el registro (FOR UPDATE) para serializar guardar/cerrar/fotos. */
  async lock(tx: Prisma.TransactionClient, id: number): Promise<boolean> {
    const rows = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "RespuestaFormulario" WHERE id = ${id} AND "formularioProgramadoId" IS NULL FOR UPDATE`
    return rows.length > 0
  },

  async buscarFotoParaDescarga(fotoId: number) {
    return prisma.respuestaPreguntaFoto.findFirst({
      where: { id: fotoId, respuestaPregunta: { respuestaFormulario: esRegistroTecnico } },
      select: { mimetype: true, data: { select: { datos: true } } },
    })
  },

  async buscarFotoConRegistro(fotoId: number, db: DbClient = prisma) {
    return db.respuestaPreguntaFoto.findFirst({
      where: { id: fotoId, respuestaPregunta: { respuestaFormulario: esRegistroTecnico } },
      select: { respuestaPregunta: { select: { respuestaFormulario: { select: { id: true, estado: true } } } } },
    })
  },
}
