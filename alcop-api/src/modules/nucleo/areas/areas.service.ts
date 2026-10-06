import { areasRepository } from './areas.repository.js'
import type { AreaDTO } from './areas.types.js'

export const areasService = {
  async listar(): Promise<AreaDTO[]> {
    return areasRepository.listar()
  },
}
