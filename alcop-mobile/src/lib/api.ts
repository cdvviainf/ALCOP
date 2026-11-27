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
  if (err instanceof ErrorSubida) return err.message
  if (err instanceof TypeError) return 'Sin conexión con el servidor. Revisa tu red e intenta de nuevo.'
  return fallback
}

/** Error HTTP de una subida multipart (mismo formato de mensaje que la API). */
export class ErrorSubida extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

/**
 * POST multipart (fotos). Usa XMLHttpRequest: el `fetch` de Expo SDK 58 no acepta
 * archivos `{ uri, name, type }` en FormData, que es lo que entrega la cámara/galería.
 */
export async function subirMultipart<T = unknown>(ruta: string, fd: FormData, timeoutMs = 180_000): Promise<T> {
  const cookie = await authClient.getCookie()
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/${ruta}`)
    xhr.timeout = timeoutMs
    if (cookie) xhr.setRequestHeader('Cookie', cookie)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        // respuesta no JSON
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body as T)
      const msg = (body as { error?: { message?: string } } | null)?.error?.message
      reject(
        new ErrorSubida(
          xhr.status,
          msg ??
            (xhr.status === 401
              ? 'Tu sesión expiró. Vuelve a ingresar.'
              : xhr.status === 413
                ? 'La foto es demasiado grande.'
                : 'No se pudo subir la información.')
        )
      )
    }
    xhr.onerror = () => reject(new TypeError('Network request failed'))
    xhr.ontimeout = () => reject(new ErrorSubida(0, 'La subida tardó demasiado. Revisa tu conexión e intenta de nuevo.'))
    xhr.send(fd)
  })
}
