import ky, { isHTTPError, type BeforeErrorHook } from 'ky'

interface ApiErrorBody {
  error?: {
    message?: string
    // El error handler de alcop-api serializa ZodError con error.flatten(), que
    // deja el mensaje específico de cada campo aquí en vez de en `message`
    // (`message` siempre es el genérico "Datos inválidos" para VALIDATION_ERROR).
    details?: {
      formErrors?: string[]
      fieldErrors?: Record<string, string[]>
    }
  }
}

// ky v2: el body de la respuesta ya viene consumido en error.data cuando corren
// los hooks beforeError — usar error.data, no error.response.json().
const beforeErrorHook: BeforeErrorHook = ({ error }) => {
  if (isHTTPError(error)) {
    const data = error.data as ApiErrorBody | undefined
    const details = data?.error?.details
    const specificMessages = [
      ...Object.values(details?.fieldErrors ?? {}).flat(),
      ...(details?.formErrors ?? []),
    ].filter(Boolean)

    if (specificMessages.length > 0) {
      error.message = specificMessages.join(' · ')
    } else if (data?.error?.message) {
      error.message = data.error.message
    }
  }
  return error
}

// Prefijo relativo ('/api', mismo origen del frontend) en vez de
// NEXT_PUBLIC_API_URL directo: si alcop-web y alcop-api viven en dominios
// distintos (subdominios separados en el demo de Coolify), la cookie de sesión
// — seteada para el dominio del frontend por el proxy de auth
// (src/app/api/auth/[...all]/route.ts) — nunca llegaría a un dominio cruzado.
// Todas las llamadas pasan por el proxy genérico (src/app/api/[...path]/route.ts),
// que reenvía al backend real conservando las cookies entrantes.
export const api = ky.create({
  prefix: '/api',
  credentials: 'include',
  hooks: {
    beforeError: [beforeErrorHook],
  },
})
