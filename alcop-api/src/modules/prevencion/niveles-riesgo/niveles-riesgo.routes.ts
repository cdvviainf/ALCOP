import { prisma } from '../../../lib/prisma.js'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { crearCatalogoRoutes, type CatalogoDelegate } from '../../../shared/catalogo.factory.js'
import { slugCodigo } from '../../../shared/slug.js'
import { actualizarNivelRiesgoSchema, crearNivelRiesgoSchema } from './niveles-riesgo.schema.js'
import type { NivelRiesgoDTO } from './niveles-riesgo.types.js'

/**
 * Catálogo NivelRiesgo (Prevención) — montado bajo /api/prevencion (ver server.ts).
 * Lectura: cualquier usuario activo. Escritura: nivel TOTAL en Prevención
 * (Docs/plan-mantenedores.md §0).
 */
export default crearCatalogoRoutes({
  ruta: 'niveles-riesgo',
  recurso: 'Nivel de riesgo',
  tag: 'prevencion',
  modelo: prisma.nivelRiesgo as unknown as CatalogoDelegate,
  campoBusqueda: 'nombre',
  orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  schemas: { crear: crearNivelRiesgoSchema, actualizar: actualizarNivelRiesgoSchema },
  generarCodigo: (data) => slugCodigo(data.nombre),
  toDTO: (row): NivelRiesgoDTO => ({
    id: row.id as number,
    codigo: row.codigo as string,
    nombre: row.nombre as string,
    orden: row.orden as number,
    activo: row.activo as boolean,
    creadoEn: (row.creadoEn as Date).toISOString(),
  }),
  authz: {
    leer: [requireAuth, requirePermiso('PREV_CAT_NIVEL_RIESGO', 'LECTURA')],
    escribir: [requireAuth, requirePermiso('PREV_CAT_NIVEL_RIESGO', 'TOTAL')],
  },
})
