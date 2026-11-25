import ky, { HTTPError } from 'ky'

import { authClient } from './auth-client'
import { API_URL } from './config'

/**
 * Cliente HTTP de la API (mismas convenciones que la web: ky v1 + TanStack Query).
 * En nativo no hay cookies del navegador: se envía la cookie de sesión guardada
 * por Better Auth en el header `Cookie` (credentials 'omit' para no pisarla).
 */
export const api = ky.create({
  prefixUrl: API_URL,
  credentials: 'omit',
  timeout: 30_000,
  retry: 0,
  hooks: {
    beforeRequest: [
      async (request) => {
        const cookie = await authClient.getCookie()
        if (cookie) request.headers.set('Cookie', cookie)
      },
    ],
  },
})

/** Mensaje legible de un error de la API (`{ error: { message } }`). */
export async function mensajeDeError(err: unknown, fallback = 'Ocurrió un error.'): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = (await err.response.clone().json()) as { error?: { message?: string } }
      if (body?.error?.message) return body.error.message
    } catch {
      // cuerpo no JSON
    }
    if (err.response.status === 401) return 'Tu sesión expiró. Vuelve a ingresar.'
    if (err.response.status === 403) return 'No tienes permiso para esta acción.'
  }
  if (err instanceof TypeError) return 'Sin conexión con el servidor. Revisa tu red e intenta de nuevo.'
  return fallback
}
