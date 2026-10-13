import sharp from 'sharp'
import type { CalidadImagen } from '@prisma/client'

/**
 * Optimización de imágenes de hallazgos (Docs/tecnica.md §4, dec. #2). Cada foto
 * se guarda EN LA BD a la calidad elegida; `sharp` redimensiona y comprime para
 * evitar grandes volúmenes. `ORIGINAL` conserva los bytes (solo recorta si excede
 * un tope de seguridad); el resto re-encodea a JPEG (mozjpeg) con calidad decreciente.
 */

interface Preset {
  maxDim: number
  /** null = conservar codificación original (solo tope de dimensiones). */
  jpegQuality: number | null
}

const PRESETS: Record<CalidadImagen, Preset> = {
  ORIGINAL: { maxDim: 4000, jpegQuality: null },
  OPTIMIZADA: { maxDim: 2000, jpegQuality: 82 },
  MEDIA: { maxDim: 1280, jpegQuality: 70 },
  BAJA: { maxDim: 800, jpegQuality: 55 },
}

export interface ImagenOptimizada {
  buffer: Buffer
  mimetype: string
  tamano: number
  ancho: number | null
  alto: number | null
}

function mimeDeFormato(format: string): string {
  const map: Record<string, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    tiff: 'image/tiff',
    avif: 'image/avif',
    heif: 'image/heif',
  }
  return map[format] ?? 'application/octet-stream'
}

/** ¿El buffer es una imagen válida decodificable por sharp? */
export async function esImagenValida(entrada: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(entrada).metadata()
    return Boolean(meta.width && meta.height && meta.format)
  } catch {
    return false
  }
}

export async function optimizarImagen(entrada: Buffer, calidad: CalidadImagen): Promise<ImagenOptimizada> {
  const preset = PRESETS[calidad]
  const metaIn = await sharp(entrada).metadata()
  if (!metaIn.width || !metaIn.height || !metaIn.format) {
    throw new Error('El archivo no es una imagen válida.')
  }

  // ORIGINAL dentro del tope: se conservan los bytes tal cual.
  if (preset.jpegQuality === null && metaIn.width <= preset.maxDim && metaIn.height <= preset.maxDim) {
    return {
      buffer: entrada,
      mimetype: mimeDeFormato(metaIn.format),
      tamano: entrada.length,
      ancho: metaIn.width,
      alto: metaIn.height,
    }
  }

  // `rotate()` sin args auto-orienta según EXIF (fotos de teléfono).
  let pipeline = sharp(entrada)
    .rotate()
    .resize(preset.maxDim, preset.maxDim, { fit: 'inside', withoutEnlargement: true })
  let mimetype: string
  if (preset.jpegQuality === null) {
    // ORIGINAL que excede el tope: redimensiona conservando formato.
    mimetype = mimeDeFormato(metaIn.format)
  } else {
    pipeline = pipeline.jpeg({ quality: preset.jpegQuality, mozjpeg: true })
    mimetype = 'image/jpeg'
  }
  const buffer = await pipeline.toBuffer()
  const metaOut = await sharp(buffer).metadata()
  return {
    buffer,
    mimetype,
    tamano: buffer.length,
    ancho: metaOut.width ?? null,
    alto: metaOut.height ?? null,
  }
}
