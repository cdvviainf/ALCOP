import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../plugins/auth-guard.js'
import { categoriasController } from './categorias-formulario.controller.js'

/**
 * Rutas de CategoriaFormulario — config de núcleo. Montadas bajo /api/nucleo.
 * Lectura: cualquier usuario activo (llenan selects de categoría). Escritura:
 * requiere TOTAL en el Área de la categoría — se valida en el service, no acá,
 * porque el área depende del dato (formularios-dinamicos.md §2).
 */
export default async function categoriasFormularioRoutes(app: FastifyInstance) {
  app.get(
    '/categorias-formulario',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar categorías de formulario' } },
    categoriasController.listar
  )
  app.get(
    '/categorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de categoría' } },
    categoriasController.obtener
  )
  app.post(
    '/categorias-formulario',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Crear categoría' } },
    categoriasController.crear
  )
  app.patch(
    '/categorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Actualizar categoría' } },
    categoriasController.actualizar
  )
  app.delete(
    '/categorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Eliminar categoría (soft delete)' } },
    categoriasController.eliminar
  )
}
