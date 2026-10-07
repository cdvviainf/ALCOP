import { prisma } from '../../../lib/prisma.js'
import { requireAuth, requirePermiso } from '../../../plugins/auth-guard.js'
import { crearCatalogoRoutes, type CatalogoDelegate } from '../../../shared/catalogo.factory.js'
import { slugCodigo } from '../../../shared/slug.js'
import {
  actualizarEtapaConstructivaSchema,
  crearEtapaConstructivaSchema,
} from './etapas-constructivas.schema.js'
import type { EtapaConstructivaDTO } from './etapas-constructivas.types.js'

/**
 * Catálogo EtapaConstructiva (Técnica) — montado bajo /api/tecnica (ver server.ts).
 * Lectura: cualquier usuario activo. Escritura: nivel TOTAL en Técnica.
 */
export default crearCatalogoRoutes({
  ruta: 'etapas-constructivas',
  recurso: 'Etapa constructiva',
  tag: 'tecnica',
  modelo: prisma.etapaConstructiva as unknown as CatalogoDelegate,
  campoBusqueda: 'nombre',
  orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  schemas: { crear: crearEtapaConstructivaSchema, actualizar: actualizarEtapaConstructivaSchema },
  generarCodigo: (data) => slugCodigo(data.nombre),
  toDTO: (row): EtapaConstructivaDTO => ({
    id: row.id as number,
    codigo: row.codigo as string,
    nombre: row.nombre as string,
    orden: row.orden as number,
    activo: row.activo as boolean,
    creadoEn: (row.creadoEn as Date).toISOString(),
  }),
  authz: {
    leer: [requireAuth, requirePermiso('TEC_CAT_ETAPAS_CONSTRUCTIVAS', 'LECTURA')],
    escribir: [requireAuth, requirePermiso('TEC_CAT_ETAPAS_CONSTRUCTIVAS', 'TOTAL')],
  },
})
