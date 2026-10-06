/**
 * Slug en MAYÚSCULAS para columnas `codigo` de catálogos.
 * "Observación" -> "OBSERVACION", "No conformidad" -> "NO_CONFORMIDAD".
 * Compartido por el seed y el factory de catálogos (shared/catalogo.factory.ts).
 */
export function slugCodigo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos combinantes
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
