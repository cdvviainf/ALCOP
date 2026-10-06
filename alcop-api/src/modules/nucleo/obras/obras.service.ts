import { Prisma, type Obra, type RolObra } from '@prisma/client'
import { BusinessError, ConflictError, NotFoundError } from '../../../shared/errors.js'
import { paginate } from '../../../shared/pagination.js'
import type { Paginated, PaginationQuery } from '../../../shared/pagination.js'
import { obrasRepository } from './obras.repository.js'
import type { ActualizarObraInput, AsignarTitularInput, CrearObraInput } from './obras.schema.js'
import type { ObraDTO, TitularDTO } from './obras.types.js'

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

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/** Validación de nivel por rol (usuarios-perfiles.md §7, nucleo-compartido.md §6). */
function validarNivelParaRol(
  rolObra: RolObra,
  niveles: { nivelPrevencion: string; nivelTecnica: string }
) {
  if (rolObra === 'PREVENCIONISTA' && niveles.nivelPrevencion === 'SIN_ACCESO') {
    throw new BusinessError(
      'NIVEL_INSUFICIENTE',
      'El usuario no tiene acceso a Prevención; no puede ser Prevencionista de la obra.',
      422
    )
  }
  if (rolObra === 'JEFE_DE_TERRENO' && niveles.nivelTecnica === 'SIN_ACCESO') {
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

    const usuario = await obrasRepository.buscarUsuarioConNiveles(data.usuarioId)
    if (!usuario) throw new NotFoundError('Usuario', data.usuarioId)

    validarNivelParaRol(data.rolObra, usuario.perfil)

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
}
