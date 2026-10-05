import { env } from '../../config/env.js'

export interface AnalisisIAInput {
  obra: string
  inspector: string
  ubicacion: string
  imagenes: Buffer[] // o URLs ya subidas
}

export interface AnalisisIAOutput {
  observaciones: string // texto editable por el usuario antes de guardar
}

export interface AnalisisIAProvider {
  analizar(input: AnalisisIAInput): Promise<AnalisisIAOutput>
}

class MockAnalisisIAProvider implements AnalisisIAProvider {
  async analizar(input: AnalisisIAInput): Promise<AnalisisIAOutput> {
    return {
      observaciones: `[MOCK] Revisión de ${input.imagenes.length} imagen(es) en ${input.obra}. Sin hallazgos detectados.`,
    }
  }
}

// class GeminiAnalisisIAProvider implements AnalisisIAProvider { ... }
// a implementar cuando ALCOP entregue la API key (AI_PROVIDER=gemini)

export function getAnalisisIAProvider(): AnalisisIAProvider {
  if (env.AI_PROVIDER === 'gemini') {
    throw new Error('GeminiAnalisisIAProvider aún no implementado — usar AI_PROVIDER=mock')
  }
  return new MockAnalisisIAProvider()
}
