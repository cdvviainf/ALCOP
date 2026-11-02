import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'
import { diaSchema } from '../../prevencion/registros/registros.schema.js'

export { guardarRespuestasSchema } from '../../../shared/respuestas-formulario.js'

export const estadoRegistroTecnicoSchema = z.enum(['EN_PROGRESO', 'COMPLETADO'])

export const listarRegistrosQuerySchema = paginationQuerySchema.extend({
  obraId: z.coerce.number().int().positive(),
  estado: estadoRegistroTecnicoSchema.optional(),
})

export const aplicarFormularioSchema = z.object({
  obraId: z.coerce.number().int().positive(),
  formularioId: z.coerce.number().int().positive(),
})

export const registroIdParamSchema = z.object({
  id: z.coerce.number().int().positive(), // RespuestaFormulario
})

export const preguntaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  preguntaId: z.coerce.number().int().positive(),
})

export const fotoIdParamSchema = z.object({
  fotoId: z.coerce.number().int().positive(),
})

export const cerrarRegistroSchema = z.object({
  fechaRevision: diaSchema,
})

export type EstadoRegistroTecnico = z.infer<typeof estadoRegistroTecnicoSchema>
export type AplicarFormularioInput = z.infer<typeof aplicarFormularioSchema>
export type CerrarRegistroInput = z.infer<typeof cerrarRegistroSchema>
