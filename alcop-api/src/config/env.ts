import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_BASE_URL: z.string().url().default('http://localhost:3011'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@alcop.cl'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  AI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3010'),
  // Motor de Documentos (PDF) — Playwright / Chromium del sistema (ver Dockerfile).
  PLAYWRIGHT_EXECUTABLE_PATH: z.string().optional(),
})

// Validación al arrancar (CLAUDE.md §12.9): si falta una variable crítica,
// el proceso no inicia. `parse` lanza ZodError y aborta el boot.
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // No usamos el logger aquí: aún no existe. Falla ruidosa y temprana.
  console.error('❌ Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = z.infer<typeof envSchema>
