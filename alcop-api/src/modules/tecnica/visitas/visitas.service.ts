import { Prisma, type CalidadImagen, type EstadoVisita, type TipoRegistroHallazgo } from '@prisma/client'
import { env } from '../../../config/env.js'
import { prisma } from '../../../lib/prisma.js'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { esImagenValida, optimizarImagen } from '../../../shared/imagen.js'
import { htmlToPdf } from '../../../shared/pdf.js'
import { configuracionService } from '../../nucleo/configuracion/configuracion.service.js'
import { construirHtmlReporte } from './visitas.reporte.js'
import { visitasRepository } from './visitas.repository.js'
import type {
  ActualizarHallazgoInput,
  ActualizarVisitaInput,
  CrearHallazgoInput,
  CrearVisitaInput,
  FinalizarVisitaInput,
} from './visitas.schema.js'
import type { FotoDTO, HallazgoDTO, VisitaDetalleDTO, VisitaDTO } from './visitas.types.js'

type FotoRow = {
  id: number
  mimetype: string
  calidad: CalidadImagen
  tamano: number
  ancho: number | null
  alto: number | null
  orden: number
}
type HallazgoRow = {
  id: number
  comentario: string | null
  orden: number
  tipoRegistro: TipoRegistroHallazgo
  loteUnidad: { id: number; descripcion: string }
  tipoHallazgo: { id: number; nombre: string } | null
  fotos: FotoRow[]
}
type VisitaRow = {
  id: number
  fecha: Date
  horaInicio: string | null
  horaTermino: string | null
  estado: EstadoVisita
  resumenFinal: string | null
  creadoEn: Date
  obra: { id: number; codigo: string; nombre: string }
  usuario: { id: string; nombre: string }
  hallazgos: HallazgoRow[]
}

function fotoToDTO(f: FotoRow): FotoDTO {
  return {
    id: f.id,
    mimetype: f.mimetype,
    calidad: f.calidad,
    tamano: f.tamano,
    ancho: f.ancho,
    alto: f.alto,
    orden: f.orden,
    url: `/api/tecnica/fotos/${f.id}`,
  }
}

function hallazgoToDTO(h: HallazgoRow): HallazgoDTO {
  return {
    id: h.id,
    loteUnidad: h.loteUnidad,
    tipoRegistro: h.tipoRegistro,
    tipoHallazgo: h.tipoHallazgo,
    comentario: h.comentario,
    orden: h.orden,
    fotos: h.fotos.map(fotoToDTO),
  }
}

function baseVisitaDTO(row: {
  id: number
  fecha: Date
  horaInicio: string | null
  horaTermino: string | null
  estado: EstadoVisita
  creadoEn: Date
  obra: { id: number; codigo: string; nombre: string }
  usuario: { id: string; nombre: string }
}) {
  return {
    id: row.id,
    obra: row.obra,
    usuario: row.usuario,
    fecha: row.fecha.toISOString(),
    horaInicio: row.horaInicio,
    horaTermino: row.horaTermino,
    estado: row.estado,
    creadoEn: row.creadoEn.toISOString(),
  }
}

function toDTO(row: Parameters<typeof baseVisitaDTO>[0] & { _count: { hallazgos: number } }): VisitaDTO {
  return { ...baseVisitaDTO(row), hallazgos: row._count.hallazgos }
}

function detalleToDTO(row: VisitaRow): VisitaDetalleDTO {
  return {
    ...baseVisitaDTO(row),
    resumenFinal: row.resumenFinal,
    hallazgos: row.hallazgos.map(hallazgoToDTO),
  }
}

/**
 * Bloquea la fila de la visita (SELECT … FOR UPDATE) y exige EN_CURSO. Serializa
 * finalizar y las mutaciones de hallazgo/foto sobre una misma visita, evitando el
 * TOCTOU que permitía finalizar con un hallazgo vacío por carrera (QA-OLA-A-011).
 */
async function lockVisitaEnCurso(
  tx: Prisma.TransactionClient,
  visitaId: number
): Promise<{ obraId: number; horaInicio: string | null; horaTermino: string | null }> {
  const rows = await tx.$queryRaw<
    Array<{ obraId: number; estado: EstadoVisita; horaInicio: string | null; horaTermino: string | null }>
  >`SELECT "obraId", estado, "horaInicio", "horaTermino" FROM "VisitaTecnica" WHERE id = ${visitaId} AND "eliminadoEn" IS NULL FOR UPDATE`
  const v = rows[0]
  if (!v) throw new NotFoundError('Visita', String(visitaId))
  if (v.estado !== 'EN_CURSO') throw new ConflictError('La visita está finalizada; no se puede modificar.')
  return { obraId: v.obraId, horaInicio: v.horaInicio, horaTermino: v.horaTermino }
}

export const visitasService = {
  async listar(
    pagination: PaginationQuery,
    opts: {
      q?: string
      obraId?: number
      usuarioId?: string
      estado?: 'EN_CURSO' | 'FINALIZADA'
      orden: 'fecha' | 'obra' | 'inspector'
      dir: 'asc' | 'desc'
    }
  ): Promise<Paginated<VisitaDTO>> {
    const { rows, total } = await visitasRepository.listar(pagination, opts)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async listarInspectores(): Promise<Array<{ id: string; nombre: string }>> {
    return visitasRepository.inspectores()
  },

  async obtener(id: number): Promise<VisitaDetalleDTO> {
    const row = await visitasRepository.buscarPorId(id)
    if (!row) throw new NotFoundError('Visita', String(id))
    return detalleToDTO(row)
  },

  /** Genera el PDF del reporte de la visita (HTML→PDF, Docs/tecnica.md §5.5).
   *  Solo para visitas FINALIZADA: el reporte oficial se emite tras cerrar (QA-OLA-B-004). */
  async generarReportePdf(id: number): Promise<{ pdf: Buffer; obraCodigo: string }> {
    const data = await visitasRepository.reporteData(id)
    if (!data) throw new NotFoundError('Visita', String(id))
    if (data.estado !== 'FINALIZADA') {
      throw new ConflictError('El reporte solo está disponible una vez finalizada la visita.')
    }
    const pdf = await htmlToPdf(construirHtmlReporte(data))
    return { pdf, obraCodigo: data.obra.codigo }
  },

  async crear(data: CrearVisitaInput, usuarioId: string): Promise<VisitaDetalleDTO> {
    const obra = await visitasRepository.obraExiste(data.obraId)
    if (!obra) throw new NotFoundError('Obra', String(data.obraId))
    const row = await visitasRepository.crear(data, usuarioId)
    return detalleToDTO(row)
  },

  async actualizar(id: number, data: ActualizarVisitaInput, actualizadoPor: string): Promise<VisitaDetalleDTO> {
    return prisma.$transaction(async (tx) => {
      const { horaInicio, horaTermino } = await lockVisitaEnCurso(tx, id)
      // Coherencia de horas ante PATCH parcial: combina lo recibido con lo persistido (QA-OLA-A-005).
      const inicioEf = data.horaInicio !== undefined ? data.horaInicio : horaInicio
      const terminoEf = data.horaTermino !== undefined ? data.horaTermino : horaTermino
      if (inicioEf && terminoEf && terminoEf < inicioEf) {
        throw new BusinessError('VALIDATION_ERROR', 'La hora de término no puede ser anterior al inicio.', 422)
      }
      const row = await visitasRepository.actualizar(id, data, actualizadoPor, tx)
      return detalleToDTO(row)
    })
  },

  async finalizar(id: number, data: FinalizarVisitaInput, actualizadoPor: string): Promise<VisitaDetalleDTO> {
    return prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, id)
      const hallazgos = await visitasRepository.contarHallazgos(id, tx)
      if (hallazgos === 0) {
        throw new ConflictError('No se puede finalizar una visita sin registros.')
      }
      // Reglas por tipo de registro (Docs/tecnica.md §7): comentario obligatorio en
      // ambos; foto obligatoria solo en HALLAZGO. Las fotos se suben en paso aparte,
      // así que la obligatoriedad de foto se valida aquí, al cerrar.
      const sinComentario = await visitasRepository.contarSinComentario(id, tx)
      if (sinComentario > 0) {
        throw new ConflictError(`No se puede finalizar: ${sinComentario} registro(s) sin comentario.`)
      }
      const sinFoto = await visitasRepository.contarHallazgosSinFoto(id, tx)
      if (sinFoto > 0) {
        throw new ConflictError(`No se puede finalizar: ${sinFoto} hallazgo(s) sin foto (los hallazgos requieren al menos una foto).`)
      }
      const row = await visitasRepository.finalizar(id, data.resumenFinal ?? null, actualizadoPor, tx)
      return detalleToDTO(row)
    })
  },

  async eliminar(id: number, eliminadoPor: string): Promise<void> {
    const visita = await visitasRepository.buscarBasica(id)
    if (!visita) throw new NotFoundError('Visita', String(id))
    // Soft delete con timestamp, en cualquier estado (decisión de Christian 13-10-2026:
    // la lista ofrece eliminar; supersede QA-OLA-A-004). Reversible: eliminadoEn/eliminadoPor.
    await visitasRepository.softDelete(id, eliminadoPor)
  },

  // ─── Hallazgos ─────────────────────────────────────────────────────────────
  async agregarHallazgo(visitaId: number, data: CrearHallazgoInput): Promise<HallazgoDTO> {
    return prisma.$transaction(async (tx) => {
      const { obraId } = await lockVisitaEnCurso(tx, visitaId)
      const unidad = await visitasRepository.loteUnidadDeObra(data.loteUnidadId, obraId, tx)
      if (!unidad) throw new ConflictError('La unidad de lote no pertenece a la obra de la visita.')
      // El tipo de hallazgo (catálogo) solo aplica a HALLAZGO; en NOTA_TECNICA se ignora.
      let tipoHallazgoId: number | null = null
      if (data.tipoRegistro === 'HALLAZGO') {
        if (!data.tipoHallazgoId) throw new BusinessError('VALIDATION_ERROR', 'El tipo de hallazgo es obligatorio.', 422)
        const tipo = await visitasRepository.tipoHallazgoActivo(data.tipoHallazgoId, tx)
        if (!tipo) throw new NotFoundError('Tipo de hallazgo', String(data.tipoHallazgoId))
        tipoHallazgoId = data.tipoHallazgoId
      }
      const orden = await visitasRepository.contarHallazgos(visitaId, tx)
      const row = await visitasRepository.crearHallazgo(
        visitaId,
        { loteUnidadId: data.loteUnidadId, tipoRegistro: data.tipoRegistro, tipoHallazgoId, comentario: data.comentario },
        orden,
        tx
      )
      return hallazgoToDTO(row)
    })
  },

  async actualizarHallazgo(
    visitaId: number,
    hallazgoId: number,
    data: ActualizarHallazgoInput
  ): Promise<HallazgoDTO> {
    return prisma.$transaction(async (tx) => {
      const { obraId } = await lockVisitaEnCurso(tx, visitaId)
      const hallazgo = await visitasRepository.buscarHallazgo(hallazgoId, tx)
      if (!hallazgo || hallazgo.visitaId !== visitaId) throw new NotFoundError('Hallazgo', String(hallazgoId))
      if (data.loteUnidadId !== undefined) {
        const unidad = await visitasRepository.loteUnidadDeObra(data.loteUnidadId, obraId, tx)
        if (!unidad) throw new ConflictError('La unidad de lote no pertenece a la obra de la visita.')
      }
      // Resuelve el tipo de registro efectivo (el enviado o el actual) y, con él, el
      // tipo de hallazgo: obligatorio+activo para HALLAZGO; forzado a null en NOTA_TECNICA.
      const tipoRegistroEf = data.tipoRegistro ?? hallazgo.tipoRegistro
      let tipoHallazgoIdEf: number | null
      if (tipoRegistroEf === 'NOTA_TECNICA') {
        tipoHallazgoIdEf = null
      } else {
        tipoHallazgoIdEf = data.tipoHallazgoId !== undefined ? data.tipoHallazgoId : hallazgo.tipoHallazgoId
        if (!tipoHallazgoIdEf) {
          throw new BusinessError('VALIDATION_ERROR', 'El tipo de hallazgo es obligatorio para un hallazgo.', 422)
        }
        const tipo = await visitasRepository.tipoHallazgoActivo(tipoHallazgoIdEf, tx)
        if (!tipo) throw new NotFoundError('Tipo de hallazgo', String(tipoHallazgoIdEf))
      }
      const row = await visitasRepository.actualizarHallazgo(
        hallazgoId,
        {
          loteUnidadId: data.loteUnidadId,
          tipoRegistro: tipoRegistroEf,
          tipoHallazgoId: tipoHallazgoIdEf,
          comentario: data.comentario,
        },
        tx
      )
      return hallazgoToDTO(row)
    })
  },

  async quitarHallazgo(visitaId: number, hallazgoId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, visitaId)
      const hallazgo = await visitasRepository.buscarHallazgo(hallazgoId, tx)
      if (!hallazgo || hallazgo.visitaId !== visitaId) throw new NotFoundError('Hallazgo', String(hallazgoId))
      await visitasRepository.softDeleteHallazgo(hallazgoId, tx)
    })
  },

  // ─── Fotos ─────────────────────────────────────────────────────────────────
  async agregarFoto(
    hallazgoId: number,
    archivo: { buffer: Buffer } | null,
    calidad: CalidadImagen | null
  ): Promise<FotoDTO> {
    // Validación + optimización FUERA del lock (CPU-heavy; no sostener la transacción).
    if (!archivo || archivo.buffer.length === 0) {
      throw new BusinessError('ARCHIVO_REQUERIDO', 'Debe adjuntar una imagen.', 422)
    }
    if (archivo.buffer.length > env.IMAGEN_MAX_MB * 1024 * 1024) {
      throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', `La imagen supera el límite de ${env.IMAGEN_MAX_MB} MB.`, 413)
    }
    const hallazgo = await visitasRepository.buscarHallazgo(hallazgoId)
    if (!hallazgo) throw new NotFoundError('Hallazgo', String(hallazgoId))
    if (!(await esImagenValida(archivo.buffer))) {
      throw new BusinessError('ARCHIVO_INVALIDO', 'El archivo no es una imagen válida.', 422)
    }
    const calidadEf = calidad ?? (await configuracionService.obtenerCalidadImagen())
    const optimizada = await optimizarImagen(archivo.buffer, calidadEf)

    return prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, hallazgo.visitaId)
      // Re-verifica que el hallazgo siga vivo dentro del lock.
      const vivo = await visitasRepository.buscarHallazgo(hallazgoId, tx)
      if (!vivo) throw new NotFoundError('Hallazgo', String(hallazgoId))
      const orden = await visitasRepository.contarFotos(hallazgoId, tx)
      const row = await visitasRepository.crearFoto(
        hallazgoId,
        { mimetype: optimizada.mimetype, calidad: calidadEf, tamano: optimizada.tamano, ancho: optimizada.ancho, alto: optimizada.alto },
        orden,
        optimizada.buffer,
        tx
      )
      return fotoToDTO(row)
    })
  },

  async descargarFoto(fotoId: number): Promise<{ datos: Buffer; mimetype: string }> {
    const foto = await visitasRepository.buscarFotoParaDescarga(fotoId)
    if (!foto || !foto.data) throw new NotFoundError('Foto', String(fotoId))
    return { datos: Buffer.from(foto.data.datos), mimetype: foto.mimetype }
  },

  async quitarFoto(fotoId: number): Promise<void> {
    const foto = await visitasRepository.buscarFotoConVisita(fotoId)
    if (!foto || foto.hallazgo.eliminadoEn || foto.hallazgo.visita.eliminadoEn) {
      throw new NotFoundError('Foto', String(fotoId))
    }
    const visitaId = foto.hallazgo.visita.id
    await prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, visitaId)
      await visitasRepository.borrarFoto(fotoId, tx)
    })
  },
}
