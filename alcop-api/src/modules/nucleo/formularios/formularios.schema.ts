import { z } from 'zod'
import { paginationQuerySchema } from '../../../shared/pagination.js'

export const tipoRespuestaSchema = z.enum([
  'CHECKBOX',
  'SELECCION_MULTIPLE',
  'NUMERO',
  'TEXTO',
  'TEXTO_LARGO',
])

/** Query del maestro: paginación + búsqueda + filtros por área/categoría. */
export const listarFormulariosQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  areaId: z.coerce.number().int().positive().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
})

/** Query del picker de opciones (solo búsqueda). */
export const opcionesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
})

export const formularioIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// Una pregunta de la plantilla. SELECCION_MULTIPLE exige ≥2 opciones
// (formularios-dinamicos.md §7).
export const preguntaSchema = z
  .object({
    texto: z.string().trim().min(1, 'El texto de la pregunta es obligatorio'),
    tipoRespuesta: tipoRespuestaSchema,
    obligatoria: z.boolean().optional().default(true),
    permiteFoto: z.boolean().optional().default(false),
    opciones: z.array(z.string().trim().min(1)).optional().default([]),
  })
  .refine((p) => p.tipoRespuesta !== 'SELECCION_MULTIPLE' || p.opciones.length >= 2, {
    message: 'Una pregunta de selección múltiple requiere al menos 2 opciones.',
    path: ['opciones'],
  })

// `activo` y `requiereObra` NO se aceptan en el alta: la plantilla nace activa
// (§5.1) y, en Etapa 1, toda respuesta va ligada a una obra → requiereObra=true
// siempre (§6, QA-FD-006/007). El service los fija.
export const crearFormularioSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  areaId: z.coerce.number().int().positive(),
  categoriaId: z.coerce.number().int().positive(),
  preguntas: z.array(preguntaSchema).min(1, 'Agrega al menos una pregunta'),
})

// El área NO se cambia en la edición (igual que Categorías). `requiereObra`
// tampoco es editable (siempre true en Etapa 1). `preguntas`, si viene, reemplaza
// por completo el set (sincronización) — solo si el formulario aún no tiene
// respuestas (se valida en el service).
export const actualizarFormularioSchema = z
  .object({
    codigo: z.string().trim().min(1).optional(),
    nombre: z.string().trim().min(1).optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
    activo: z.boolean().optional(),
    preguntas: z.array(preguntaSchema).min(1, 'Agrega al menos una pregunta').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })

export type PreguntaInput = z.infer<typeof preguntaSchema>
export type CrearFormularioInput = z.infer<typeof crearFormularioSchema>
export type ActualizarFormularioInput = z.infer<typeof actualizarFormularioSchema>
