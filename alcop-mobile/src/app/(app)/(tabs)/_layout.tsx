import { Text } from 'react-native'
import { Tabs } from 'expo-router/js-tabs'

import { puede, useMe } from '@/lib/me'
import { AREA } from '@/lib/tipos'
import { colors } from '@/lib/theme'

// Menú principal (Docs/app-movil.md §5): cada pestaña se muestra solo si el perfil
// tiene acceso a sus visitas o registros (esAdmin ve todo).
function Icono({ simbolo, color }: { simbolo: string; color: import('react-native').ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{simbolo}</Text>
}

export default function TabsLayout() {
  const { data: me } = useMe()
  const verTec = puede(me, [AREA.TECNICA.fnVisitas, AREA.TECNICA.fnRegistros])
  const verPrev = puede(me, [AREA.PREVENCION.fnVisitas, AREA.PREVENCION.fnRegistros])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.content },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Icono simbolo="⌂" color={color} /> }} />
      <Tabs.Screen
        name="tecnica"
        options={{ title: 'Técnica', href: verTec ? undefined : null, tabBarIcon: ({ color }) => <Icono simbolo="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="prevencion"
        options={{ title: 'Prevención', href: verPrev ? undefined : null, tabBarIcon: ({ color }) => <Icono simbolo="◈" color={color} /> }}
      />
    </Tabs>
  )
}
