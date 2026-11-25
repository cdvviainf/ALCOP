import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'

import { colors, radius } from '@/lib/theme'
import type { Area } from '@/lib/dashboard'

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.tarjeta, style]}>{children}</View>
}

export function ChipArea({ area }: { area: Area }) {
  const tec = area === 'TECNICA'
  return (
    <View style={[styles.chip, { backgroundColor: tec ? '#0284c71a' : '#e0441b1a' }]}>
      <Text style={[styles.chipTexto, { color: tec ? '#0369a1' : colors.primary }]}>{tec ? 'Técnica' : 'Prevención'}</Text>
    </View>
  )
}

export function TituloSeccion({ children }: { children: ReactNode }) {
  return <Text style={styles.seccion}>{children}</Text>
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipTexto: { fontSize: 11, fontWeight: '700' },
  seccion: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 8 },
})
