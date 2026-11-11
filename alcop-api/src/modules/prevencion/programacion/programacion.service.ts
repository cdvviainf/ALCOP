import type { AreaProgramacion } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { ConflictError, NotFoundError } from '../../../shared/errors.js'
import { programacionRepository } from './programacion.repository.js'
import type {
  ActualizarComentarioInput,
  ActualizarVentanaInput,
  AgregarFormulariosInput,
  CrearProgramacionInput,
  LineaInput,
  ListarProgramacionQuery,
} from './programacion.schema.js'
import type { FormularioOpcionDTO, ProgramacionDiaDTO } from './programacion.types.js'

// Zona horaria de referencia para "hoy" (igual que la vigencia de procedimientos,
// QA-LP-004). El calendario vive en días calendario de la obra, no en UTC.
const TZ_OBRA = 'America/Santiago'
const hoyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ_OBRA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const NOMBRE_AREA: Record<AreaProgramacion, string> = { PREVENCION: 'Prevención', TECNICA: 'Técnica' }

/** Día calendario de HOY (YYYY-MM-DD) en la zona de la obra. */
function hoyStr(): string {
  return hoyFmt.format(new Date())
}

/** Día (YYYY-MM-DD) de una fecha almacenada como medianoche UTC (campo DATE). */
function diaDe(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** Fecha almacenable (medianoche UTC) a partir del día YYYY-MM-DD de la UI. */
function diaAUtc(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`)
}

type DiaRow = {
  id: number
  obraId: number
  area: AreaProgramacion
  fecha: Date
  comentario: string | null
  usuario: { id: string; nombre: string } | null
  formularios: Array<{
    id: number
    orden: number
    fechaInicio: Date | null
    fechaTermino: Date | null
    formulario: { id: number; codigo: string; nombre: string }
  }>
}

function toDTO(row: DiaRow, hoy: string): ProgramacionDiaDTO {
  const fecha = diaDe(row.fecha)
  return {
    id: row.id,
    obraId: row.obraId,
    area: row.area,
    fecha,
    comentario: row.comentario,
    usuario: row.usuario,
    vencido: fecha < hoy,
    formularios: row.formularios.map((f) => ({
      id: f.id,
      orden: f.orden,
      formulario: f.formulario,
      fechaInicio: f.fechaInicio ? diaDe(f.fechaInicio) : null,
      fechaTermino: f.fechaTermino ? diaDe(f.fechaTermino) : null,
    })),
  }
}

/**
 * Normaliza las líneas a persistir. PREVENCION: sin ventana (fechas null). TECNICA:
 * ventana obligatoria — por defecto inicio = término = fecha del día; el término
 * omitido toma el inicio. Inicio no anterior a hoy; término ≥ inicio.
 */
function normalizarLineas(
  area: AreaProgramacion,
  fechaDia: string,
  lineas: LineaInput[]
): Array<{ formularioId: number; fechaInicio: Date | null; fechaTermino: Date | null }> {
  const hoy = hoyStr()
  return lineas.map((l) => {
    if (area === 'PREVENCION') return { formularioId: l.formularioId, fechaInicio: null, fechaTermino: null }
    const inicio = l.fechaInicio ?? fechaDia
    const termino = l.fechaTermino ?? inicio
    validarVentana(inicio, termino, hoy)
    return { formularioId: l.formularioId, fechaInicio: diaAUtc(inicio), fechaTermino: diaAUtc(termino) }
  })
}

function validarVentana(inicio: string, termino: string, hoy: string): void {
  if (inicio < hoy) throw new ConflictError('La fecha de inicio no puede ser anterior a hoy.')
  if (termino < inicio) throw new ConflictError('La fecha de término no puede ser anterior a la de inicio.')
}

/**
 * Servicio de Programación por área (Docs/programacion-prevencion.md v0.2). Las
 * rutas de Prevención operan con area=PREVENCION y las de Técnica con TECNICA.
 */
export const programacionService = {
  /** Agendamientos de una obra visibles en un mes (vista del calendario). */
  async listarMes(area: AreaProgramacion, q: ListarProgramacionQuery): Promise<{ data: ProgramacionDiaDTO[] }> {
    // Obra inexistente/eliminada → 404 (spec §6, QA-PP-002).
    if (!(await programacionRepository.obraViva(q.obraId))) throw new NotFoundError('Obra', String(q.obraId))
    const desde = new Date(Date.UTC(q.anio, q.mes - 1, 1))
    const hasta = new Date(Date.UTC(q.anio, q.mes, 1))
    const rows = await programacionRepository.listarRango(area, q.obraId, desde, hasta)
    const hoy = hoyStr()
    return { data: rows.map((r) => toDTO(r, hoy)) }
  },

  async obtenerDia(area: AreaProgramacion, id: number): Promise<ProgramacionDiaDTO> {
    const row = await programacionRepository.buscarDia(area, id)
    if (!row) throw new NotFoundError('Programación', String(id))
    return toDTO(row, hoyStr())
  },

  async opciones(area: AreaProgramacion, q?: string): Promise<{ data: FormularioOpcionDTO[] }> {
    return { data: await programacionRepository.opcionesFormularios(area, q) }
  },

  /** Crea el agendamiento de un día (obra, fecha, área) con uno o más formularios. */
  async crear(area: AreaProgramacion, input: CrearProgramacionInput, creadoPor: string): Promise<ProgramacionDiaDTO> {
    if (input.fecha < hoyStr()) {
      throw new ConflictError('No se puede programar una fecha anterior a hoy.')
    }
    const fechaUtc = diaAUtc(input.fecha)
    const lineas = normalizarLineas(area, input.fecha, input.formularios)

    const id = await prisma.$transaction(async (tx) => {
      const obraViva = await programacionRepository.lockObraViva(tx, input.obraId)
      if (!obraViva) throw new NotFoundError('Obra', String(input.obraId))

      const existente = await programacionRepository.buscarPorObraFecha(area, input.obraId, fechaUtc, tx)
      if (existente) {
        throw new ConflictError('Ya existe una programación para esa fecha; edítala en lugar de crear otra.')
      }

      await validarFormularios(area, lineas.map((l) => l.formularioId), tx)

      const usuarioId = await programacionRepository.titularResponsable(area, input.obraId, tx)
      const dia = await programacionRepository.crearDia(
        { area, obraId: input.obraId, fecha: fechaUtc, comentario: input.comentario ?? null, usuarioId, creadoPor },
        tx
      )
      for (let i = 0; i < lineas.length; i++) {
        await programacionRepository.crearLinea(dia.id, lineas[i], i, creadoPor, tx)
      }
      return dia.id
    })

    return this.obtenerDia(area, id)
  },

  async actualizarComentario(
    area: AreaProgramacion,
    id: number,
    input: ActualizarComentarioInput,
    actualizadoPor: string
  ): Promise<ProgramacionDiaDTO> {
    await this.exigirDiaEditable(area, id)
    await programacionRepository.actualizarComentario(id, input.comentario, actualizadoPor)
    return this.obtenerDia(area, id)
  },

  /** Anexa formularios a un día existente (ignora los ya agendados). */
  async agregarFormularios(
    area: AreaProgramacion,
    id: number,
    input: AgregarFormulariosInput,
    creadoPor: string
  ): Promise<ProgramacionDiaDTO> {
    const fechaDia = await this.exigirDiaEditable(area, id)
    const lineas = normalizarLineas(area, fechaDia, input.formularios)
    await prisma.$transaction(async (tx) => {
      // Lock del día: serializa altas concurrentes sobre el mismo día.
      if (!(await programacionRepository.lockDia(tx, area, id))) throw new NotFoundError('Programación', String(id))
      await validarFormularios(area, lineas.map((l) => l.formularioId), tx)
      const { ids, maxOrden } = await programacionRepository.lineasVivas(id, tx)
      let orden = maxOrden + 1
      for (const linea of lineas) {
        if (ids.has(linea.formularioId)) continue // ya agendado ese día → no duplicar
        await programacionRepository.crearLinea(id, linea, orden, creadoPor, tx)
        orden++
      }
    })
    return this.obtenerDia(area, id)
  },

  /** Cambia la ventana (inicio/término) de un formulario técnico agendado. */
  async actualizarVentana(
    area: AreaProgramacion,
    id: number,
    fpId: number,
    input: ActualizarVentanaInput
  ): Promise<ProgramacionDiaDTO> {
    if (area !== 'TECNICA') throw new ConflictError('Solo los formularios de Técnica tienen fechas de inicio y término.')
    await this.exigirDiaEditable(area, id)
    validarVentana(input.fechaInicio, input.fechaTermino, hoyStr())
    await prisma.$transaction(async (tx) => {
      if (!(await programacionRepository.lockDia(tx, area, id))) throw new NotFoundError('Programación', String(id))
      const linea = await programacionRepository.buscarLinea(fpId, id, tx)
      if (!linea) throw new NotFoundError('Formulario programado', String(fpId))
      await programacionRepository.actualizarVentana(fpId, diaAUtc(input.fechaInicio), diaAUtc(input.fechaTermino), tx)
    })
    return this.obtenerDia(area, id)
  },

  async quitarFormulario(
    area: AreaProgramacion,
    id: number,
    fpId: number,
    eliminadoPor: string
  ): Promise<ProgramacionDiaDTO> {
    await this.exigirDiaEditable(area, id)
    await prisma.$transaction(async (tx) => {
      // Lock del día (FOR UPDATE) para serializar quitar líneas concurrentes y no
      // dejar el día sin formularios por una carrera (QA-PP-005).
      const vivo = await programacionRepository.lockDia(tx, area, id)
      if (!vivo) throw new NotFoundError('Programación', String(id))
      const linea = await programacionRepository.buscarLinea(fpId, id, tx)
      if (!linea) throw new NotFoundError('Formulario programado', String(fpId))
      // Bloquea la MISMA fila que el cierre antes de comprobar el histórico: así la
      // comprobación ve cualquier cierre concurrente ya confirmado (QA-RP-009).
      await programacionRepository.lockFp(tx, fpId)
      if (await programacionRepository.fpTieneRespuestaCerrada(fpId, tx)) {
        throw new ConflictError('No se puede quitar: el formulario tiene un registro completado (histórico).')
      }
      const { total } = await programacionRepository.lineasVivas(id, tx)
      if (total <= 1) {
        throw new ConflictError('No puedes quitar el último formulario del día; elimina el día en su lugar.')
      }
      await programacionRepository.softDeleteLinea(fpId, eliminadoPor, tx)
    })
    return this.obtenerDia(area, id)
  },

  async eliminarDia(area: AreaProgramacion, id: number, eliminadoPor: string): Promise<void> {
    await this.exigirDiaEditable(area, id)
    await prisma.$transaction(async (tx) => {
      const vivo = await programacionRepository.lockDia(tx, area, id)
      if (!vivo) throw new NotFoundError('Programación', String(id))
      // Bloquea TODOS los formularios del día (orden determinista) antes de comprobar
      // el histórico, serializando con el cierre sobre la misma fila (QA-RP-009).
      await programacionRepository.lockFpsDeDia(tx, id)
      if (await programacionRepository.diaTieneRespuestaCerrada(id, tx)) {
        throw new ConflictError('No se puede eliminar: el día tiene un registro completado (histórico).')
      }
      await programacionRepository.softDeleteDia(id, eliminadoPor, tx)
    })
  },

  /**
   * Carga el día del área y exige que su fecha no sea pasada (días pasados = solo
   * lectura). Devuelve la fecha del día (YYYY-MM-DD).
   */
  async exigirDiaEditable(area: AreaProgramacion, id: number): Promise<string> {
    const row = await programacionRepository.buscarDiaBasico(area, id)
    if (!row) throw new NotFoundError('Programación', String(id))
    const fecha = diaDe(row.fecha)
    if (fecha < hoyStr()) {
      throw new ConflictError('No se puede modificar una programación de una fecha pasada.')
    }
    return fecha
  },
}

/** Lanza ConflictError si algún id no es un formulario activo del área. */
async function validarFormularios(
  area: AreaProgramacion,
  formularioIds: number[],
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  for (const formularioId of formularioIds) {
    const ok = await programacionRepository.formularioActivoDeArea(area, formularioId, tx)
    if (!ok) {
      throw new ConflictError(
        `El formulario ${formularioId} no existe, no está activo o no es de ${NOMBRE_AREA[area]}.`
      )
    }
  }
}
