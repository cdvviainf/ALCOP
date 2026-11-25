import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'

import { ChipArea, Tarjeta, TituloSeccion } from '@/components/ui'
import { authClient } from '@/lib/auth-client'
import { fechaCorta, relativo, useDashboard, type AgendaItem, type AreaResumen } from '@/lib/dashboard'
import { useMe } from '@/lib/me'
import { colors, radius } from '@/lib/theme'

// Inicio (Docs/app-movil.md §5.2): resumen de visitas según el perfil + Mi agenda.

const COLOR: Record<string, string> = {
  // Técnica — tipo de hallazgo
  'TECNICA:NO_CONFORMIDAD': '#d9412f',
  'TECNICA:MEJORA': '#f08a24',
  'TECNICA:SUGERENCIA': '#f2c230',
  // Prevención — nivel de riesgo
  'PREVENCION:ALTO': '#d9412f',
  'PREVENCION:MEDIO': '#e29a1c',
  'PREVENCION:OBSERVACION': '#3a78c9',
  'PREVENCION:NO_CONFORMIDAD': '#3d3a36',
}

function KpiVisitas({ titulo, area, data }: { titulo: string; area: 'TECNICA' | 'PREVENCION'; data: AreaResumen }) {
  return (
    <Tarjeta>
      <Text style={styles.kpiTitulo}>{titulo}</Text>
      <View style={styles.divisor} />
      <View style={styles.kpiCuerpo}>
        <View style={styles.kpiNumeroCaja}>
          <Text style={styles.kpiNumero}>{data.visitas}</Text>
        </View>
        <View style={styles.kpiFilas}>
          {data.hallazgos.map((c) => {
            const color = COLOR[`${area}:${c.codigo}`] ?? colors.label
            return (
              <View key={c.codigo} style={[styles.fila, { backgroundColor: `${color}1f` }]}>
                <Text style={styles.filaNumero}>{c.n}</Text>
                <View style={[styles.punto, { backgroundColor: color }]} />
                <Text style={styles.filaNombre} numberOfLines={1}>
                  {c.nombre}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    </Tarjeta>
  )
}

function FilaAgenda({ a, hoy }: { a: AgendaItem; hoy: string }) {
  const rel = relativo(a.vence < hoy ? a.vence : a.fecha, hoy)
  return (
    <View style={styles.agendaFila}>
      <View style={styles.agendaArriba}>
        <Text style={styles.agendaFecha}>{fechaCorta(a.fecha)}</Text>
        <View
          style={[
            styles.rel,
            rel.tono === 'hoy' && { backgroundColor: colors.primary },
            rel.tono === 'mal' && { backgroundColor: colors.dangerBg },
          ]}
        >
          <Text style={[styles.relTexto, rel.tono === 'hoy' && { color: '#fff' }, rel.tono === 'mal' && { color: colors.danger }]}>
            {rel.texto}
          </Text>
        </View>
        {a.enBorrador ? <Text style={styles.borrador}>En borrador</Text> : null}
      </View>
      <Text style={styles.agendaForm} numberOfLines={2}>
        {a.formulario.nombre}
      </Text>
      <View style={styles.agendaMeta}>
        <ChipArea area={a.area} />
        <Text style={styles.agendaObra} numberOfLines={1}>
          {a.obra.nombre} · {a.formulario.codigo}
        </Text>
      </View>
    </View>
  )
}

export default function Inicio() {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: d, isLoading, isError, refetch, isRefetching } = useDashboard()

  const salir = async () => {
    await authClient.signOut()
    queryClient.clear()
  }

  return (
    <SafeAreaView style={styles.fondo} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      >
        <View style={styles.encabezado}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hola}>Hola{me ? `, ${me.nombre.split(' ')[0]}` : ''}</Text>
            <Text style={styles.sub}>{d ? `${fechaCorta(d.hoy)} · ${d.obras.total} ${d.obras.total === 1 ? 'obra' : 'obras'}` : ' '}</Text>
          </View>
          <Pressable onPress={salir} style={({ pressed }) => [styles.salir, pressed && { opacity: 0.6 }]}>
            <Text style={styles.salirTexto}>Salir</Text>
          </Pressable>
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {isError ? (
          <Tarjeta>
            <Text style={styles.sub}>No se pudo cargar el resumen.</Text>
            <Pressable onPress={() => refetch()}>
              <Text style={[styles.salirTexto, { marginTop: 8 }]}>Reintentar</Text>
            </Pressable>
          </Tarjeta>
        ) : null}

        {d ? (
          <>
            {d.tecnica ? <KpiVisitas titulo="Visitas Técnicas" area="TECNICA" data={d.tecnica} /> : null}
            {d.prevencion ? <KpiVisitas titulo="Visitas de Prevención" area="PREVENCION" data={d.prevencion} /> : null}

            {d.permisos.agenda.length ? (
              <>
                <TituloSeccion>Mi agenda</TituloSeccion>
                <Tarjeta style={{ padding: 0, overflow: 'hidden' }}>
                  <Text style={[styles.grupo, styles.grupoMal]}>Atrasadas · {d.agenda.atrasadas.length}</Text>
                  {d.agenda.atrasadas.length ? (
                    d.agenda.atrasadas.map((a) => <FilaAgenda key={a.id} a={a} hoy={d.hoy} />)
                  ) : (
                    <Text style={styles.vacio}>No tienes inspecciones atrasadas.</Text>
                  )}
                  <Text style={styles.grupo}>
                    Próximos {d.agenda.dias} días · {d.agenda.proximas.length}
                  </Text>
                  {d.agenda.proximas.length ? (
                    d.agenda.proximas.map((a) => <FilaAgenda key={a.id} a={a} hoy={d.hoy} />)
                  ) : (
                    <Text style={styles.vacio}>No tienes inspecciones programadas.</Text>
                  )}
                </Tarjeta>
              </>
            ) : null}

            {d.obras.total === 0 ? (
              <Tarjeta>
                <Text style={styles.sub}>Aún no tienes obras asignadas. Pide acceso a un administrador.</Text>
              </Tarjeta>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.content },
  contenido: { padding: 16, gap: 12, paddingBottom: 40 },
  encabezado: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  hola: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  salir: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  salirTexto: { fontSize: 14, fontWeight: '600', color: colors.ink },
  kpiTitulo: { fontSize: 18, fontWeight: '700', color: colors.ink },
  divisor: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  kpiCuerpo: { flexDirection: 'row', gap: 12 },
  kpiNumeroCaja: { width: 80, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  kpiNumero: { fontSize: 48, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  kpiFilas: { flex: 1, gap: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, borderRadius: radius.md, paddingHorizontal: 10 },
  filaNumero: { minWidth: 22, fontSize: 16, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  punto: { width: 9, height: 9, borderRadius: 5 },
  filaNombre: { flex: 1, fontSize: 14, color: colors.ink },
  grupo: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted, backgroundColor: colors.content, borderBottomWidth: 1, borderBottomColor: colors.border },
  grupoMal: { color: colors.danger, backgroundColor: colors.dangerBg },
  vacio: { padding: 16, fontSize: 14, color: colors.muted },
  agendaFila: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 },
  agendaArriba: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agendaFecha: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rel: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: colors.content },
  relTexto: { fontSize: 11, fontWeight: '700', color: colors.muted },
  borrador: { fontSize: 11, fontWeight: '700', color: colors.warnFg },
  agendaForm: { fontSize: 15, fontWeight: '600', color: colors.ink },
  agendaMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agendaObra: { flex: 1, fontSize: 12, color: colors.muted },
})
