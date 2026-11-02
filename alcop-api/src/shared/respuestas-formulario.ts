import type { Prisma, TipoRespuesta } from '@prisma/client'
import { z } from 'zod'
import { BusinessError } from './errors.js'

/** Reglas de respuesta comunes a Registro Prevención y Registro Técnico. */

// Una respuesta cargada. Todos los valores son opcionales: el guardado es parcial.
// El service toma solo el campo que corresponde al tipo de la pregunta.
const respuestaItemSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
  valorTexto: z.string().trim().max(5000).nullable().optional(),
  valorNumero: z.coerce.number().nullable().optional(),
  valorCheckbox: z.string().trim().max(500).nullable().optional(),
  valorSeleccionMultiple: z.array(z.string().trim().min(1)).optional(),
})

export const guardarRespuestasSchema = z.object({
  respuestas: z.array(respuestaItemSchema).default([]),
})

export type GuardarRespuestasInput = z.infer<typeof guardarRespuestasSchema>
export type RespuestaItemInput = z.infer<typeof respuestaItemSchema>

// Valores canónicos del tipo CHECKBOX (formularios-dinamicos.md §4).
const CHECKBOX_VALIDOS = ['CUMPLE', 'NO_CUMPLE', 'N_A']

type ValorRow = {
  valorTexto: string | null
  valorNumero: Prisma.Decimal | null
  valorCheckbox: string | null
  valorSeleccionMultiple: string[]
}

/** ¿La respuesta satisface una pregunta obligatoria, según su tipo? */
export function tieneValor(tipo: TipoRespuesta, r: ValorRow | undefined): boolean {
  if (!r) return false
  switch (tipo) {
    case 'CHECKBOX':
      return !!r.valorCheckbox && r.valorCheckbox.trim().length > 0
    case 'SELECCION_MULTIPLE':
      return r.valorSeleccionMultiple.length > 0
    case 'NUMERO':
      return r.valorNumero !== null
    case 'TEXTO':
    case 'TEXTO_LARGO':
      return !!r.valorTexto && r.valorTexto.trim().length > 0
  }
}

/** Mapea el input al único campo de valor que corresponde al tipo de la pregunta. */
export function mapValores(
  tipo: TipoRespuesta,
  input: RespuestaItemInput,
  opciones: string[]
): { valorTexto: string | null; valorNumero: number | null; valorCheckbox: string | null; valorSeleccionMultiple: string[] } {
  const base = { valorTexto: null as string | null, valorNumero: null as number | null, valorCheckbox: null as string | null, valorSeleccionMultiple: [] as string[] }
  switch (tipo) {
    case 'TEXTO':
    case 'TEXTO_LARGO':
      return { ...base, valorTexto: input.valorTexto?.trim() || null }
    case 'NUMERO':
      return { ...base, valorNumero: input.valorNumero ?? null }
    case 'CHECKBOX': {
      // CHECKBOX = Cumple / No cumple / N.A. (formularios-dinamicos.md §4/§6), NO booleano.
      const val = input.valorCheckbox?.trim() || null
      if (val !== null && !CHECKBOX_VALIDOS.includes(val)) {
        throw new BusinessError('VALOR_INVALIDO', 'El valor del checkbox debe ser CUMPLE, NO_CUMPLE o N_A.', 422)
      }
      return { ...base, valorCheckbox: val }
    }
    case 'SELECCION_MULTIPLE': {
      const sel = input.valorSeleccionMultiple ?? []
      const invalida = sel.find((v) => !opciones.includes(v))
      if (invalida !== undefined) {
        throw new BusinessError('OPCION_INVALIDA', `La opción "${invalida}" no pertenece a la pregunta.`, 422)
      }
      return { ...base, valorSeleccionMultiple: sel }
    }
  }
}
