import { Queue, Worker, type Processor, type QueueOptions, type WorkerOptions } from 'bullmq'
import { redis } from './redis.js'

/**
 * Setup base de BullMQ. Comparte la conexión ioredis singleton.
 *
 * Las colas/worker reales (p.ej. envío de correos de `alertas`, generación de
 * PDF en `reportes`, análisis IA) se registran en sus módulos usando estos
 * factories — aquí solo vive la infraestructura compartida, sin side effects
 * al importar.
 */

const connection = redis

export function createQueue<T = unknown>(name: string, opts?: Omit<QueueOptions, 'connection'>): Queue<T> {
  return new Queue<T>(name, { connection, ...opts })
}

export function createWorker<T = unknown>(
  name: string,
  processor: Processor<T>,
  opts?: Omit<WorkerOptions, 'connection'>
): Worker<T> {
  return new Worker<T>(name, processor, { connection, ...opts })
}
