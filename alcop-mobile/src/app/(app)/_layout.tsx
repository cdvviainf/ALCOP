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
        contentStyle: { backgroundColor: colors.content },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
