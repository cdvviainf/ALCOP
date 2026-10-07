import type { preHandlerHookHandler } from 'fastify'
import type { NivelAcceso } from '@prisma/client'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

declare module 'fastify' {
  interface FastifyRequest {
    // Usuario de dominio resuelto por requireAuth (id String — cuid).
    usuarioId?: string
    // Administrador transversal: acceso TOTAL a todo (bypassa el perfil).
    esAdmin?: boolean
    // Nivel efectivo por función (codigo → nivel), ya aplicando los toggles de
    // área del perfil. Vacío para esAdmin (requirePermiso lo bypassa).
    permisos?: Record<string, NivelAcceso>
  }
}

/**
 * Verifica sesión activa (Better Auth) y carga el Usuario de dominio enlazado
 * por `authUserId`, su flag `esAdmin` y el mapa de permisos efectivos por función
 * (Docs/usuarios-perfiles.md §6 v2). Un Usuario soft-deleted o inactivo no pasa.
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
      esAdmin: true,
      perfil: {
        select: {
          areaPrevencion: true,
          areaTecnica: true,
          permisos: {
            select: { nivel: true, funcion: { select: { codigo: true, area: true } } },
          },
        },
      },
    },
  })

  if (!usuario) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión inválida o usuario inactivo.' } })
    return
  }

  const permisos: Record<string, NivelAcceso> = {}
  if (usuario.perfil) {
    for (const p of usuario.perfil.permisos) {
      // Si el Área de la función está apagada en el perfil, el nivel efectivo
      // es SIN_ACCESO sin importar el valor guardado.
      const apagada =
        (p.funcion.area === 'PREVENCION' && !usuario.perfil.areaPrevencion) ||
        (p.funcion.area === 'TECNICA' && !usuario.perfil.areaTecnica)
      permisos[p.funcion.codigo] = apagada ? 'SIN_ACCESO' : p.nivel
    }
  }

  request.usuarioId = usuario.id
  request.esAdmin = usuario.esAdmin
  request.permisos = permisos
}

function cumple(nivel: NivelAcceso | undefined, min: 'LECTURA' | 'TOTAL'): boolean {
  const actual = nivel ?? 'SIN_ACCESO'
  return min === 'LECTURA' ? actual !== 'SIN_ACCESO' : actual === 'TOTAL'
}

/**
 * Exige un nivel mínimo sobre una función concreta. Usar después de requireAuth.
 * Los administradores (`esAdmin`) pasan siempre.
 */
export function requirePermiso(codigo: string, min: 'LECTURA' | 'TOTAL'): preHandlerHookHandler {
  return async (request, reply) => {
    if (request.esAdmin) return
    if (!cumple(request.permisos?.[codigo], min)) {
      reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message:
            min === 'TOTAL'
              ? 'Se requiere acceso total para esta operación.'
              : 'No tiene acceso a esta función.',
        },
      })
    }
  }
}

/** Exige ser Administrador transversal (`esAdmin`). Config de Accesos. */
export const requireAdmin: preHandlerHookHandler = async (request, reply) => {
  if (!request.esAdmin) {
    reply
      .status(403)
      .send({ error: { code: 'FORBIDDEN', message: 'Se requiere ser administrador.' } })
  }
}
