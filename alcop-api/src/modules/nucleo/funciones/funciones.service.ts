import { funcionesRepository } from './funciones.repository.js'
import type { FuncionDTO } from './funciones.types.js'

export const funcionesService = {
  async listar(): Promise<FuncionDTO[]> {
    return funcionesRepository.listar()
  },
}
