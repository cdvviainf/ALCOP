import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { env } from '../config/env.js'
import { prisma } from './prisma.js'

// Better Auth: identidad y credenciales (email + password). El dominio (perfil,
// niveles por área) vive en `Usuario`, enlazado por `Usuario.authUserId →
// auth_user.id`. El registro público está deshabilitado (ver server.ts): el
// alta de usuarios la hace un administrador.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: env.CORS_ORIGIN.split(','),
  databaseHooks: {
    session: {
      create: {
        // Bloquear la sesión si no hay un Usuario de dominio activo y no
        // soft-deleted enlazado a esta identidad (authUserId). Autorización
        // por perfil + área + nivel; sin Usuario no hay sesión.
        before: async (session) => {
          const usuario = await prisma.usuario.findFirst({
            where: { authUserId: session.userId, eliminadoEn: null, activo: true },
            select: { id: true },
          })
          if (!usuario) return false
        },
      },
    },
  },
})

export type Auth = typeof auth
