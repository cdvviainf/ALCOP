import { prisma } from '../../../lib/prisma.js'
import { ConflictError, NotFoundError } from '../../../shared/errors.js'
import { programacionRepository } from './programacion.repository.js'
import type {
  ActualizarComentarioInput,
  AgregarFormulariosInput,
  CrearProgramacionInput,
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
  fecha: Date
  comentario: string | null
  usuario: { id: string; nombre: string } | null
  formularios: Array<{ id: number; orden: number; formulario: { id: number; codigo: string; nombre: string } }>
}

function toDTO(row: DiaRow, hoy: string): ProgramacionDiaDTO {
  const fecha = diaDe(row.fecha)
  return {
    id: row.id,
    obraId: row.obraId,
    fecha,
    comentario: row.comentario,
    usuario: row.usuario,
    vencido: fecha < hoy,
    formularios: row.formularios.map((f) => ({ id: f.id, orden: f.orden, formulario: f.formulario })),
  }
}

export const programacionService = {
  /** Agendamientos de una obra en un mes (vista del calendario). */
  async listarMes(q: ListarProgramacionQuery): Promise<{ data: ProgramacionDiaDTO[] }> {
    // Obra inexistente/eliminada → 404 (spec §6, QA-PP-002).
    if (!(await programacionRepository.obraViva(q.obraId))) throw new NotFoundError('Obra', String(q.obraId))
    const desde = new Date(Date.UTC(q.anio, q.mes - 1, 1))
    const hasta = new Date(Date.UTC(q.anio, q.mes, 1))
    const rows = await programacionRepository.listarRango(q.obraId, desde, hasta)
    const hoy = hoyStr()
    return { data: rows.map((r) => toDTO(r, hoy)) }
  },

  async obtenerDia(id: number): Promise<ProgramacionDiaDTO> {
    const row = await programacionRepository.buscarDia(id)
    if (!row) throw new NotFoundError('Programación', String(id))
    return toDTO(row, hoyStr())
  },

  async opciones(q?: string): Promise<{ data: FormularioOpcionDTO[] }> {
    return { data: await programacionRepository.opcionesFormularios(q) }
  },

  /** Crea el agendamiento de un día (obra, fecha) con uno o más formularios. */
  async crear(input: CrearProgramacionInput, creadoPor: string): Promise<ProgramacionDiaDTO> {
    if (input.fecha < hoyStr()) {
      throw new ConflictError('No se puede programar una fecha anterior a hoy.')
    }
    const fechaUtc = diaAUtc(input.fecha)

    const id = await prisma.$transaction(async (tx) => {
      const obraViva = await programacionRepository.lockObraViva(tx, input.obraId)
      if (!obraViva) throw new NotFoundError('Obra', String(input.obraId))

      const existente = await programacionRepository.buscarPorObraFecha(input.obraId, fechaUtc, tx)
      if (existente) {
        throw new ConflictError('Ya existe una programación para esa fecha; edítala en lugar de crear otra.')
      }

      // Valida que todos los formularios sean de Prevención y estén activos.
      await validarFormularios(input.formularioIds, tx)

      const usuarioId = await programacionRepository.titularPrevencionista(input.obraId, tx)
      const dia = await programacionRepository.crearDia(
        { obraId: input.obraId, fecha: fechaUtc, comentario: input.comentario ?? null, usuarioId, creadoPor },
        tx
      )
      for (let i = 0; i < input.formularioIds.length; i++) {
        await programacionRepository.crearLinea(dia.id, input.formularioIds[i], i, creadoPor, tx)
      }
      return dia.id
    })

    return this.obtenerDia(id)
  },

  async actualizarComentario(
    id: number,
    input: ActualizarComentarioInput,
    actualizadoPor: string
  ): Promise<ProgramacionDiaDTO> {
    await this.exigirDiaEditable(id)
    await programacionRepository.actualizarComentario(id, input.comentario, actualizadoPor)
    return this.obtenerDia(id)
  },

  /** Anexa formularios a un día existente (ignora los ya agendados). */
  async agregarFormularios(
    id: number,
    input: AgregarFormulariosInput,
    creadoPor: string
  ): Promise<ProgramacionDiaDTO> {
    await this.exigirDiaEditable(id)
    await prisma.$transaction(async (tx) => {
      const vivo = await programacionRepository.buscarDiaBasico(id, tx)
      if (!vivo) throw new NotFoundError('Programación', String(id))
      await validarFormularios(input.formularioIds, tx)
      const { ids, maxOrden } = await programacionRepository.lineasVivas(id, tx)
      let orden = maxOrden + 1
      for (const formularioId of input.formularioIds) {
        if (ids.has(formularioId)) continue // ya agendado ese día → no duplicar
        await programacionRepository.crearLinea(id, formularioId, orden, creadoPor, tx)
        orden++
      }
    })
    return this.obtenerDia(id)
  },

  async quitarFormulario(id: number, fpId: number, eliminadoPor: string): Promise<ProgramacionDiaDTO> {
    await this.exigirDiaEditable(id)
    await prisma.$transaction(async (tx) => {
      // Lock del día (FOR UPDATE) para serializar quitar líneas concurrentes y no
      // dejar el día sin formularios por una carrera (QA-PP-005).
      const vivo = await programacionRepository.lockDia(tx, id)
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
    return this.obtenerDia(id)
  },

  async eliminarDia(id: number, eliminadoPor: string): Promise<void> {
    await this.exigirDiaEditable(id)
    await prisma.$transaction(async (tx) => {
      const vivo = await programacionRepository.lockDia(tx, id)
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

  /** Carga el día y exige que su fecha no sea pasada (días pasados = solo lectura). */
  async exigirDiaEditable(id: number): Promise<void> {
    const row = await programacionRepository.buscarDia(id)
    if (!row) throw new NotFoundError('Programación', String(id))
    if (diaDe(row.fecha) < hoyStr()) {
      throw new ConflictError('No se puede modificar una programación de una fecha pasada.')
    }
  },
}

/** Lanza ConflictError si algún id no es un formulario de Prevención activo. */
async function validarFormularios(
  formularioIds: number[],
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  for (const formularioId of formularioIds) {
    const ok = await programacionRepository.formularioPrevencionActivo(formularioId, tx)
    if (!ok) {
      throw new ConflictError(`El formulario ${formularioId} no existe, no está activo o no es de Prevención.`)
    }
  }
}
