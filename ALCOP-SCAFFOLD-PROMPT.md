# ALCOP — Prompt para Claude Code · Fase 0: Scaffold completo

## Contexto

Estás montando el proyecto **Sistema de Inspección en Terreno (ALCOP)** desde cero.
El `CLAUDE.md` con la especificación completa está en `/Users/christiandroguett/sites/ALCOP/CLAUDE.md` — léelo antes de empezar. El alcance funcional vivo está en `alcop-esquema.html` (misma carpeta).

---

## Lo que debes crear

Dos repositorios independientes dentro de `/Users/christiandroguett/sites/ALCOP/`:

```
ALCOP/
├── alcop-api/     ← Backend Fastify + TypeScript + Prisma
├── alcop-web/     ← Frontend Next.js 15 + Tailwind v4 + shadcn/ui
├── docker-compose.yml   ← ya existe
├── Makefile             ← ya existe
└── CLAUDE.md            ← ya existe
```

---

## Paso 1 — alcop-api (Backend)

### Inicializar proyecto

```bash
cd /Users/christiandroguett/sites/ALCOP
mkdir alcop-api && cd alcop-api
npm init -y
```

### Instalar dependencias

```bash
# Core
npm install fastify @fastify/cors @fastify/helmet @fastify/jwt @fastify/swagger @fastify/swagger-ui @fastify/multipart

# ORM + DB
npm install prisma @prisma/client

# Validación
npm install zod

# Auth
npm install better-auth

# Colas
npm install bullmq ioredis

# Email
npm install resend

# PDF
npm install playwright

# Excel
npm install exceljs

# Utils
npm install pino dayjs decimal.js

# Dev
npm install -D typescript tsx @types/node vitest @vitest/coverage-v8 eslint prettier
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Estructura de directorios a crear

```
alcop-api/src/
├── config/
│   └── env.ts              ← validación de variables de entorno con Zod
├── lib/
│   ├── prisma.ts           ← instancia singleton de PrismaClient
│   ├── redis.ts            ← instancia ioredis
│   └── queue.ts            ← setup BullMQ (worker base)
├── plugins/
│   ├── auth.plugin.ts      ← Better Auth integrado en Fastify
│   ├── cors.plugin.ts
│   ├── error-handler.ts    ← manejador global de errores tipados
│   └── swagger.plugin.ts   ← documentación OpenAPI
├── modules/
│   ├── auth/
│   ├── usuarios/
│   ├── nucleo/
│   │   ├── obras/                 ← Panel de obras y resumen (visibilidad por perfil)
│   │   └── formularios/           ← Motor de formularios dinámicos (checklists por sección)
│   ├── prevencion/
│   │   ├── hallazgos/             ← sin ciclo de corrección
│   │   ├── visitas/
│   │   └── analisis-ia/
│   ├── tecnica/
│   │   ├── visitas/               ← incluye hitos: nidos (6 etapas), retiro de puntales
│   │   └── analisis-ia/
│   ├── reportes/                  ← PDFs: formularios, visitas, hallazgos, informes IA
│   ├── alertas/                   ← notificación automática por obra
│   └── health/
│       └── health.routes.ts  ← GET /health para monitoreo
├── shared/
│   ├── errors.ts           ← clases BusinessError tipadas
│   ├── pagination.ts       ← helper paginación estándar
│   ├── types.ts            ← tipos globales compartidos
│   └── ai/
│       └── analisis-ia.adapter.ts  ← adaptador genérico IA (mock | gemini)
└── server.ts               ← entry point, registra plugins y rutas
```

### Archivos clave a implementar

**src/config/env.ts** — validar al arrancar, lanzar error si falta variable crítica:
```typescript
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@alcop.cl'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  AI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3010'),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
```

**src/shared/ai/analisis-ia.adapter.ts** — adaptador genérico (mismo patrón que el adaptador DTE de FAS):
```typescript
import { env } from '../../config/env.js'

export interface AnalisisIAInput {
  obra: string
  inspector: string
  ubicacion: string
  imagenes: Buffer[] // o URLs ya subidas
}

export interface AnalisisIAOutput {
  observaciones: string // texto editable por el usuario antes de guardar
}

export interface AnalisisIAProvider {
  analizar(input: AnalisisIAInput): Promise<AnalisisIAOutput>
}

class MockAnalisisIAProvider implements AnalisisIAProvider {
  async analizar(input: AnalisisIAInput): Promise<AnalisisIAOutput> {
    return { observaciones: `[MOCK] Revisión de ${input.imagenes.length} imagen(es) en ${input.obra}. Sin hallazgos detectados.` }
  }
}

// class GeminiAnalisisIAProvider implements AnalisisIAProvider { ... } // a implementar cuando ALCOP entregue la API key

export function getAnalisisIAProvider(): AnalisisIAProvider {
  if (env.AI_PROVIDER === 'gemini') {
    throw new Error('GeminiAnalisisIAProvider aún no implementado — usar AI_PROVIDER=mock')
  }
  return new MockAnalisisIAProvider()
}
```

**src/shared/errors.ts** — errores de negocio tipados:
```typescript
export class BusinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` (${id})` : ''} no encontrado`, 404)
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message = 'No autorizado') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message = 'Sin permisos para esta operación') {
    super('FORBIDDEN', message, 403)
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}
```

**src/plugins/error-handler.ts** — capturar todo en Fastify:
```typescript
import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BusinessError } from '../shared/errors.js'

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.flatten() }
      })
    }
    if (error instanceof BusinessError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details }
      })
    }
    app.log.error(error)
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }
    })
  })
}
```

**src/server.ts** — entry point:
```typescript
import Fastify from 'fastify'
import { env } from './config/env.js'
import { errorHandler } from './plugins/error-handler.js'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

await app.register(import('@fastify/cors'), { origin: env.CORS_ORIGIN })
await app.register(import('@fastify/helmet'))
await errorHandler(app)

await app.register(import('./modules/health/health.routes.js'))
// await app.register(import('./modules/auth/auth.routes.js'), { prefix: '/api/auth' })

await app.listen({ port: env.PORT, host: '0.0.0.0' })
app.log.info(`ALCOP API corriendo en http://localhost:${env.PORT}`)
```

### .env

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://alcop_user:alcop_pass@localhost:5434/alcop_db
REDIS_URL=redis://:alcop_redis_pass@localhost:6380
BETTER_AUTH_SECRET=alcop_super_secret_key_cambiar_en_produccion_32c
BETTER_AUTH_URL=http://localhost:3011
RESEND_API_KEY=re_test_placeholder
EMAIL_FROM=noreply@alcop.cl
AI_PROVIDER=mock
CORS_ORIGIN=http://localhost:3010
```

### prisma/schema.prisma

Construir el `schema.prisma` a partir de los **specs de `Docs/`** (aún por escribir — ver `CLAUDE.md` §5). Para el scaffold inicial basta con los modelos de `usuarios-perfiles.md` (Usuario, Perfil, PerfilAcceso, ItemMenu) y Obra (núcleo). El resto de los modelos (Hallazgo, VisitaPrevencion, VisitaTecnica, HitoEtapa, FormularioDinamico, Reporte) se agregan a medida que cada spec se cierra con Christian.

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

## Paso 2 — alcop-web (Frontend)

### Inicializar proyecto

```bash
cd /Users/christiandroguett/sites/ALCOP
npx create-next-app@latest alcop-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

### Instalar dependencias adicionales

```bash
cd alcop-web

npm install @tanstack/react-query @tanstack/react-query-devtools ky
npm install react-hook-form @hookform/resolvers zod
npm install better-auth

npx shadcn@latest init   # Default style, Zinc color, CSS variables: yes
npx shadcn@latest add button input label card table badge
npx shadcn@latest add dropdown-menu avatar separator
npx shadcn@latest add sidebar

npm install dayjs clsx class-variance-authority lucide-react
```

### Estructura de directorios a crear

```
alcop-web/src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← sidebar + topbar
│   │   ├── page.tsx            ← Panel de obras y resumen (visibilidad por perfil)
│   │   ├── prevencion/
│   │   │   ├── hallazgos/page.tsx
│   │   │   ├── visitas/page.tsx
│   │   │   └── analisis-ia/page.tsx
│   │   └── tecnica/
│   │       ├── visitas/page.tsx
│   │       └── analisis-ia/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── shared/
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx
│   │   └── loading-spinner.tsx
│   └── layout/
│       ├── app-sidebar.tsx
│       └── top-bar.tsx
├── lib/
│   ├── api.ts
│   ├── auth-client.ts
│   └── utils.ts
├── hooks/
│   └── use-api.ts
└── types/
    └── index.ts
```

### Archivos clave a implementar

**src/lib/api.ts**:
```typescript
import ky from 'ky'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('alcop_token')
          : null
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('alcop_token')
            window.location.href = '/login'
          }
        }
      }
    ]
  }
})
```

**src/components/layout/app-sidebar.tsx** — navegación principal:
```typescript
// Sidebar construido dinámicamente desde el menú del usuario (GET /api/usuarios/me/menu),
// filtrado por su perfil (ítems con nivel >= LECTURA). Secciones canónicas (alcop-esquema.html §05-07):
// - Panel de obras y resumen (home, visible según permisos — ver regla de visibilidad §05)
// - Prevención → Registro de hallazgos, Visitas de prevención, Análisis IA, Reportes
// - Técnica → Registro de visitas técnicas, Análisis IA, Reportes
// - Configuración → Usuarios y perfiles, Formularios dinámicos
```

### .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:3011/api
```

---

## Paso 3 — Verificar que todo levanta

```bash
# 1. Servicios Docker (desde /ALCOP)
make up

# 2. Esperar que postgres esté healthy, luego migrar
cd alcop-api
npm run db:migrate

# 3. Levantar API
npm run dev
# → debe responder en http://localhost:3011/health

# 4. Levantar frontend (otra terminal)
cd alcop-web
npm run dev
# → debe abrir en http://localhost:3010
```

---

## Criterios de éxito del scaffold

- [ ] `GET http://localhost:3011/health` responde `{ status: "ok" }`
- [ ] `GET http://localhost:3011/docs` muestra Swagger UI
- [ ] `http://localhost:3010` muestra la pantalla de login (aunque sea placeholder)
- [ ] `http://localhost:5051` muestra pgAdmin con la BD `alcop_db` visible
- [ ] `npx prisma migrate dev` corre sin errores con el schema inicial (Usuario/Perfil/Obra)
- [ ] `npm run dev` en ambos repos sin errores de TypeScript

---

## Notas para Claude Code

- Leer `CLAUDE.md` completo antes de escribir cualquier línea de código.
- `alcop-esquema.html` es la referencia de alcance funcional hasta que cada módulo tenga su spec cerrado en `Docs/`.
- No instalar NestJS, Express, ni ningún otro framework — solo Fastify 5.
- El Análisis IA por ahora usa `AI_PROVIDER=mock` — no implementar la integración real con Gemini todavía.
- Si algo no está especificado, preguntar antes de inventar.
