import { prisma } from '../../../lib/prisma.js'
import { requireAlguno, requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { crearCatalogoRoutes, type CatalogoDelegate } from '../../../shared/catalogo.factory.js'
import { slugCodigo } from '../../../shared/slug.js'
import { actualizarTipoHallazgoSchema, crearTipoHallazgoSchema } from './tipos-hallazgo.schema.js'
import type { TipoHallazgoTecnicoDTO } from './tipos-hallazgo.types.js'

/**
 * Catálogo TipoHallazgoTecnico (Técnica) — montado bajo /api/tecnica (ver server.ts).
 * Lectura: función Categorías del catálogo O el inspector técnico (lo consume como
 * selector al registrar hallazgos — QA-OLA-B-005). Escritura: TOTAL en el catálogo.
 */
export default crearCatalogoRoutes({
  ruta: 'tipos-hallazgo',
  recurso: 'Tipo de hallazgo técnico',
  tag: 'tecnica',
  modelo: prisma.tipoHallazgoTecnico as unknown as CatalogoDelegate,
  campoBusqueda: 'nombre',
  orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  schemas: { crear: crearTipoHallazgoSchema, actualizar: actualizarTipoHallazgoSchema },
  generarCodigo: (data) => slugCodigo(data.nombre),
  toDTO: (row): TipoHallazgoTecnicoDTO => ({
    id: row.id as number,
    codigo: row.codigo as string,
    nombre: row.nombre as string,
    orden: row.orden as number,
    activo: row.activo as boolean,
    creadoEn: (row.creadoEn as Date).toISOString(),
  }),
  authz: {
    leer: [requireAuth, requireAlguno(['TEC_CAT_TIPOS_HALLAZGO', 'TEC_INSPECCION'], 'LECTURA')],
    escribir: [requireAuth, requirePermiso('TEC_CAT_TIPOS_HALLAZGO', 'TOTAL')],
  },
})
