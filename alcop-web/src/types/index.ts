// Tipos globales compartidos del frontend ALCOP.
// Se irán refinando a medida que se cierren los specs en Docs/.

/** Nivel de acceso por Área (ver Docs/usuarios-perfiles.md). */
export type NivelAcceso = 'SIN_ACCESO' | 'LECTURA' | 'TOTAL'

/**
 * Usuario autenticado tal como lo devolverá GET /api/usuarios/me.
 * El sidebar se filtra con nivelPrevencion / nivelTecnica — NO existe
 * un endpoint /menu ni el patrón ItemMenu de FAS en ALCOP.
 */
export interface UsuarioActual {
  id: number
  nombre: string
  email: string
  nivelPrevencion: NivelAcceso
  nivelTecnica: NivelAcceso
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
