import { createAuthClient } from 'better-auth/react'

// Las rutas de auth se proxean a través de Next.js (src/app/api/auth/[...all]/route.ts)
// para que las cookies se setteen en el dominio del frontend y no en el del API
// (api y web viven en subdominios distintos en el demo de Coolify).
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

export type Session = typeof authClient.$Infer.Session
