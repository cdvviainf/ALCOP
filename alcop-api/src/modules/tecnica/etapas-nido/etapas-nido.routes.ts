import { prisma } from '../../../lib/prisma.js'
import { requireArea, requireAuth } from '../../../plugins/auth-guard.js'
import { crearCatalogoRoutes, type CatalogoDelegate } from '../../../shared/catalogo.factory.js'
import { slugCodigo } from '../../../shared/slug.js'
import { actualizarEtapaNidoSchema, crearEtapaNidoSchema } from './etapas-nido.schema.js'
import type { EtapaNidoDTO } from './etapas-nido.types.js'

/**
 * Catálogo EtapaNido (Técnica) — montado bajo /api/tecnica (ver server.ts).
 * Las 6 etapas del hito "nido" son ordenadas (`orden` significativo).
 * Lectura: cualquier usuario activo. Escritura: nivel TOTAL en Técnica.
 */
export default crearCatalogoRoutes({
  ruta: 'etapas-nido',
  recurso: 'Etapa de nido',
  tag: 'tecnica',
  modelo: prisma.etapaNido as unknown as CatalogoDelegate,
  campoBusqueda: 'nombre',
  orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  schemas: { crear: crearEtapaNidoSchema, actualizar: actualizarEtapaNidoSchema },
  generarCodigo: (data) => slugCodigo(data.nombre),
  toDTO: (row): EtapaNidoDTO => ({
    id: row.id as number,
    codigo: row.codigo as string,
    nombre: row.nombre as string,
    orden: row.orden as number,
    activo: row.activo as boolean,
    creadoEn: (row.creadoEn as Date).toISOString(),
  }),
  authz: {
    leer: [requireAuth],
    escribir: [requireAuth, requireArea('TECNICA', 'TOTAL')],
  },
})
