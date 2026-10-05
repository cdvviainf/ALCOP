import { FastifyInstance } from 'fastify'

/**
 * STUB — Integración Better Auth (NO cableada todavía).
 *
 * TODO (cuando se implemente el módulo `auth`):
 *   1. Instanciar Better Auth con el adaptador Prisma contra la tabla `Usuario`
 *      (id String / cuid — ver prisma/schema.prisma y Docs/usuarios-perfiles.md §4).
 *      El `Usuario` de ALCOP referencia la sesión de Better Auth; los campos de
 *      credenciales/sesión los gestiona Better Auth en sus propias tablas.
 *   2. Montar el handler de Better Auth bajo el prefijo /api/auth
 *      (ver server.ts, línea de registro comentada).
 *   3. Exponer un `preHandler`/decorator `app.authenticate` que valide la sesión
 *      y cargue `request.usuario` (usuario + perfil + niveles por área), para que
 *      cada módulo autorice por perfil + área + nivel (SIN_ACCESO/LECTURA/TOTAL),
 *      según Docs/usuarios-perfiles.md §4-6. NO hay roles fijos en código.
 *   4. Recordatorio CLAUDE.md §12.4: nunca exponer passwords/tokens/API keys en
 *      las respuestas de la API.
 *
 * Mientras tanto este plugin es un no-op para que el build pase y el server
 * arranque solo con health + swagger.
 */
export async function registerAuth(_app: FastifyInstance): Promise<void> {
  // no-op — pendiente de implementación del módulo auth.
}
