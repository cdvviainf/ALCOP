import { Prisma, type NivelAcceso, type TipoRespuesta } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { formulariosRepository } from './formularios.repository.js'
import type { ActualizarFormularioInput, CrearFormularioInput } from './formularios.schema.js'
import type { FormularioDetalleDTO, FormularioDTO, PreguntaDTO } from './formularios.types.js'

/** Acceso del solicitante: admin (bypass) o mapa de permisos efectivos por función. */
export type Acceso = { esAdmin?: boolean; permisos?: Record<string, NivelAcceso> }

const FORM_FUNCION: Record<string, string> = {
  PREVENCION: 'PREV_FORMULARIOS',
  TECNICA: 'TEC_FORMULARIOS',
}

/** Nivel efectivo del solicitante sobre la función Formularios del área dada. */
function nivelFormulariosDeArea(acceso: Acceso, areaCodigo: string): NivelAcceso {
  if (acceso.esAdmin) return 'TOTAL'
  const codigo = FORM_FUNCION[areaCodigo]
  return (codigo ? acceso.permisos?.[codigo] : undefined) ?? 'SIN_ACCESO'
}

/**
 * Autorización dinámica (formularios-dinamicos.md §6): administrar la PLANTILLA
 * (crear/editar/eliminar formulario y preguntas) exige nivel TOTAL en la función
 * Formularios del Área del formulario. El área sale del dato.
 */
function exigirTotalEnArea(acceso: Acceso, areaCodigo: string) {
  if (nivelFormulariosDeArea(acceso, areaCodigo) !== 'TOTAL') {
    throw new ForbiddenError(
      `Se requiere acceso total en el área ${areaCodigo} para administrar sus formularios.`
    )
  }
}

type PreguntaRow = {
  id: number
  orden: number
  texto: string
  tipoRespuesta: TipoRespuesta
  obligatoria: boolean
  permiteFoto: boolean
  fotoObligatoria: boolean
  opciones: string[]
}
type FormularioRow = {
  id: number
  codigo: string
  nombre: string
  areaId: number
  categoriaId: number
  requiereObra: boolean
  activo: boolean
  creadoEn: Date
  area: { codigo: string; nombre: string }
  categoria: { nombre: string }
}

function preguntaToDTO(p: PreguntaRow): PreguntaDTO {
  return {
    id: p.id,
    orden: p.orden,
    texto: p.texto,
    tipoRespuesta: p.tipoRespuesta,
    obligatoria: p.obligatoria,
    permiteFoto: p.permiteFoto,
    fotoObligatoria: p.fotoObligatoria,
    opciones: p.opciones,
  }
}

function toDTO(row: FormularioRow, preguntasCount: number): FormularioDTO {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    areaId: row.areaId,
    areaCodigo: row.area.codigo,
    areaNombre: row.area.nombre,
    categoriaId: row.categoriaId,
    categoriaNombre: row.categoria.nombre,
    requiereObra: row.requiereObra,
    activo: row.activo,
    preguntas: preguntasCount,
    creadoEn: row.creadoEn.toISOString(),
  }
}

function detalleToDTO(
  row: FormularioRow & { preguntas: PreguntaRow[]; _count: { respuestas: number } }
): FormularioDetalleDTO {
  return {
    ...toDTO(row, row.preguntas.length),
    preguntas: row.preguntas.map(preguntaToDTO),
    tieneRespuestas: row._count.respuestas > 0,
  }
}

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/** Valida que la categoría exista y pertenezca al área del formulario. */
async function validarCategoria(categoriaId: number, areaId: number) {
  const categoria = await formulariosRepository.buscarCategoria(categoriaId)
  if (!categoria) throw new NotFoundError('Categoría de formulario', String(categoriaId))
  if (categoria.areaId !== areaId) {
    throw new ConflictError('La categoría no pertenece al área del formulario.')
  }
}

export const formulariosService = {
  async listar(
    pagination: PaginationQuery,
    acceso: Acceso,
    q?: string,
    areaId?: number,
    categoriaId?: number
  ): Promise<Paginated<FormularioDTO>> {
    // Solo las áreas donde el solicitante tiene ≥ LECTURA (usuarios-perfiles.md §6).
    const codigosArea = (['PREVENCION', 'TECNICA'] as const).filter(
      (c) => nivelFormulariosDeArea(acceso, c) !== 'SIN_ACCESO'
    )
    const { rows, total } = await formulariosRepository.listar(pagination, q, areaId, categoriaId, codigosArea)
    return paginate(
      rows.map((r) => toDTO(r, r._count.preguntas)),
      total,
      pagination
    )
  },

  async obtener(id: number, acceso: Acceso): Promise<FormularioDetalleDTO> {
    const row = await formulariosRepository.buscarPorId(id)
    if (!row) throw new NotFoundError('Formulario', String(id))
    // Visibilidad por área: sin acceso al área, 404 (no se revela su existencia).
    if (nivelFormulariosDeArea(acceso, row.area.codigo) === 'SIN_ACCESO') {
      throw new NotFoundError('Formulario', String(id))
    }
    return detalleToDTO(row)
  },

  async crear(data: CrearFormularioInput, acceso: Acceso, usuarioId: string): Promise<FormularioDetalleDTO> {
    const area = await formulariosRepository.buscarArea(data.areaId)
    if (!area) throw new NotFoundError('Área', String(data.areaId))
    exigirTotalEnArea(acceso, area.codigo)
    await validarCategoria(data.categoriaId, data.areaId)

    if (await formulariosRepository.existeCodigo(data.codigo)) {
      throw new ConflictError(`Ya existe un formulario con el código ${data.codigo}.`)
    }
    try {
      const row = await formulariosRepository.crear(
        {
          codigo: data.codigo,
          nombre: data.nombre,
          areaId: data.areaId,
          categoriaId: data.categoriaId,
          // §5.1 / §6 (QA-FD-006/007): nace activa y ligada a obra.
          requiereObra: true,
          activo: true,
          creadoPor: usuarioId,
        },
        data.preguntas
      )
      return detalleToDTO(row)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError(`Ya existe un formulario con el código ${data.codigo}.`)
      throw err
    }
  },

  async actualizar(
    id: number,
    data: ActualizarFormularioInput,
    acceso: Acceso
  ): Promise<FormularioDetalleDTO> {
    const existente = await formulariosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Formulario', String(id))
    exigirTotalEnArea(acceso, existente.area.codigo)

    // Categoría nueva (si viene) debe pertenecer al área del formulario (inmutable).
    if (data.categoriaId !== undefined && data.categoriaId !== existente.categoriaId) {
      await validarCategoria(data.categoriaId, existente.areaId)
    }

    if (data.codigo && (await formulariosRepository.existeCodigo(data.codigo, id))) {
      throw new ConflictError(`Ya existe un formulario con el código ${data.codigo}.`)
    }

    // Editar preguntas solo si el formulario NO tiene respuestas (§6): cambiar la
    // estructura rompería las respuestas existentes.
    if (data.preguntas) {
      const respuestas = await formulariosRepository.contarRespuestas(id)
      if (respuestas > 0) {
        throw new ConflictError(
          `No se pueden editar las preguntas: el formulario tiene ${respuestas} respuesta(s) registrada(s).`
        )
      }
    }

    try {
      const row = await formulariosRepository.actualizar(
        id,
        {
          codigo: data.codigo,
          nombre: data.nombre,
          categoriaId: data.categoriaId,
          activo: data.activo,
        },
        data.preguntas
      )
      return detalleToDTO(row)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError('Ya existe un formulario con ese código.')
      throw err
    }
  },

  async eliminar(id: number, acceso: Acceso): Promise<void> {
    const existente = await formulariosRepository.buscarBasico(id)
    if (!existente) throw new NotFoundError('Formulario', String(id))
    exigirTotalEnArea(acceso, existente.area.codigo)
    // Una plantilla con respuestas no se elimina — solo se desactiva (§6).
    const respuestas = await formulariosRepository.contarRespuestas(id)
    if (respuestas > 0) {
      throw new ConflictError(
        `No se puede eliminar: el formulario tiene ${respuestas} respuesta(s). Desactívalo en su lugar.`
      )
    }
    await formulariosRepository.softDelete(id)
  },

  async listarOpciones(q?: string): Promise<Array<{ id: number; codigo: string; nombre: string }>> {
    return formulariosRepository.listarOpciones(q)
  },
}
