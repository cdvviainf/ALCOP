import { Stack } from 'expo-router'

import { colors } from '@/lib/theme'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.content },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="visita/nueva" options={{ title: 'Nueva visita' }} />
      <Stack.Screen name="visita/[area]/[id]/index" options={{ title: 'Visita' }} />
      <Stack.Screen name="visita/[area]/[id]/hallazgo" options={{ title: 'Agregar registro' }} />
      <Stack.Screen name="registro/nuevo" options={{ title: 'Aplicar formulario' }} />
      <Stack.Screen name="registro/[area]/[id]" options={{ title: 'Registro' }} />
    </Stack>
  )
}
