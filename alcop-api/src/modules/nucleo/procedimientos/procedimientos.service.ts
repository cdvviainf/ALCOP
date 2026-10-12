import { Prisma, type Procedimiento } from '@prisma/client'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { borrarArchivo, guardarPdf } from '../../../shared/archivos.js'
import { procedimientosRepository } from './procedimientos.repository.js'
import type { ActualizarProcedimientoInput, CrearProcedimientoInput } from './procedimientos.schema.js'
import type {
  ArchivoPdf,
  FormularioVinculadoDTO,
  ProcedimientoDetalleDTO,
  ProcedimientoDTO,
} from './procedimientos.types.js'

// Zona horaria de referencia para "hoy" en la vigencia por día calendario (QA-LP-004).
const TZ_OBRA = 'America/Santiago'
const hoyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ_OBRA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Día calendario (YYYY-MM-DD) de una fecha de vigencia. Se guardan como medianoche
 * UTC del día elegido en la UI (input date-only), así que su día es el UTC.
 */
function diaVigencia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/**
 * Deriva si el procedimiento está vigente HOY por día calendario
 * (lotes-procedimientos.md §4, dec. #1). "Hoy" se evalúa en America/Santiago;
 * `vigenciaHasta` es inclusivo a nivel de día. Comparar en YYYY-MM-DD evita el
 * parpadeo intradía y el desfase UTC (QA-LP-004).
 */
function esVigente(row: Pick<Procedimiento, 'vigenciaDesde' | 'vigenciaHasta'>): boolean {
  const hoy = hoyFmt.format(new Date())
  if (diaVigencia(row.vigenciaDesde) > hoy) return false
  if (row.vigenciaHasta && diaVigencia(row.vigenciaHasta) < hoy) return false
  return true
}

function toDTO(row: Procedimiento): ProcedimientoDTO {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    vigenciaDesde: row.vigenciaDesde.toISOString(),
    vigenciaHasta: row.vigenciaHasta ? row.vigenciaHasta.toISOString() : null,
    vigente: esVigente(row),
    archivoUrl: `/api/nucleo/procedimientos/${row.id}/archivo`,
    activo: row.activo,
    creadoEn: row.creadoEn.toISOString(),
  }
}

type FormRow = { formulario: { id: number; codigo: string; nombre: string; areaId: number; activo: boolean } }
function formToDTO(row: FormRow): FormularioVinculadoDTO {
  return {
    id: row.formulario.id,
    codigo: row.formulario.codigo,
    nombre: row.formulario.nombre,
    areaId: row.formulario.areaId,
    activo: row.formulario.activo,
  }
}

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/** Valida que el archivo subido sea un PDF presente (lotes-procedimientos.md §6). */
function validarPdf(archivo: ArchivoPdf | null): asserts archivo is ArchivoPdf {
  if (!archivo || archivo.buffer.length === 0) {
    throw new BusinessError('ARCHIVO_REQUERIDO', 'Debe adjuntar el PDF del procedimiento.', 422)
  }
  if (archivo.mimetype !== 'application/pdf') {
    throw new BusinessError('ARCHIVO_INVALIDO', 'El archivo debe ser un PDF (application/pdf).', 422)
  }
}

export const procedimientosService = {
  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<ProcedimientoDTO>> {
    const { rows, total } = await procedimientosRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async listarOpciones(q?: string): Promise<Array<{ id: number; codigo: string; nombre: string }>> {
    return procedimientosRepository.listarOpciones(q)
  },

  async obtener(id: number): Promise<ProcedimientoDetalleDTO> {
    const row = await procedimientosRepository.buscarConFormularios(id)
    if (!row) throw new NotFoundError('Procedimiento', String(id))
    return { ...toDTO(row), formularios: row.formularios.map(formToDTO) }
  },

  /** Devuelve la clave de almacenamiento del PDF (para servir la descarga). */
  async obtenerArchivoKey(id: number): Promise<{ archivoUrl: string; codigo: string }> {
    const row = await procedimientosRepository.buscarPorId(id)
    if (!row) throw new NotFoundError('Procedimiento', String(id))
    return { archivoUrl: row.archivoUrl, codigo: row.codigo }
  },

  async crear(data: CrearProcedimientoInput, archivo: ArchivoPdf | null, creadoPor: string): Promise<ProcedimientoDTO> {
    validarPdf(archivo)
    // Pre-chequeo de código único para no dejar un PDF huérfano si colisiona.
    if (await procedimientosRepository.buscarPorCodigo(data.codigo)) {
      throw new ConflictError(`Ya existe un procedimiento con el código ${data.codigo}.`)
    }
    const archivoUrl = await guardarPdf('procedimientos', archivo.buffer)
    try {
      const row = await procedimientosRepository.crear(
        { codigo: data.codigo, nombre: data.nombre, vigenciaDesde: data.vigenciaDesde, vigenciaHasta: data.vigenciaHasta ?? null },
        archivoUrl,
        creadoPor
      )
      return toDTO(row)
    } catch (err) {
      // Si la inserción falla (p. ej. carrera en el código único), no dejar basura en disco.
      await borrarArchivo(archivoUrl)
      if (esConflictoUnico(err)) throw new ConflictError(`Ya existe un procedimiento con el código ${data.codigo}.`)
      throw err
    }
  },

  async actualizar(
    id: number,
    data: ActualizarProcedimientoInput,
    actualizadoPor: string
  ): Promise<ProcedimientoDTO> {
    const existente = await procedimientosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Procedimiento', String(id))

    // Validación dura de vigencia ante PATCH parcial: combina lo recibido con lo persistido.
    const desdeEf = data.vigenciaDesde !== undefined ? data.vigenciaDesde : existente.vigenciaDesde
    const hastaEf = data.vigenciaHasta !== undefined ? data.vigenciaHasta : existente.vigenciaHasta
    if (desdeEf && hastaEf && hastaEf < desdeEf) {
      throw new BusinessError(
        'VALIDATION_ERROR',
        'La fecha de término de vigencia no puede ser anterior al inicio.',
        422
      )
    }

    if (data.codigo && (await procedimientosRepository.buscarPorCodigo(data.codigo, id))) {
      throw new ConflictError(`Ya existe un procedimiento con el código ${data.codigo}.`)
    }
    try {
      const row = await procedimientosRepository.actualizar(id, data, actualizadoPor)
      return toDTO(row)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError('Ya existe un procedimiento con ese código.')
      throw err
    }
  },

  async reemplazarArchivo(id: number, archivo: ArchivoPdf | null, actualizadoPor: string): Promise<ProcedimientoDTO> {
    validarPdf(archivo)
    const existente = await procedimientosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Procedimiento', String(id))
    const nuevaKey = await guardarPdf('procedimientos', archivo.buffer)
    const row = await procedimientosRepository.actualizarArchivo(id, nuevaKey, actualizadoPor)
    // Borra el PDF anterior solo tras persistir la nueva referencia (best-effort).
    if (existente.archivoUrl && existente.archivoUrl !== nuevaKey) await borrarArchivo(existente.archivoUrl)
    return toDTO(row)
  },

  async eliminar(id: number, eliminadoPor: string): Promise<void> {
    const existente = await procedimientosRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Procedimiento', String(id))
    const uso = await procedimientosRepository.contarUsoEnTiposLote(id)
    if (uso > 0) {
      throw new ConflictError(
        `No se puede eliminar: el procedimiento está vinculado a ${uso} tipo(s) de lote. Desactívalo en su lugar.`
      )
    }
    await procedimientosRepository.softDelete(id, eliminadoPor)
  },

  // ─── Formularios de control vinculados ────────────────────────────────────
  async listarFormularios(procedimientoId: number): Promise<FormularioVinculadoDTO[]> {
    const existente = await procedimientosRepository.buscarPorId(procedimientoId)
    if (!existente) throw new NotFoundError('Procedimiento', String(procedimientoId))
    const rows = await procedimientosRepository.listarFormularios(procedimientoId)
    return rows.map(formToDTO)
  },

  async vincularFormulario(
    procedimientoId: number,
    formularioId: number,
    creadoPor: string
  ): Promise<{ procedimientoId: number; formularioId: number }> {
    const existente = await procedimientosRepository.buscarPorId(procedimientoId)
    if (!existente) throw new NotFoundError('Procedimiento', String(procedimientoId))
    const form = await procedimientosRepository.formularioActivo(formularioId)
    if (!form) throw new NotFoundError('Formulario', String(formularioId))
    if (await procedimientosRepository.existeVinculo(procedimientoId, formularioId)) {
      throw new ConflictError('Ese formulario ya está vinculado a este procedimiento.')
    }
    await procedimientosRepository.vincularFormulario(procedimientoId, formularioId, creadoPor)
    return { procedimientoId, formularioId }
  },

  async desvincularFormulario(procedimientoId: number, formularioId: number): Promise<void> {
    const existente = await procedimientosRepository.buscarPorId(procedimientoId)
    if (!existente) throw new NotFoundError('Procedimiento', String(procedimientoId))
    await procedimientosRepository.desvincularFormulario(procedimientoId, formularioId)
  },
}
