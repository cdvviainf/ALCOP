import type { FastifyRequest } from 'fastify'
import type { Prisma } from '@prisma/client'
import { UnauthorizedError } from './errors.js'

/**
 * Alcance de obras de un usuario (scoping operativo por obra, 11-11-2026):
 * un usuario NO admin solo ve las obras a las que tiene acceso vivo (`UsuarioObra`);
 * `esAdmin` ve todas. Supersede el "no restringe" de nucleo-compartido.md §6.
 */
export interface AlcanceObras {
  usuarioId: string
  esAdmin: boolean
}

export function alcanceDe(request: FastifyRequest): AlcanceObras {
  if (!request.usuarioId) throw new UnauthorizedError()
  return { usuarioId: request.usuarioId, esAdmin: request.esAdmin === true }
}

/** Filtro Prisma de obras visibles para el alcance (sin incluir `eliminadoEn`). */
export function whereObrasVisibles(alcance: AlcanceObras): Prisma.ObraWhereInput {
  if (alcance.esAdmin) return {}
  return { usuarios: { some: { usuarioId: alcance.usuarioId, eliminadoEn: null } } }
}
