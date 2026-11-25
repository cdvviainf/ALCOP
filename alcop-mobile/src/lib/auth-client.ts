import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

import { AUTH_URL } from './config'

// Sesión Better Auth (mismo backend que la web). La cookie de sesión se guarda en
// el almacenamiento seguro del dispositivo (Keychain / Keystore).
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  plugins: [
    expoClient({
      scheme: 'alcop',
      storagePrefix: 'alcop',
      storage: SecureStore,
    }),
  ],
})
