// URL de la API (Docs/app-movil.md §4). En el emulador de Android, 10.0.2.2 es el
// localhost del computador; en un teléfono físico usar la IP de la red local.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001/api').replace(/\/$/, '')

/** Origen del backend (Better Auth vive en `${AUTH_URL}/api/auth`). */
export const AUTH_URL = API_URL.replace(/\/api$/, '')
