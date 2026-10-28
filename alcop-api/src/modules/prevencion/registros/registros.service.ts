import { Prisma, type CalidadImagen, type TipoRespuesta } from '@prisma/client'
import { env } from '../../../config/env.js'
import { prisma } from '../../../lib/prisma.js'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { esImagenValida, optimizarImagen } from '../../../shared/imagen.js'
import { htmlToPdf } from '../../../shared/pdf.js'
import { configuracionService } from '../../nucleo/configuracion/configuracion.service.js'
import { construirHtmlReporte } from './registros.reporte.js'
import { registrosRepository } from './registros.repository.js'
import type { CerrarRegistroInput, GuardarRespuestasInput, RespuestaItemInput } from './registros.schema.js'
import type {
  EstadoRegistro,
  RegistroDetalleDTO,
  RegistroListaDTO,
  RespuestaPreguntaDTO,
} from './registros.types.js'

// "Hoy" en la zona de la obra (igual que programación/procedimientos).
const TZ_OBRA = 'America/Santiago'
const hoyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_OBRA, year: 'numeric', month: '2-digit', day: '2-digit' })
function hoyStr(): string {
  return hoyFmt.format(new Date())
}
function diaDe(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}
function diaAUtc(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`)
}

// Valores canónicos del tipo CHECKBOX (formularios-dinamicos.md §4).
const CHECKBOX_VALIDOS = ['CUMPLE', 'NO_CUMPLE', 'N_A']

function estadoDe(fechaStr: string, cerrado: boolean, hoy: string): EstadoRegistro {
  if (cerrado) return 'COMPLETADO'
  if (fechaStr > hoy) return 'POR_APLICAR'
  if (fechaStr === hoy) return 'VIGENTE'
  return 'ATRASADO'
}

type ValorRow = {
  valorTexto: string | null
  valorNumero: Prisma.Decimal | null
  valorCheckbox: string | null
  valorSeleccionMultiple: string[]
}

/** ¿La respuesta satisface una pregunta obligatoria, según su tipo? */
function tieneValor(tipo: TipoRespuesta, r: ValorRow | undefined): boolean {
  if (!r) return false
  switch (tipo) {
    case 'CHECKBOX':
      return !!r.valorCheckbox && r.valorCheckbox.trim().length > 0
    case 'SELECCION_MULTIPLE':
      return r.valorSeleccionMultiple.length > 0
    case 'NUMERO':
      return r.valorNumero !== null
    case 'TEXTO':
    case 'TEXTO_LARGO':
      return !!r.valorTexto && r.valorTexto.trim().length > 0
  }
}

/** Mapea el input al único campo de valor que corresponde al tipo de la pregunta. */
function mapValores(
  tipo: TipoRespuesta,
  input: RespuestaItemInput,
  opciones: string[]
): { valorTexto: string | null; valorNumero: number | null; valorCheckbox: string | null; valorSeleccionMultiple: string[] } {
  const base = { valorTexto: null as string | null, valorNumero: null as number | null, valorCheckbox: null as string | null, valorSeleccionMultiple: [] as string[] }
  switch (tipo) {
    case 'TEXTO':
    case 'TEXTO_LARGO':
      return { ...base, valorTexto: input.valorTexto?.trim() || null }
    case 'NUMERO':
      return { ...base, valorNumero: input.valorNumero ?? null }
    case 'CHECKBOX': {
      // CHECKBOX = Cumple / No cumple / N.A. (formularios-dinamicos.md §4/§6), NO booleano.
      const val = input.valorCheckbox?.trim() || null
      if (val !== null && !CHECKBOX_VALIDOS.includes(val)) {
        throw new BusinessError('VALOR_INVALIDO', 'El valor del checkbox debe ser CUMPLE, NO_CUMPLE o N_A.', 422)
      }
      return { ...base, valorCheckbox: val }
    }
    case 'SELECCION_MULTIPLE': {
      const sel = input.valorSeleccionMultiple ?? []
      const invalida = sel.find((v) => !opciones.includes(v))
      if (invalida !== undefined) {
        throw new BusinessError('OPCION_INVALIDA', `La opción "${invalida}" no pertenece a la pregunta.`, 422)
      }
      return { ...base, valorSeleccionMultiple: sel }
    }
  }
}

type RegistroRow = NonNullable<Awaited<ReturnType<typeof registrosRepository.buscarRegistro>>>

function detalleToDTO(reg: RegistroRow, hoy: string): RegistroDetalleDTO {
  const cerrado = reg.respuesta?.estado === 'CERRADO'
  const fecha = diaDe(reg.programacion.fecha)
  const respuestas: RespuestaPreguntaDTO[] = (reg.respuesta?.respuestas ?? []).map((r) => ({
    preguntaId: r.preguntaId,
    valorTexto: r.valorTexto,
    valorNumero: r.valorNumero !== null ? Number(r.valorNumero) : null,
    valorCheckbox: r.valorCheckbox,
    valorSeleccionMultiple: r.valorSeleccionMultiple,
    fotos: r.fotos.map((f) => ({ id: f.id, mimetype: f.mimetype, orden: f.orden, url: `/api/prevencion/registros/fotos/${f.id}` })),
  }))
  return {
    id: reg.id,
    fecha,
    obra: reg.programacion.obra,
    formulario: { id: reg.formulario.id, codigo: reg.formulario.codigo, nombre: reg.formulario.nombre },
    estado: estadoDe(fecha, cerrado, hoy),
    cerrado,
    fechaRevision: reg.respuesta?.fechaRevision ? diaDe(reg.respuesta.fechaRevision) : null,
    preguntas: reg.formulario.preguntas.map((p) => ({
      id: p.id,
      orden: p.orden,
      texto: p.texto,
      tipoRespuesta: p.tipoRespuesta,
      obligatoria: p.obligatoria,
      permiteFoto: p.permiteFoto,
      fotoObligatoria: p.fotoObligatoria,
      opciones: p.opciones,
    })),
    respuestas,
  }
}

export const registrosService = {
  async listar(
    pagination: PaginationQuery,
    obraId: number,
    estado: EstadoRegistro | undefined
  ): Promise<Paginated<RegistroListaDTO>> {
    if (!(await registrosRepository.obraViva(obraId))) throw new NotFoundError('Obra', String(obraId))
    const hoy = hoyStr()
    const { rows, total } = await registrosRepository.listar(pagination, obraId, estado, diaAUtc(hoy))
    const data: RegistroListaDTO[] = rows.map((r) => {
      const cerrado = r.respuesta?.estado === 'CERRADO'
      const fecha = diaDe(r.programacion.fecha)
      return {
        id: r.id,
        fecha,
        obra: r.programacion.obra,
        formulario: { id: r.formulario.id, codigo: r.formulario.codigo, nombre: r.formulario.nombre },
        estado: estadoDe(fecha, cerrado, hoy),
        enProgreso: !cerrado && !!r.respuesta && (r.respuesta._count.respuestas > 0),
        fechaRevision: r.respuesta?.fechaRevision ? diaDe(r.respuesta.fechaRevision) : null,
      }
    })
    return paginate(data, total, pagination)
  },

  async obtener(fpId: number): Promise<RegistroDetalleDTO> {
    const reg = await registrosRepository.buscarRegistro(fpId)
    if (!reg) throw new NotFoundError('Registro', String(fpId))
    return detalleToDTO(reg, hoyStr())
  },

  /** Guardado parcial de respuestas (no exige completar). */
  async guardar(fpId: number, input: GuardarRespuestasInput, usuarioId: string): Promise<RegistroDetalleDTO> {
    await prisma.$transaction(async (tx) => {
      const vivo = await registrosRepository.lockRegistro(tx, fpId)
      if (!vivo) throw new NotFoundError('Registro', String(fpId))
      const reg = await registrosRepository.buscarRegistro(fpId, tx)
      if (!reg) throw new NotFoundError('Registro', String(fpId))
      if (reg.respuesta?.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
      if (!reg.formulario.activo) throw new ConflictError('El formulario está desactivado; no admite respuestas.')

      const preguntas = new Map(reg.formulario.preguntas.map((p) => [p.id, p]))
      // Valida y mapea antes de escribir (si algo falla, no se guarda nada).
      const aGuardar = input.respuestas.map((item) => {
        const p = preguntas.get(item.preguntaId)
        if (!p) throw new ConflictError(`La pregunta ${item.preguntaId} no pertenece a este formulario.`)
        return { preguntaId: item.preguntaId, valores: mapValores(p.tipoRespuesta, item, p.opciones) }
      })

      const rf = await registrosRepository.ensureRespuesta(
        { formularioProgramadoId: fpId, formularioId: reg.formulario.id, obraId: reg.programacion.obra.id, usuarioId },
        tx
      )
      if (rf.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
      for (const r of aGuardar) {
        await registrosRepository.upsertRespuestaPregunta(rf.id, r.preguntaId, r.valores, tx)
      }
      await registrosRepository.tocarRespuesta(rf.id, usuarioId, tx)
    })
    return this.obtener(fpId)
  },

  /** Cierra el registro: exige obligatorias (valores + fotos) y fecha de revisión. */
  async cerrar(fpId: number, input: CerrarRegistroInput, usuarioId: string): Promise<RegistroDetalleDTO> {
    const hoy = hoyStr()
    if (input.fechaRevision > hoy) throw new ConflictError('La fecha de revisión no puede ser futura.')

    await prisma.$transaction(async (tx) => {
      const vivo = await registrosRepository.lockRegistro(tx, fpId)
      if (!vivo) throw new NotFoundError('Registro', String(fpId))
      const reg = await registrosRepository.buscarRegistro(fpId, tx)
      if (!reg) throw new NotFoundError('Registro', String(fpId))
      if (reg.respuesta?.estado === 'CERRADO') throw new ConflictError('El registro ya está cerrado.')
      if (!reg.formulario.activo) throw new ConflictError('El formulario está desactivado; no se puede cerrar.')
      if (diaDe(reg.programacion.fecha) > hoy) {
        throw new ConflictError('No se puede cerrar un registro antes de su fecha de aplicación.')
      }

      // Valida obligatorias: valor presente y, si la foto es obligatoria, ≥1 foto.
      const porPregunta = new Map((reg.respuesta?.respuestas ?? []).map((r) => [r.preguntaId, r]))
      for (const p of reg.formulario.preguntas) {
        const r = porPregunta.get(p.id)
        if (p.obligatoria && !tieneValor(p.tipoRespuesta, r)) {
          throw new ConflictError(`Falta responder una pregunta obligatoria: "${p.texto}".`)
        }
        if (p.permiteFoto && p.fotoObligatoria && (r?.fotos.length ?? 0) === 0) {
          throw new ConflictError(`Falta la foto obligatoria de: "${p.texto}".`)
        }
      }

      const rf = await registrosRepository.ensureRespuesta(
        { formularioProgramadoId: fpId, formularioId: reg.formulario.id, obraId: reg.programacion.obra.id, usuarioId },
        tx
      )
      if (rf.estado === 'CERRADO') throw new ConflictError('El registro ya está cerrado.')
      await registrosRepository.cerrar(rf.id, diaAUtc(input.fechaRevision), usuarioId, tx)
    })
    return this.obtener(fpId)
  },

  // ─── Fotos ──────────────────────────────────────────────────────────────────
  async agregarFoto(
    fpId: number,
    preguntaId: number,
    archivo: { buffer: Buffer } | null,
    calidad: CalidadImagen | null,
    usuarioId: string
  ): Promise<{ id: number; mimetype: string; orden: number; url: string }> {
    if (!archivo || archivo.buffer.length === 0) throw new BusinessError('ARCHIVO_REQUERIDO', 'Debe adjuntar una imagen.', 422)
    if (archivo.buffer.length > env.IMAGEN_MAX_MB * 1024 * 1024) {
      throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', `La imagen supera el límite de ${env.IMAGEN_MAX_MB} MB.`, 413)
    }
    const reg = await registrosRepository.buscarRegistro(fpId)
    if (!reg) throw new NotFoundError('Registro', String(fpId))
    if (reg.respuesta?.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
    if (!reg.formulario.activo) throw new ConflictError('El formulario está desactivado; no admite respuestas.')
    const pregunta = reg.formulario.preguntas.find((p) => p.id === preguntaId)
    if (!pregunta) throw new NotFoundError('Pregunta', String(preguntaId))
    if (!pregunta.permiteFoto) throw new ConflictError('Esta pregunta no admite foto.')
    if (!(await esImagenValida(archivo.buffer))) {
      throw new BusinessError('ARCHIVO_INVALIDO', 'El archivo no es una imagen válida.', 422)
    }
    const calidadEf = calidad ?? (await configuracionService.obtenerCalidadImagen())
    const optimizada = await optimizarImagen(archivo.buffer, calidadEf)

    return prisma.$transaction(async (tx) => {
      const vivo = await registrosRepository.lockRegistro(tx, fpId)
      if (!vivo) throw new NotFoundError('Registro', String(fpId))
      // Revalida DENTRO del lock (QA-RP-008): buscarRegistro filtra obra/día vivos;
      // además re-chequea formulario activo, no cerrado y pregunta con foto, por si
      // algo cambió mientras se validaba/optimizaba la imagen fuera de la tx.
      const regTx = await registrosRepository.buscarRegistro(fpId, tx)
      if (!regTx) throw new NotFoundError('Registro', String(fpId))
      if (!regTx.formulario.activo) throw new ConflictError('El formulario está desactivado; no admite respuestas.')
      if (regTx.respuesta?.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
      const pTx = regTx.formulario.preguntas.find((p) => p.id === preguntaId)
      if (!pTx) throw new NotFoundError('Pregunta', String(preguntaId))
      if (!pTx.permiteFoto) throw new ConflictError('Esta pregunta no admite foto.')

      const rf = await registrosRepository.ensureRespuesta(
        { formularioProgramadoId: fpId, formularioId: regTx.formulario.id, obraId: regTx.programacion.obra.id, usuarioId },
        tx
      )
      if (rf.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
      const rp = await registrosRepository.ensureRespuestaPregunta(rf.id, preguntaId, tx)
      const orden = await registrosRepository.contarFotos(rp.id, tx)
      return registrosRepository.crearFoto(
        rp.id,
        { mimetype: optimizada.mimetype, calidad: calidadEf, tamano: optimizada.tamano, ancho: optimizada.ancho, alto: optimizada.alto },
        orden,
        optimizada.buffer,
        tx
      ).then((f) => ({ ...f, url: `/api/prevencion/registros/fotos/${f.id}` }))
    })
  },

  async descargarFoto(fotoId: number): Promise<{ datos: Buffer; mimetype: string }> {
    const foto = await registrosRepository.buscarFotoParaDescarga(fotoId)
    if (!foto || !foto.data) throw new NotFoundError('Foto', String(fotoId))
    return { datos: Buffer.from(foto.data.datos), mimetype: foto.mimetype }
  },

  async quitarFoto(fotoId: number): Promise<void> {
    const previa = await registrosRepository.buscarFotoConRegistro(fotoId)
    const fpId = previa?.respuestaPregunta.respuestaFormulario.formularioProgramadoId
    if (!previa || !fpId || previa.respuestaPregunta.respuestaFormulario.formularioProgramado?.eliminadoEn) {
      throw new NotFoundError('Foto', String(fotoId))
    }
    await prisma.$transaction(async (tx) => {
      await registrosRepository.lockRegistro(tx, fpId)
      // Revalida el estado DENTRO del lock: un cierre concurrente no debe permitir
      // borrar la foto obligatoria de un registro ya cerrado (QA-RP-003).
      const vivo = await registrosRepository.buscarFotoConRegistro(fotoId, tx)
      const rf = vivo?.respuestaPregunta.respuestaFormulario
      if (!vivo || !rf || rf.formularioProgramado?.eliminadoEn) throw new NotFoundError('Foto', String(fotoId))
      if (rf.estado === 'CERRADO') throw new ConflictError('El registro está cerrado; no se puede editar.')
      await registrosRepository.borrarFoto(fotoId, tx)
    })
  },

  async generarReportePdf(fpId: number): Promise<{ pdf: Buffer; obraCodigo: string }> {
    const data = await registrosRepository.reporteData(fpId)
    if (!data) throw new NotFoundError('Registro', String(fpId))
    if (data.respuesta?.estado !== 'CERRADO') {
      throw new ConflictError('El reporte solo está disponible para registros cerrados.')
    }
    const pdf = await htmlToPdf(construirHtmlReporte(data))
    return { pdf, obraCodigo: data.programacion.obra.codigo }
  },
}
