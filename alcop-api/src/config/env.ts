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
  // Seed del administrador (src/scripts/seed.ts). SIN default: si no se define,
  // el seed NO crea/rotа el admin (evita credenciales por defecto en el repo).
  SEED_ADMIN_EMAIL: z.string().email().default('admin@alcop.cl'),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  // Motor de Documentos (PDF) — Playwright / Chromium del sistema (ver Dockerfile).
  PLAYWRIGHT_EXECUTABLE_PATH: z.string().optional(),
  // Almacenamiento de archivos subidos (PDFs de procedimientos). Disco local en
  // Etapa 1 (Docs/lotes-procedimientos.md §4, decisión #2); montar como volumen
  // en Docker. Storage definitivo (S3) pendiente.
  UPLOAD_DIR: z.string().default('./uploads'),
  // Tamaño máximo del PDF de un procedimiento, en MB.
  PROCEDIMIENTO_PDF_MAX_MB: z.coerce.number().int().positive().default(20),
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
