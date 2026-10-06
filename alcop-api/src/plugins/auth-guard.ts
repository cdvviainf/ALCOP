import type { preHandlerHookHandler } from 'fastify'
import type { NivelAcceso } from '@prisma/client'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

export type Area = 'PREVENCION' | 'TECNICA'

declare module 'fastify' {
  interface FastifyRequest {
    // Usuario de dominio resuelto por requireAuth (id String — cuid).
    usuarioId?: string
    perfilId?: number
    // Niveles del perfil por área (autorización ALCOP: por área, no ItemMenu).
    niveles?: { PREVENCION: NivelAcceso; TECNICA: NivelAcceso }
  }
}

/**
 * Verifica sesión activa (Better Auth) y carga el Usuario de dominio enlazado
 * por `authUserId`, su perfil y los niveles por área. Un Usuario soft-deleted o
 * inactivo no pasa (401). Adjunta `usuarioId`, `perfilId` y `niveles` al request.
 */
export const requireAuth: preHandlerHookHandler = async (request, reply) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
  if (!session?.user) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida.' } })
    return
  }

  const usuario = await prisma.usuario.findFirst({
    where: { authUserId: session.user.id, eliminadoEn: null, activo: true },
    select: {
      id: true,
      perfilId: true,
      perfil: { select: { nivelPrevencion: true, nivelTecnica: true } },
    },
  })

  if (!usuario) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión inválida o usuario inactivo.' } })
    return
  }

  request.usuarioId = usuario.id
  request.perfilId = usuario.perfilId
  request.niveles = {
    PREVENCION: usuario.perfil.nivelPrevencion,
    TECNICA: usuario.perfil.nivelTecnica,
  }
}

function cumple(nivel: NivelAcceso | undefined, min: 'LECTURA' | 'TOTAL'): boolean {
  const actual = nivel ?? 'SIN_ACCESO'
  return min === 'LECTURA' ? actual !== 'SIN_ACCESO' : actual === 'TOTAL'
}

/**
 * Nivel mínimo para un área concreta. Usar después de requireAuth: lee
 * `request.niveles` sin ir a la BD.
 */
export function requireArea(area: Area, min: 'LECTURA' | 'TOTAL'): preHandlerHookHandler {
  return async (request, reply) => {
    if (!cumple(request.niveles?.[area], min)) {
      const mensaje =
        min === 'TOTAL'
          ? 'Se requiere acceso total para esta operación.'
          : 'No tiene acceso a esta función.'
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: mensaje } })
    }
  }
}

/**
 * Como requireArea, pero satisfecho si el nivel mínimo se cumple en CUALQUIER
 * área (Prevención o Técnica).
 */
export function requireAnyArea(min: 'LECTURA' | 'TOTAL'): preHandlerHookHandler {
  return async (request, reply) => {
    const ok = cumple(request.niveles?.PREVENCION, min) || cumple(request.niveles?.TECNICA, min)
    if (!ok) {
      const mensaje =
        min === 'TOTAL'
          ? 'Se requiere acceso total para esta operación.'
          : 'No tiene acceso a esta función.'
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: mensaje } })
    }
  }
}
