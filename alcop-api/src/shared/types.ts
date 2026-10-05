/**
 * Tipos globales compartidos entre módulos.
 * Los tipos de dominio específicos viven en cada `modulo.types.ts`.
 */

/** Forma canónica del cuerpo de error de la API (CLAUDE.md §6). */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/** Datos de auditoría comunes a las entidades de negocio (naming español). */
export interface Auditoria {
  creadoEn: Date
  creadoPor?: string | null
  actualizadoEn?: Date | null
  actualizadoPor?: string | null
  eliminadoEn?: Date | null
  eliminadoPor?: string | null
}
