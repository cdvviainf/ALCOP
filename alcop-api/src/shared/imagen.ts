import Jimp from 'jimp'
import type { CalidadImagen } from '@prisma/client'

/**
 * Optimización de imágenes de hallazgos (Docs/tecnica.md §4, dec. #2). Cada foto se
 * guarda EN LA BD a la calidad elegida; se redimensiona y comprime para evitar
 * grandes volúmenes. Se usa `jimp` (JavaScript puro) en lugar de `sharp`: el
 * servidor de despliegue tiene un CPU sin x86-64-v2 y los binarios prebuilt de
 * sharp 0.33+ (y su fallback WASM-SIMD) lo requieren. jimp no tiene binario nativo.
 * `ORIGINAL` conserva los bytes (solo recorta si excede el tope); el resto re-encodea
 * a JPEG con calidad decreciente.
 */

interface Preset {
  maxDim: number
  /** null = conservar bytes originales (solo tope de dimensiones). */
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

/** ¿El buffer es una imagen decodificable? */
export async function esImagenValida(entrada: Buffer): Promise<boolean> {
  try {
    await Jimp.read(entrada)
    return true
  } catch {
    return false
  }
}

export async function optimizarImagen(entrada: Buffer, calidad: CalidadImagen): Promise<ImagenOptimizada> {
  const preset = PRESETS[calidad]
  let image: Jimp
  try {
    image = await Jimp.read(entrada)
  } catch {
    throw new Error('El archivo no es una imagen válida.')
  }
  const w = image.getWidth()
  const h = image.getHeight()

  // ORIGINAL dentro del tope: se conservan los bytes tal cual.
  if (preset.jpegQuality === null && w <= preset.maxDim && h <= preset.maxDim) {
    return { buffer: entrada, mimetype: image.getMIME(), tamano: entrada.length, ancho: w, alto: h }
  }

  if (w > preset.maxDim || h > preset.maxDim) {
    // scaleToFit mantiene el aspecto y encaja dentro del tope.
    image.scaleToFit(preset.maxDim, preset.maxDim)
  }
  image.quality(preset.jpegQuality ?? 90)
  const buffer = await image.getBufferAsync(Jimp.MIME_JPEG)
  return {
    buffer,
    mimetype: 'image/jpeg',
    tamano: buffer.length,
    ancho: image.getWidth(),
    alto: image.getHeight(),
  }
}
