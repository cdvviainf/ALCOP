import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../plugins/auth-guard.js'
import { subcategoriasController } from './subcategorias-formulario.controller.js'

/**
 * Rutas de SubcategoriaFormulario — config de núcleo. Montadas bajo /api/nucleo.
 * Lectura: cualquier usuario activo (llenan selects). Escritura: requiere TOTAL
 * en la función Categorías del Área de la categoría padre — se valida en el
 * service, no acá, porque el área depende del dato.
 */
export default async function subcategoriasFormularioRoutes(app: FastifyInstance) {
  app.get(
    '/subcategorias-formulario',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Listar subcategorías' } },
    subcategoriasController.listar
  )
  app.get(
    '/subcategorias-formulario/opciones',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Opciones de subcategoría por categoría (picker)' } },
    subcategoriasController.listarOpciones
  )
  app.get(
    '/subcategorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Detalle de subcategoría' } },
    subcategoriasController.obtener
  )
  app.post(
    '/subcategorias-formulario',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Crear subcategoría' } },
    subcategoriasController.crear
  )
  app.patch(
    '/subcategorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Actualizar subcategoría' } },
    subcategoriasController.actualizar
  )
  app.delete(
    '/subcategorias-formulario/:id',
    { preHandler: [requireAuth], schema: { tags: ['nucleo'], summary: 'Eliminar subcategoría (soft delete)' } },
    subcategoriasController.eliminar
  )
}
