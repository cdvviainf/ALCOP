import { Prisma, type Obra, type RolObra } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { obrasRepository } from './obras.repository.js'
import type {
  ActualizarLoteInput,
  ActualizarObraInput,
  AgregarLoteInput,
  AsignarTitularInput,
  CrearObraInput,
} from './obras.schema.js'
import type { FormularioAplicableDTO, ObraDTO, ObraLoteDTO, TitularDTO } from './obras.types.js'

function toDTO(obra: Obra): ObraDTO {
  return {
    id: obra.id,
    codigo: obra.codigo,
    nombre: obra.nombre,
    mandante: obra.mandante,
    direccion: obra.direccion,
    comuna: obra.comuna,
    fechaInicio: obra.fechaInicio ? obra.fechaInicio.toISOString() : null,
    fechaTerminoEstimada: obra.fechaTerminoEstimada ? obra.fechaTerminoEstimada.toISOString() : null,
    estado: obra.estado,
    creadoEn: obra.creadoEn.toISOString(),
  }
}

type TitularRow = {
  id: number
  rolObra: RolObra
  creadoEn: Date
  usuario: { id: string; nombre: string; email: string }
}

function titularToDTO(row: TitularRow): TitularDTO {
  return {
    id: row.id,
    rolObra: row.rolObra,
    usuario: row.usuario,
    creadoEn: row.creadoEn.toISOString(),
  }
}

type LoteRow = {
  id: number
  cantidad: number
  creadoEn: Date
  tipoLote: { id: number; codigo: string; nombre: string; activo: boolean }
}

function loteToDTO(row: LoteRow): ObraLoteDTO {
  return {
    id: row.id,
    cantidad: row.cantidad,
    tipoLote: row.tipoLote,
    creadoEn: row.creadoEn.toISOString(),
  }
}

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/**
 * Descripción autogenerada de una unidad: "Casa 001" (Docs/tecnica.md §5.1/§6).
 * El padding es a 3, o al ancho de la cantidad total si supera 999 ("Casa 1200").
 */
function descUnidad(nombre: string, correlativo: number, ancho: number): string {
  return `${nombre} ${String(correlativo).padStart(ancho, '0')}`
}

/**
 * Sincroniza las unidades de lote de un tipo en una obra a `cantidadTarget`:
 * crea/revive 1..cantidadTarget y quita las > cantidadTarget. Si alguna unidad a
 * quitar tiene hallazgos, se rechaza (no se puede reducir). Lanza ANTES de tocar
 * el ObraLote para no dejar inconsistencia.
 */
async function sincronizarUnidades(
  obraId: number,
  tipoLoteId: number,
  nombre: string,
  cantidadTarget: number,
  db: Prisma.TransactionClient
): Promise<void> {
  const existentes = await obrasRepository.unidadesDelTipo(obraId, tipoLoteId, db)
  const activos = existentes.filter((u) => !u.eliminadoEn)
  const activosPorCorr = new Map(activos.map((u) => [u.correlativo, u] as const))
  const borradosPorCorr = new Map(
    existentes.filter((u) => u.eliminadoEn).map((u) => [u.correlativo, u.id] as const)
  )
  // Ancho del padding: 3, o los dígitos de la cantidad si supera 999 (QA-OLA-A-010).
  const ancho = Math.max(3, String(cantidadTarget).length)

  const aCrear: Array<{ correlativo: number; descripcion: string }> = []
  const aRevivir: Array<{ id: number; descripcion: string }> = []
  const aRenombrar: Array<{ id: number; descripcion: string }> = []
  for (let c = 1; c <= cantidadTarget; c++) {
    const desc = descUnidad(nombre, c, ancho)
    const activo = activosPorCorr.get(c)
    if (activo) {
      if (activo.descripcion !== desc) aRenombrar.push({ id: activo.id, descripcion: desc })
      continue
    }
    const idBorrado = borradosPorCorr.get(c)
    if (idBorrado !== undefined) aRevivir.push({ id: idBorrado, descripcion: desc })
    else aCrear.push({ correlativo: c, descripcion: desc })
  }
  const aQuitar = activos.filter((u) => u.correlativo > cantidadTarget).map((u) => u.id)
  if (aQuitar.length) {
    const conHallazgos = await obrasRepository.unidadesConHallazgos(aQuitar, db)
    if (conHallazgos.length) {
      throw new ConflictError(
        `No se puede reducir la cantidad: ${conHallazgos.length} unidad(es) tienen hallazgos registrados.`
      )
    }
  }
  await obrasRepository.aplicarSyncUnidades(obraId, tipoLoteId, aCrear, aRevivir, aRenombrar, aQuitar, db)
}

/**
 * Validación de acceso por rol (usuarios-perfiles.md §7, modelo v2): el titular
 * de un rol ligado a un área debe tener esa área habilitada en su perfil (o ser
 * administrador). ADMINISTRADOR no tiene restricción de área.
 */
function validarAccesoParaRol(
  rolObra: RolObra,
  usuario: { esAdmin: boolean; perfil: { areaPrevencion: boolean; areaTecnica: boolean } | null }
) {
  if (usuario.esAdmin) return
  if (rolObra === 'PREVENCIONISTA' && !usuario.perfil?.areaPrevencion) {
    throw new BusinessError(
      'NIVEL_INSUFICIENTE',
      'El usuario no tiene acceso a Prevención; no puede ser Prevencionista de la obra.',
      422
    )
  }
  if (rolObra === 'JEFE_DE_TERRENO' && !usuario.perfil?.areaTecnica) {
    throw new BusinessError(
      'NIVEL_INSUFICIENTE',
      'El usuario no tiene acceso a Técnica; no puede ser Jefe de Terreno de la obra.',
      422
    )
  }
}

export const obrasService = {
  async listar(pagination: PaginationQuery, q?: string): Promise<Paginated<ObraDTO>> {
    const { rows, total } = await obrasRepository.listar(pagination, q)
    return paginate(rows.map(toDTO), total, pagination)
  },

  async obtener(id: number): Promise<ObraDTO> {
    const obra = await obrasRepository.buscarPorId(id)
    if (!obra) throw new NotFoundError('Obra', String(id))
    return toDTO(obra)
  },

  async crear(data: CrearObraInput, creadoPor: string): Promise<ObraDTO> {
    try {
      const obra = await obrasRepository.crear(data, creadoPor)
      return toDTO(obra)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError(`Ya existe una obra con el código ${data.codigo}.`)
      throw err
    }
  },

  async actualizar(id: number, data: ActualizarObraInput, actualizadoPor: string): Promise<ObraDTO> {
    const existente = await obrasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Obra', String(id))

    // Validación dura de fechas también ante PATCH parcial (OBR-004): combina lo
    // recibido con lo ya persistido antes de comparar.
    const inicioEf = data.fechaInicio !== undefined ? data.fechaInicio : existente.fechaInicio
    const terminoEf =
      data.fechaTerminoEstimada !== undefined ? data.fechaTerminoEstimada : existente.fechaTerminoEstimada
    if (inicioEf && terminoEf && terminoEf < inicioEf) {
      throw new BusinessError(
        'VALIDATION_ERROR',
        'La fecha de término no puede ser anterior al inicio.',
        422
      )
    }

    try {
      const obra = await obrasRepository.actualizar(id, data, actualizadoPor)
      return toDTO(obra)
    } catch (err) {
      if (esConflictoUnico(err)) throw new ConflictError(`Ya existe una obra con ese código.`)
      throw err
    }
  },

  async eliminar(id: number, eliminadoPor: string): Promise<void> {
    const existente = await obrasRepository.buscarPorId(id)
    if (!existente) throw new NotFoundError('Obra', String(id))
    // Una obra con inspecciones registradas no se elimina (nucleo-compartido.md §6):
    // se cambia su estado (p. ej. TERMINADA) en su lugar.
    const respuestas = await obrasRepository.contarRespuestas(id)
    if (respuestas > 0) {
      throw new ConflictError(
        `No se puede eliminar: la obra tiene ${respuestas} inspección(es) registrada(s). Cambia su estado (p. ej. a Terminada) en su lugar.`
      )
    }
    await obrasRepository.softDelete(id, eliminadoPor)
  },

  // ─── Titulares ──────────────────────────────────────────────────────────
  async listarTitulares(obraId: number): Promise<TitularDTO[]> {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))
    const rows = await obrasRepository.listarTitulares(obraId)
    return rows.map(titularToDTO)
  },

  async asignarTitular(obraId: number, data: AsignarTitularInput, creadoPor: string): Promise<TitularDTO> {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))

    const usuario = await obrasRepository.buscarUsuarioParaTitular(data.usuarioId)
    if (!usuario) throw new NotFoundError('Usuario', data.usuarioId)

    validarAccesoParaRol(data.rolObra, usuario)

    if (await obrasRepository.existeTitular(obraId, data.rolObra, data.usuarioId)) {
      throw new ConflictError('Ese usuario ya está asignado a ese rol en la obra.')
    }

    const row = await obrasRepository.crearTitular(obraId, data.rolObra, data.usuarioId, creadoPor)
    return titularToDTO(row)
  },

  async quitarTitular(obraId: number, titularId: number, eliminadoPor: string): Promise<void> {
    const titular = await obrasRepository.buscarTitular(titularId)
    if (!titular || titular.obraId !== obraId) throw new NotFoundError('Titular', String(titularId))
    await obrasRepository.softDeleteTitular(titularId, eliminadoPor)
  },

  // ─── Lotes de la obra ─────────────────────────────────────────────────────
  async listarLotes(obraId: number): Promise<ObraLoteDTO[]> {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))
    const rows = await obrasRepository.listarLotes(obraId)
    return rows.map(loteToDTO)
  },

  async agregarLote(obraId: number, data: AgregarLoteInput, creadoPor: string): Promise<ObraLoteDTO> {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))
    const tipo = await obrasRepository.tipoLoteActivo(data.tipoLoteId)
    if (!tipo) throw new NotFoundError('Tipo de lote', String(data.tipoLoteId))

    // ObraLote + unidades en una sola transacción (QA-OLA-A-006).
    const row = await prisma.$transaction(async (tx) => {
      const lote = await obrasRepository.crearLote(obraId, data.tipoLoteId, data.cantidad, creadoPor, tx)
      if (!lote) throw new ConflictError('Ese tipo de lote ya está configurado en la obra. Edita su cantidad.')
      // Autogenera las unidades (Casa 001…) para la cantidad configurada.
      await sincronizarUnidades(obraId, data.tipoLoteId, lote.tipoLote.nombre, data.cantidad, tx)
      return lote
    })
    return loteToDTO(row)
  },

  async actualizarLote(
    obraId: number,
    loteId: number,
    data: ActualizarLoteInput,
    actualizadoPor: string
  ): Promise<ObraLoteDTO> {
    const lote = await obrasRepository.buscarLote(loteId)
    if (!lote || lote.obraId !== obraId) throw new NotFoundError('Lote', String(loteId))
    // Sync de unidades + cambio de cantidad en una transacción (QA-OLA-A-006). Si
    // la reducción choca con unidades con hallazgos, lanza y todo hace rollback.
    const row = await prisma.$transaction(async (tx) => {
      await sincronizarUnidades(obraId, lote.tipoLote.id, lote.tipoLote.nombre, data.cantidad, tx)
      return obrasRepository.actualizarLote(loteId, data.cantidad, actualizadoPor, tx)
    })
    return loteToDTO(row)
  },

  async quitarLote(obraId: number, loteId: number, eliminadoPor: string): Promise<void> {
    const lote = await obrasRepository.buscarLote(loteId)
    if (!lote || lote.obraId !== obraId) throw new NotFoundError('Lote', String(loteId))
    // Quita unidades (target 0) + soft-delete del lote en una transacción; rechaza
    // (y revierte) si alguna unidad tiene hallazgos.
    await prisma.$transaction(async (tx) => {
      await sincronizarUnidades(obraId, lote.tipoLote.id, lote.tipoLote.nombre, 0, tx)
      await obrasRepository.softDeleteLote(loteId, eliminadoPor, tx)
    })
  },

  async listarUnidades(obraId: number): Promise<
    Array<{ id: number; descripcion: string; correlativo: number; tipoLote: { id: number; nombre: string } }>
  > {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))
    return obrasRepository.listarUnidades(obraId)
  },

  /** Deriva los formularios de control aplicables a la obra (lotes-procedimientos.md §5.4). */
  async formulariosAplicables(obraId: number): Promise<FormularioAplicableDTO[]> {
    const obra = await obrasRepository.buscarPorId(obraId)
    if (!obra) throw new NotFoundError('Obra', String(obraId))
    const lotes = await obrasRepository.lotesParaDerivacion(obraId)

    // Dedup por formulario, agregando la trazabilidad (procedimientos + tipos de lote).
    const mapa = new Map<number, FormularioAplicableDTO & { _procs: Set<number>; _tipos: Set<number> }>()
    for (const lote of lotes) {
      const tipo = lote.tipoLote
      for (const tp of tipo.procedimientos) {
        const proc = tp.procedimiento
        for (const pf of proc.formularios) {
          const form = pf.formulario
          let entry = mapa.get(form.id)
          if (!entry) {
            entry = {
              id: form.id,
              codigo: form.codigo,
              nombre: form.nombre,
              areaId: form.areaId,
              activo: form.activo,
              procedimientos: [],
              tiposLote: [],
              _procs: new Set(),
              _tipos: new Set(),
            }
            mapa.set(form.id, entry)
          }
          if (!entry._procs.has(proc.id)) {
            entry._procs.add(proc.id)
            entry.procedimientos.push({ id: proc.id, codigo: proc.codigo, nombre: proc.nombre })
          }
          if (!entry._tipos.has(tipo.id)) {
            entry._tipos.add(tipo.id)
            entry.tiposLote.push({ id: tipo.id, nombre: tipo.nombre })
          }
        }
      }
    }
    return Array.from(mapa.values()).map(({ _procs, _tipos, ...dto }) => dto)
  },
}
