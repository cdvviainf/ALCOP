import { createAuthClient } from 'better-auth/react'

// Cliente Better Auth — placeholder de scaffold.
// Apunta al backend alcop-api (Better Auth montado bajo /api/auth).
// La lógica real de login/logout/sesión se cablea en una etapa posterior;
// por ahora solo se expone el cliente para no dejar imports rotos.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011/api'

export const authClient = createAuthClient({
  baseURL: API_URL.replace(/\/api$/, ''),
})

export const { signIn, signOut, useSession } = authClient
