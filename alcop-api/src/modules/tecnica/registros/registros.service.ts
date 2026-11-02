import { Prisma, type CalidadImagen } from '@prisma/client'
import { env } from '../../../config/env.js'
import { prisma } from '../../../lib/prisma.js'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { esImagenValida, optimizarImagen } from '../../../shared/imagen.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { htmlToPdf } from '../../../shared/pdf.js'
import { mapValores, tieneValor, type GuardarRespuestasInput } from '../../../shared/respuestas-formulario.js'
import { configuracionService } from '../../nucleo/configuracion/configuracion.service.js'
import { construirHtmlReporte } from '../../prevencion/registros/registros.reporte.js'
import type { AplicarFormularioInput, CerrarRegistroInput, EstadoRegistroTecnico } from './registros.schema.js'
import { registrosTecnicaRepository as repo } from './registros.repository.js'
import type { RegistroTecnicoDetalleDTO, RegistroTecnicoListaDTO } from './registros.types.js'

const TZ_OBRA = 'America/Santiago'
const diaObraFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_OBRA, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Día de un instante en la zona de la obra (la fecha de aplicación es un timestamp). */
const diaObra = (fecha: Date): string => diaObraFmt.format(fecha)
/** Las fechas de revisión se guardan como día en UTC. */
const diaGuardado = (fecha: Date | null): string | null => (fecha ? fecha.toISOString().slice(0, 10) : null)
const fotoUrl = (id: number) => `/api/tecnica/registros/fotos/${id}`
const estadoDe = (estado: 'BORRADOR' | 'CERRADO'): EstadoRegistroTecnico => (estado === 'CERRADO' ? 'COMPLETADO' : 'EN_PROGRESO')

const EDITAR_CERRADO = 'El registro está cerrado; no se puede editar.'
const FORM_INACTIVO = 'El formulario está desactivado; no admite respuestas.'

export const registrosTecnicaService = {
  formulariosOpciones() {
    return repo.formulariosAplicables()
  },

  /**
   * Aplica un formulario en una obra. Si ya hay un borrador abierto de ese formulario
   * en esa obra lo retoma: hay uno solo abierto a la vez (índice único parcial).
   */
  async aplicar(input: AplicarFormularioInput, usuarioId: string): Promise<{ id: number; reanudado: boolean }> {
    if (!(await repo.obraViva(input.obraId))) throw new NotFoundError('Obra', String(input.obraId))
    if (!(await repo.formularioAplicable(input.formularioId))) {
      throw new ConflictError('El formulario no se puede aplicar: debe ser de Técnica, estar activo y tener preguntas.')
    }
    const abierto = await repo.borradorAbierto(input.obraId, input.formularioId)
    if (abierto) return { id: abierto.id, reanudado: true }
    try {
      const creado = await repo.crear({ ...input, usuarioId })
      return { id: creado.id, reanudado: false }
    } catch (err) {
      // Otro usuario lo abrió al mismo tiempo: se retoma ese borrador.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const otro = await repo.borradorAbierto(input.obraId, input.formularioId)
        if (otro) return { id: otro.id, reanudado: true }
      }
      throw err
    }
  },

  async listar(
    pagination: PaginationQuery,
    obraId: number,
    estado: EstadoRegistroTecnico | undefined
  ): Promise<Paginated<RegistroTecnicoListaDTO>> {
    if (!(await repo.obraViva(obraId))) throw new NotFoundError('Obra', String(obraId))
    const { rows, total } = await repo.listar(pagination, obraId, estado)
    const data = rows.map((r) => ({
      id: r.id,
      fecha: diaObra(r.fechaHora),
      obra: r.obra,
      formulario: r.formulario,
      estado: estadoDe(r.estado),
      responsable: r.usuario.nombre,
      fechaRevision: diaGuardado(r.fechaRevision),
    }))
    return paginate(data, total, pagination)
  },

  async obtener(id: number): Promise<RegistroTecnicoDetalleDTO> {
    const reg = await repo.buscar(id)
    if (!reg) throw new NotFoundError('Registro', String(id))
    return {
      id: reg.id,
      fecha: diaObra(reg.fechaHora),
      obra: reg.obra,
      formulario: { id: reg.formulario.id, codigo: reg.formulario.codigo, nombre: reg.formulario.nombre },
      estado: estadoDe(reg.estado),
      cerrado: reg.estado === 'CERRADO',
      fechaRevision: diaGuardado(reg.fechaRevision),
      preguntas: reg.formulario.preguntas,
      respuestas: reg.respuestas.map((r) => ({
        preguntaId: r.preguntaId,
        valorTexto: r.valorTexto,
        valorNumero: r.valorNumero !== null ? Number(r.valorNumero) : null,
        valorCheckbox: r.valorCheckbox,
        valorSeleccionMultiple: r.valorSeleccionMultiple,
        fotos: r.fotos.map((f) => ({ id: f.id, mimetype: f.mimetype, orden: f.orden, url: fotoUrl(f.id) })),
      })),
    }
  },

  /** Guardado parcial (no exige completar). */
  async guardar(id: number, input: GuardarRespuestasInput, usuarioId: string): Promise<RegistroTecnicoDetalleDTO> {
    await prisma.$transaction(async (tx) => {
      if (!(await repo.lock(tx, id))) throw new NotFoundError('Registro', String(id))
      const reg = await repo.buscar(id, tx)
      if (!reg) throw new NotFoundError('Registro', String(id))
      if (reg.estado === 'CERRADO') throw new ConflictError(EDITAR_CERRADO)
      if (!reg.formulario.activo) throw new ConflictError(FORM_INACTIVO)

      const preguntas = new Map(reg.formulario.preguntas.map((p) => [p.id, p]))
      // Valida y mapea antes de escribir (si algo falla, no se guarda nada).
      const aGuardar = input.respuestas.map((item) => {
        const p = preguntas.get(item.preguntaId)
        if (!p) throw new ConflictError(`La pregunta ${item.preguntaId} no pertenece a este formulario.`)
        return { preguntaId: item.preguntaId, valores: mapValores(p.tipoRespuesta, item, p.opciones) }
      })
      for (const r of aGuardar) await repo.upsertRespuestaPregunta(id, r.preguntaId, r.valores, tx)
      await repo.tocarRespuesta(id, usuarioId, tx)
    })
    return this.obtener(id)
  },

  /** Cierra el registro: exige obligatorias (valores + fotos) y fecha de revisión. */
  async cerrar(id: number, input: CerrarRegistroInput, usuarioId: string): Promise<RegistroTecnicoDetalleDTO> {
    if (input.fechaRevision > diaObra(new Date())) throw new ConflictError('La fecha de revisión no puede ser futura.')

    await prisma.$transaction(async (tx) => {
      if (!(await repo.lock(tx, id))) throw new NotFoundError('Registro', String(id))
      const reg = await repo.buscar(id, tx)
      if (!reg) throw new NotFoundError('Registro', String(id))
      if (reg.estado === 'CERRADO') throw new ConflictError('El registro ya está cerrado.')
      if (!reg.formulario.activo) throw new ConflictError('El formulario está desactivado; no se puede cerrar.')

      const porPregunta = new Map(reg.respuestas.map((r) => [r.preguntaId, r]))
      for (const p of reg.formulario.preguntas) {
        const r = porPregunta.get(p.id)
        if (p.obligatoria && !tieneValor(p.tipoRespuesta, r)) {
          throw new ConflictError(`Falta responder una pregunta obligatoria: "${p.texto}".`)
        }
        if (p.permiteFoto && p.fotoObligatoria && (r?.fotos.length ?? 0) === 0) {
          throw new ConflictError(`Falta la foto obligatoria de: "${p.texto}".`)
        }
      }
      await repo.cerrar(id, new Date(`${input.fechaRevision}T00:00:00.000Z`), usuarioId, tx)
    })
    return this.obtener(id)
  },

  async agregarFoto(
    id: number,
    preguntaId: number,
    archivo: { buffer: Buffer } | null,
    calidad: CalidadImagen | null,
    usuarioId: string
  ): Promise<{ id: number; mimetype: string; orden: number; url: string }> {
    if (!archivo || archivo.buffer.length === 0) throw new BusinessError('ARCHIVO_REQUERIDO', 'Debe adjuntar una imagen.', 422)
    if (archivo.buffer.length > env.IMAGEN_MAX_MB * 1024 * 1024) {
      throw new BusinessError('ARCHIVO_DEMASIADO_GRANDE', `La imagen supera el límite de ${env.IMAGEN_MAX_MB} MB.`, 413)
    }
    if (!(await esImagenValida(archivo.buffer))) {
      throw new BusinessError('ARCHIVO_INVALIDO', 'El archivo no es una imagen válida.', 422)
    }
    const calidadEf = calidad ?? (await configuracionService.obtenerCalidadImagen())
    const optimizada = await optimizarImagen(archivo.buffer, calidadEf)

    return prisma.$transaction(async (tx) => {
      if (!(await repo.lock(tx, id))) throw new NotFoundError('Registro', String(id))
      const reg = await repo.buscar(id, tx)
      if (!reg) throw new NotFoundError('Registro', String(id))
      if (reg.estado === 'CERRADO') throw new ConflictError(EDITAR_CERRADO)
      if (!reg.formulario.activo) throw new ConflictError(FORM_INACTIVO)
      const pregunta = reg.formulario.preguntas.find((p) => p.id === preguntaId)
      if (!pregunta) throw new NotFoundError('Pregunta', String(preguntaId))
      if (!pregunta.permiteFoto) throw new ConflictError('Esta pregunta no admite foto.')

      const rp = await repo.ensureRespuestaPregunta(id, preguntaId, tx)
      const orden = await repo.contarFotos(rp.id, tx)
      const foto = await repo.crearFoto(
        rp.id,
        { mimetype: optimizada.mimetype, calidad: calidadEf, tamano: optimizada.tamano, ancho: optimizada.ancho, alto: optimizada.alto },
        orden,
        optimizada.buffer,
        tx
      )
      await repo.tocarRespuesta(id, usuarioId, tx)
      return { ...foto, url: fotoUrl(foto.id) }
    })
  },

  async descargarFoto(fotoId: number): Promise<{ datos: Buffer; mimetype: string }> {
    const foto = await repo.buscarFotoParaDescarga(fotoId)
    if (!foto || !foto.data) throw new NotFoundError('Foto', String(fotoId))
    return { datos: Buffer.from(foto.data.datos), mimetype: foto.mimetype }
  },

  async quitarFoto(fotoId: number): Promise<void> {
    const previa = await repo.buscarFotoConRegistro(fotoId)
    if (!previa) throw new NotFoundError('Foto', String(fotoId))
    const registroId = previa.respuestaPregunta.respuestaFormulario.id
    await prisma.$transaction(async (tx) => {
      await repo.lock(tx, registroId)
      // Revalida dentro del lock: un cierre concurrente no debe perder una foto obligatoria.
      const vivo = await repo.buscarFotoConRegistro(fotoId, tx)
      if (!vivo) throw new NotFoundError('Foto', String(fotoId))
      if (vivo.respuestaPregunta.respuestaFormulario.estado === 'CERRADO') throw new ConflictError(EDITAR_CERRADO)
      await repo.borrarFoto(fotoId, tx)
    })
  },

  async generarReportePdf(id: number): Promise<{ pdf: Buffer; obraCodigo: string }> {
    const data = await repo.reporteData(id)
    if (!data) throw new NotFoundError('Registro', String(id))
    if (data.estado !== 'CERRADO') throw new ConflictError('El reporte solo está disponible para registros cerrados.')
    const pdf = await htmlToPdf(
      construirHtmlReporte({
        obra: data.obra,
        // El reporte formatea días en UTC: se normaliza el día local de aplicación.
        fecha: new Date(`${diaObra(data.fechaHora)}T00:00:00.000Z`),
        fechaLabel: 'Fecha de aplicación',
        formulario: data.formulario,
        respuesta: { estado: data.estado, fechaRevision: data.fechaRevision, usuario: data.usuario, respuestas: data.respuestas },
      })
    )
    return { pdf, obraCodigo: data.obra.codigo }
  },
}
