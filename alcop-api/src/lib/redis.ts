import { Redis } from 'ioredis'
import { env } from '../config/env.js'

/**
 * Instancia singleton de ioredis, compartida por la caché y por BullMQ.
 * `maxRetriesPerRequest: null` es requerido por BullMQ para las conexiones
 * de worker/queue.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis }

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  })

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
