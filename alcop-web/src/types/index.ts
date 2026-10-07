// Tipos globales compartidos del frontend ALCOP.
// Se irán refinando a medida que se cierren los specs en Docs/.

/** Nivel de acceso por Área (ver Docs/usuarios-perfiles.md). */
export type NivelAcceso = 'SIN_ACCESO' | 'LECTURA' | 'TOTAL'

/**
 * Usuario autenticado tal como lo devuelve GET /api/usuarios/me (modelo v2).
 * El acceso es granular: `esAdmin` (bypass total) + un mapa de permisos efectivos
 * por función (codigo → nivel). El sidebar y el gating se construyen desde ahí.
 */
export interface UsuarioActual {
  id: string
  nombre: string
  email: string
  esAdmin: boolean
  perfil: { id: number; nombre: string } | null
  permisos: Record<string, NivelAcceso>
}

/** Envoltorio estándar de respuestas paginadas de la API. */
export interface Paginado<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/** Forma estándar de error de la API. */
export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
