import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Aviso, Boton, Campo, Cargando, FotoRemota, Insignia, Tarjeta, TituloSeccion, ui } from '@/components/ui'
import { api, mensajeDeError } from '@/lib/api'
import { fechaCl, horaActual, hoyIso } from '@/lib/fechas'
import { puede, useMe } from '@/lib/me'
import { AREA, esArea, type HallazgoPrevencion, type HallazgoTecnico, type VisitaDetalle } from '@/lib/tipos'
import { colors } from '@/lib/theme'

type Hallazgo = HallazgoTecnico | HallazgoPrevencion

/** Detalle de una visita: registros con fotos, agregar/quitar y finalizar. */
export default function VisitaDetallePantalla() {
  const params = useLocalSearchParams<{ area: string; id: string }>()
  const area = esArea(params.area) ? params.area : 'TECNICA'
  const id = Number(params.id)
  const cfg = AREA[area]
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: me } = useMe()

  const { data: v, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['visita', area, id],
    queryFn: () => api.get(`${cfg.visitas}/${id}`).json<VisitaDetalle<Hallazgo>>(),
  })

  const [resumen, setResumen] = useState('')
  const [error, setError] = useState<string | null>(null)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['visita', area, id] })
    void queryClient.invalidateQueries({ queryKey: ['visitas'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const quitar = useMutation({
    mutationFn: (hid: number) => api.delete(`${cfg.visitas}/${id}/hallazgos/${hid}`),
    onSuccess: invalidar,
    onError: async (err) => Alert.alert('Error', await mensajeDeError(err, 'No se pudo quitar el registro.')),
  })

  const finalizar = useMutation({
    mutationFn: async () => {
      // Visita de hoy sin hora de término: se registra la hora actual (si falla, igual
      // se finaliza; la hora se puede corregir desde la web).
      const ahora = horaActual()
      if (v && !v.horaTermino && v.fecha.slice(0, 10) === hoyIso() && (!v.horaInicio || v.horaInicio <= ahora)) {
        await api.patch(`${cfg.visitas}/${id}`, { json: { horaTermino: ahora } }).catch(() => undefined)
      }
      return api.post(`${cfg.visitas}/${id}/finalizar`, { json: { resumenFinal: resumen.trim() || null } }).json()
    },
    onSuccess: () => {
      invalidar()
      Alert.alert('Visita finalizada', 'La visita quedó registrada.')
    },
    onError: async (err) => setError(await mensajeDeError(err, 'No se pudo finalizar la visita.')),
  })

  if (isLoading) return <Cargando />
  if (isError || !v) return <Aviso tono="error" texto="No se pudo cargar la visita." />

  const editable = v.estado === 'EN_CURSO' && puede(me, [cfg.fnVisitas], 'TOTAL')

  const confirmarQuitar = (hid: number) =>
    Alert.alert('Quitar registro', '¿Quitar este registro y sus fotos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => quitar.mutate(hid) },
    ])

  const confirmarFinalizar = () => {
    setError(null)
    Alert.alert('Finalizar visita', 'Después de finalizar no se pueden agregar ni quitar registros.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', onPress: () => finalizar.mutate() },
    ])
  }

  return (
    <KeyboardAvoidingView style={ui.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Visita ${cfg.nombre}` }} />
      <ScrollView
        contentContainerStyle={ui.contenido}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      >
        <Tarjeta style={{ gap: 4 }}>
          <View style={styles.fila}>
            <Text style={[ui.titulo, { flex: 1 }]} numberOfLines={2}>
              {v.obra.nombre}
            </Text>
            <Insignia texto={v.estado === 'EN_CURSO' ? 'En curso' : 'Finalizada'} tono={v.estado === 'EN_CURSO' ? 'alerta' : 'ok'} />
          </View>
          <Text style={ui.sub}>
            {fechaCl(v.fecha)}
            {v.horaInicio ? ` · ${v.horaInicio}` : ''}
            {v.horaTermino ? ` – ${v.horaTermino}` : ''} · {v.usuario.nombre}
          </Text>
          {v.resumenFinal ? <Text style={[ui.texto, { marginTop: 6 }]}>{v.resumenFinal}</Text> : null}
        </Tarjeta>

        {editable ? (
          <Boton titulo="+ Agregar registro" onPress={() => router.push(`/visita/${area}/${id}/hallazgo`)} />
        ) : null}

        <TituloSeccion>Registros ({v.hallazgos.length})</TituloSeccion>
        {v.hallazgos.length === 0 ? <Aviso texto="Aún no hay registros en esta visita." /> : null}
        {v.hallazgos.map((h) => (
          <Tarjeta key={h.id} style={{ gap: 6 }}>
            {'loteUnidad' in h ? <CabeceraTecnica h={h} /> : <CabeceraPrevencion h={h} />}
            {h.comentario ? <Text style={ui.texto}>{h.comentario}</Text> : null}
            {h.fotos.length ? (
              <View style={styles.fotos}>
                {h.fotos.map((f) => (
                  <FotoRemota key={f.id} ruta={f.url} />
                ))}
              </View>
            ) : null}
            {editable ? (
              <Boton titulo="Quitar" variante="peligro" onPress={() => confirmarQuitar(h.id)} style={{ alignSelf: 'flex-start', minHeight: 36 }} />
            ) : null}
          </Tarjeta>
        ))}

        {editable ? (
          <>
            <TituloSeccion>Finalizar</TituloSeccion>
            <Campo etiqueta="Resumen final (opcional)" value={resumen} onChangeText={setResumen} multiline />
            {error ? <Aviso tono="error" texto={error} /> : null}
            <Boton titulo="Finalizar visita" variante="secundario" onPress={confirmarFinalizar} cargando={finalizar.isPending} />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function CabeceraTecnica({ h }: { h: HallazgoTecnico }) {
  return (
    <View style={styles.fila}>
      <Text style={[ui.texto, { fontWeight: '700', flex: 1 }]}>{h.loteUnidad.descripcion}</Text>
      {h.tipoRegistro === 'NOTA_TECNICA' ? (
        <Insignia texto="Nota técnica" tono="info" />
      ) : (
        <Insignia texto={h.tipoHallazgo?.nombre ?? 'Hallazgo'} tono="error" />
      )}
    </View>
  )
}

function CabeceraPrevencion({ h }: { h: HallazgoPrevencion }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.fila}>
        <Text style={[ui.texto, { fontWeight: '700', flex: 1 }]}>{h.subcategoria.nombre}</Text>
        <Insignia texto={h.nivelRiesgo.nombre} tono="error" />
      </View>
      <Text style={ui.sub}>
        {h.categoria.nombre} · Plazo {h.plazoValor} {h.plazoUnidad === 'DIAS' ? 'días' : 'horas'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
