/** Tamaño de archivo legible (es-CL): 850 KB, 4,2 MB. */
export function formatearTamano(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`
}
