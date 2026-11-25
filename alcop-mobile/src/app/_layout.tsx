import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { authClient } from '@/lib/auth-client'
import { colors } from '@/lib/theme'

SplashScreen.preventAutoHideAsync()

// Al volver la app al frente se refrescan las consultas activas (permisos, obras,
// agenda) — Docs/app-movil.md §6.
AppState.addEventListener('change', (estado) => focusManager.setFocused(estado === 'active'))

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })
  )
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

/**
 * Al abrir la app, Better Auth restaura la sesión guardada de forma asíncrona y
 * puede reportar "sin sesión" un instante antes. Si hay una cookie guardada se
 * espera la confirmación (máx. 5 s) para no mostrar Ingreso de pasada.
 */
function useSesionInicial() {
  const { data: session, isPending } = authClient.useSession()
  const [cookieGuardada, setCookieGuardada] = useState<boolean | null>(null)
  const [esperaVencida, setEsperaVencida] = useState(false)

  useEffect(() => {
    authClient
      .getCookie()
      .then((c) => setCookieGuardada(!!c))
      .catch(() => setCookieGuardada(false))
    const t = setTimeout(() => setEsperaVencida(true), 5000)
    return () => clearTimeout(t)
  }, [])

  const listo = !isPending && cookieGuardada !== null && (!!session || !cookieGuardada || esperaVencida)
  return { session, listo }
}

function RootNavigator() {
  const { session, listo } = useSesionInicial()
  useEffect(() => {
    if (listo) SplashScreen.hide()
  }, [listo])
  if (!listo) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.content } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="ingreso" />
      </Stack.Protected>
    </Stack>
  )
}
