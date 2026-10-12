import { createReadStream } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { isAbsolute, join, normalize, resolve } from 'node:path'
import { env } from '../config/env.js'

/**
 * Almacenamiento de archivos en disco local (Docs/lotes-procedimientos.md §4,
 * decisión #2). El `archivoUrl` persistido es una CLAVE RELATIVA dentro de
 * UPLOAD_DIR (p. ej. `procedimientos/<uuid>.pdf`), nunca una ruta absoluta del
 * host — así el storage definitivo (S3) puede migrar sin reescribir la columna.
 * El guard de seguridad evita path traversal al resolver la clave a disco.
 */

/** Carpeta raíz de subidas, resuelta una vez. */
function baseDir(): string {
  return isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : resolve(process.cwd(), env.UPLOAD_DIR)
}

/**
 * Guarda un PDF bajo `<UPLOAD_DIR>/<subcarpeta>/<uuid>.pdf` y devuelve la clave
 * relativa (`<subcarpeta>/<uuid>.pdf`). Crea la subcarpeta si no existe.
 */
export async function guardarPdf(subcarpeta: string, contenido: Buffer): Promise<string> {
  const dir = join(baseDir(), subcarpeta)
  await mkdir(dir, { recursive: true })
  const nombre = `${randomUUID()}.pdf`
  await writeFile(join(dir, nombre), contenido)
  return `${subcarpeta}/${nombre}`
}

/**
 * Resuelve una clave relativa a su ruta absoluta en disco, bloqueando cualquier
 * intento de salir de UPLOAD_DIR (`..`, rutas absolutas). Devuelve null si la
 * clave escapa de la carpeta base.
 */
export function rutaAbsoluta(claveRelativa: string): string | null {
  const base = baseDir()
  const abs = normalize(join(base, claveRelativa))
  if (abs !== base && !abs.startsWith(base + '/')) return null
  return abs
}

/** Stream de lectura de un archivo almacenado (para servir la descarga). */
export function streamArchivo(claveRelativa: string) {
  const abs = rutaAbsoluta(claveRelativa)
  if (!abs) return null
  return createReadStream(abs)
}

/** Borra físicamente un archivo almacenado (al reemplazar el PDF). Best-effort. */
export async function borrarArchivo(claveRelativa: string): Promise<void> {
  const abs = rutaAbsoluta(claveRelativa)
  if (!abs) return
  try {
    await unlink(abs)
  } catch {
    // El archivo pudo no existir (reemplazo tras fallo previo); no es crítico.
  }
}
