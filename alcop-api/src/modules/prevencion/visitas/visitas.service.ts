import { Prisma, type CalidadImagen, type EstadoVisita, type PlazoUnidad } from '@prisma/client'
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
  comentario: string
  orden: number
  plazoValor: number
  plazoUnidad: PlazoUnidad
  categoria: { id: number; nombre: string }
  subcategoria: { id: number; nombre: string }
  nivelRiesgo: { id: number; nombre: string }
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
  return { ...f, url: `/api/prevencion/fotos/${f.id}` }
}

function hallazgoToDTO(h: HallazgoRow): HallazgoDTO {
  return {
    id: h.id,
    categoria: h.categoria,
    subcategoria: h.subcategoria,
    nivelRiesgo: h.nivelRiesgo,
    plazoValor: h.plazoValor,
    plazoUnidad: h.plazoUnidad,
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
  return { ...baseVisitaDTO(row), resumenFinal: row.resumenFinal, hallazgos: row.hallazgos.map(hallazgoToDTO) }
}

/** Bloquea la visita (FOR UPDATE) y exige EN_CURSO (serializa finalizar vs mutaciones). */
async function lockVisitaEnCurso(
  tx: Prisma.TransactionClient,
  visitaId: number
): Promise<{ obraId: number; horaInicio: string | null; horaTermino: string | null }> {
  const rows = await tx.$queryRaw<
    Array<{ obraId: number; estado: EstadoVisita; horaInicio: string | null; horaTermino: string | null }>
  >`SELECT "obraId", estado, "horaInicio", "horaTermino" FROM "VisitaPrevencion" WHERE id = ${visitaId} AND "eliminadoEn" IS NULL FOR UPDATE`
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
    // Lock de la obra (FOR UPDATE) para no crear la visita si la obra se elimina
    // en paralelo (QA-OKA-018).
    return prisma.$transaction(async (tx) => {
      const viva = await visitasRepository.lockObraViva(tx, data.obraId)
      if (!viva) throw new NotFoundError('Obra', String(data.obraId))
      const row = await visitasRepository.crear(data, usuarioId, tx)
      return detalleToDTO(row)
    })
  },

  async actualizar(id: number, data: ActualizarVisitaInput, actualizadoPor: string): Promise<VisitaDetalleDTO> {
    return prisma.$transaction(async (tx) => {
      const { horaInicio, horaTermino } = await lockVisitaEnCurso(tx, id)
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
      if (hallazgos === 0) throw new ConflictError('No se puede finalizar una visita sin hallazgos.')
      // Cada hallazgo de prevención requiere ≥1 foto (red de seguridad; §6/§7).
      const sinFoto = await visitasRepository.contarHallazgosSinFoto(id, tx)
      if (sinFoto > 0) {
        throw new ConflictError(`No se puede finalizar: ${sinFoto} hallazgo(s) sin foto.`)
      }
      const row = await visitasRepository.finalizar(id, data.resumenFinal ?? null, actualizadoPor, tx)
      return detalleToDTO(row)
    })
  },

  async eliminar(id: number, eliminadoPor: string): Promise<void> {
    const visita = await visitasRepository.buscarBasica(id)
    if (!visita) throw new NotFoundError('Visita', String(id))
    await visitasRepository.softDelete(id, eliminadoPor)
  },

  // ─── Hallazgos ──────────────────────────────────────────────────────────────
  async agregarHallazgo(
    visitaId: number,
    data: CrearHallazgoInput,
    archivos: Buffer[],
    calidad: CalidadImagen | null,
    creadoPor: string
  ): Promise<HallazgoDTO> {
    // Foto obligatoria en el alta (prevención: hallazgo con foto, alcop-esquema §06).
    if (archivos.length === 0) {
      throw new BusinessError('FOTO_REQUERIDA', 'Un hallazgo requiere al menos una foto.', 422)
    }
    const calidadEf = calidad ?? (await configuracionService.obtenerCalidadImagen())
    const optimizadas: Array<Awaited<ReturnType<typeof optimizarImagen>>> = []
    for (const buffer of archivos) {
      if (!buffer || buffer.length === 0) throw new BusinessError('ARCHIVO_REQUERIDO', 'Una de las imágenes está vacía.', 422)
      if (buffer.length > env.IMAGEN_MAX_MB * 1024 * 1024) {
        throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', `La imagen supera el límite de ${env.IMAGEN_MAX_MB} MB.`, 413)
      }
      if (!(await esImagenValida(buffer))) {
        throw new BusinessError('ARCHIVO_INVALIDO', 'Uno de los archivos no es una imagen válida.', 422)
      }
      optimizadas.push(await optimizarImagen(buffer, calidadEf))
    }

    return prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, visitaId)
      // Clasificación: categoría (prevención) → subcategoría (de esa categoría) → nivel.
      const categoria = await visitasRepository.categoriaPrevencion(data.categoriaId, tx)
      if (!categoria) throw new ConflictError('La categoría no existe o no es de Prevención.')
      const sub = await visitasRepository.subcategoriaDeCategoria(data.subcategoriaId, data.categoriaId, tx)
      if (!sub) throw new ConflictError('La subcategoría no pertenece a la categoría seleccionada.')
      const nivel = await visitasRepository.nivelRiesgoActivo(data.nivelRiesgoId, tx)
      if (!nivel) throw new NotFoundError('Nivel de riesgo', String(data.nivelRiesgoId))

      const orden = await visitasRepository.contarHallazgos(visitaId, tx)
      const creado = await visitasRepository.crearHallazgo(
        visitaId,
        {
          categoriaId: data.categoriaId,
          subcategoriaId: data.subcategoriaId,
          nivelRiesgoId: data.nivelRiesgoId,
          plazoValor: data.plazoValor,
          plazoUnidad: data.plazoUnidad,
          comentario: data.comentario,
          creadoPor,
        },
        orden,
        tx
      )
      for (let i = 0; i < optimizadas.length; i++) {
        const o = optimizadas[i]
        await visitasRepository.crearFoto(
          creado.id,
          { mimetype: o.mimetype, calidad: calidadEf, tamano: o.tamano, ancho: o.ancho, alto: o.alto },
          i,
          o.buffer,
          tx
        )
      }
      const detalle = await visitasRepository.buscarHallazgoDetalle(creado.id, tx)
      return hallazgoToDTO(detalle!)
    })
  },

  async actualizarHallazgo(
    visitaId: number,
    hallazgoId: number,
    data: ActualizarHallazgoInput,
    actualizadoPor: string
  ): Promise<HallazgoDTO> {
    return prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, visitaId)
      const hallazgo = await visitasRepository.buscarHallazgo(hallazgoId, tx)
      if (!hallazgo || hallazgo.visitaId !== visitaId) throw new NotFoundError('Hallazgo', String(hallazgoId))

      // Valida el triple efectivo (lo enviado combinado con lo persistido).
      const categoriaEf = data.categoriaId ?? hallazgo.categoriaId
      const subcategoriaEf = data.subcategoriaId ?? hallazgo.subcategoriaId
      if (data.categoriaId !== undefined) {
        const categoria = await visitasRepository.categoriaPrevencion(categoriaEf, tx)
        if (!categoria) throw new ConflictError('La categoría no existe o no es de Prevención.')
      }
      if (data.categoriaId !== undefined || data.subcategoriaId !== undefined) {
        const sub = await visitasRepository.subcategoriaDeCategoria(subcategoriaEf, categoriaEf, tx)
        if (!sub) throw new ConflictError('La subcategoría no pertenece a la categoría seleccionada.')
      }
      if (data.nivelRiesgoId !== undefined) {
        const nivel = await visitasRepository.nivelRiesgoActivo(data.nivelRiesgoId, tx)
        if (!nivel) throw new NotFoundError('Nivel de riesgo', String(data.nivelRiesgoId))
      }

      const row = await visitasRepository.actualizarHallazgo(hallazgoId, data, actualizadoPor, tx)
      return hallazgoToDTO(row)
    })
  },

  async quitarHallazgo(visitaId: number, hallazgoId: number, eliminadoPor: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await lockVisitaEnCurso(tx, visitaId)
      const hallazgo = await visitasRepository.buscarHallazgo(hallazgoId, tx)
      if (!hallazgo || hallazgo.visitaId !== visitaId) throw new NotFoundError('Hallazgo', String(hallazgoId))
      await visitasRepository.softDeleteHallazgo(hallazgoId, eliminadoPor, tx)
    })
  },

  // ─── Fotos ────────────────────────────────────────────────────────────────
  async agregarFoto(
    hallazgoId: number,
    archivo: { buffer: Buffer } | null,
    calidad: CalidadImagen | null
  ): Promise<FotoDTO> {
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
