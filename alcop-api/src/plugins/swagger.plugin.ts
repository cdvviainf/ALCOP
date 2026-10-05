import { FastifyInstance } from 'fastify'

/**
 * Documentación OpenAPI (Swagger).
 *   - Spec JSON en GET /docs/json
 *   - UI en GET /docs
 */
export async function registerSwagger(app: FastifyInstance) {
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'ALCOP API',
        description:
          'Sistema de Inspección en Terreno (ALCOP) — API REST. Prefijo de módulos: /api/<módulo>.',
        version: '0.1.0',
      },
      servers: [{ url: '/', description: 'Servidor actual' }],
      tags: [
        { name: 'health', description: 'Estado del servicio' },
        { name: 'auth', description: 'Autenticación (Better Auth)' },
        { name: 'usuarios', description: 'Usuarios y perfiles' },
        { name: 'nucleo', description: 'Obras y formularios dinámicos' },
        { name: 'prevencion', description: 'Prevención de riesgos' },
        { name: 'tecnica', description: 'Control de calidad técnico' },
        { name: 'reportes', description: 'Generación de PDF/Excel' },
        { name: 'alertas', description: 'Notificaciones por obra' },
      ],
    },
  })

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
}
