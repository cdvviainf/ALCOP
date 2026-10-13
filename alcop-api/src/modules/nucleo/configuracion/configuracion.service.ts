import type { CalidadImagen } from '@prisma/client'
import { configuracionRepository } from './configuracion.repository.js'

export const CLAVE_CALIDAD_IMAGEN = 'calidad_imagen_default'
const CALIDADES: CalidadImagen[] = ['ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA']
const CALIDAD_POR_DEFECTO: CalidadImagen = 'OPTIMIZADA'

export const configuracionService = {
  /** Calidad de imagen sugerida por el sistema (Docs/tecnica.md §4, dec. #2). */
  async obtenerCalidadImagen(): Promise<CalidadImagen> {
    const row = await configuracionRepository.obtenerValor(CLAVE_CALIDAD_IMAGEN)
    const v = row?.valor as CalidadImagen | undefined
    return v && CALIDADES.includes(v) ? v : CALIDAD_POR_DEFECTO
  },

  async setCalidadImagen(valor: CalidadImagen): Promise<{ calidadImagenDefault: CalidadImagen }> {
    await configuracionRepository.setValor(CLAVE_CALIDAD_IMAGEN, valor)
    return { calidadImagenDefault: valor }
  },
}
