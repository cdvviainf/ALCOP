import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Aviso, Boton, Campo, Selector, ui } from '@/components/ui'
import { api, mensajeDeError } from '@/lib/api'
import { esFecha, esHora, horaActual, hoyIso } from '@/lib/fechas'
import { useObras } from '@/lib/obras'
import { AREA, esArea } from '@/lib/tipos'

// Nueva visita (Técnica o Prevención): obra + fecha + hora de inicio. Al crearla se
// abre su detalle para ir agregando registros.
export default function NuevaVisita() {
  const params = useLocalSearchParams<{ area: string }>()
  const area = esArea(params.area) ? params.area : 'TECNICA'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: obrasResp, isLoading } = useObras()
  const obras = obrasResp?.data ?? []

  const [obraId, setObraId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(hoyIso())
  const [horaInicio, setHoraInicio] = useState(horaActual())
  const [error, setError] = useState<string | null>(null)

  const crear = useMutation({
    mutationFn: () =>
      api
        .post(AREA[area].visitas, { json: { obraId, fecha, horaInicio: horaInicio.trim() || null } })
        .json<{ id: number }>(),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['visitas'] })
      router.replace(`/visita/${area}/${id}`)
    },
    onError: async (err) => setError(await mensajeDeError(err, 'No se pudo crear la visita.')),
  })

  const enviar = () => {
    setError(null)
    if (!obraId) return setError('Selecciona la obra.')
    if (!esFecha(fecha)) return setError('La fecha debe tener el formato AAAA-MM-DD.')
    if (horaInicio.trim() && !esHora(horaInicio.trim())) return setError('La hora debe tener el formato HH:MM.')
    crear.mutate()
  }

  return (
    <KeyboardAvoidingView style={ui.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Nueva visita ${AREA[area].nombre}` }} />
      <ScrollView contentContainerStyle={ui.contenido} keyboardShouldPersistTaps="handled">
        <Selector
          etiqueta="Obra"
          obligatoria
          items={obras.map((o) => ({ id: o.id, nombre: o.nombre, detalle: o.codigo }))}
          valor={obraId}
          onCambio={(id) => setObraId(Number(id))}
          cargando={isLoading}
          vacio="No tienes obras asignadas."
        />
        <Campo etiqueta="Fecha (AAAA-MM-DD)" obligatoria value={fecha} onChangeText={setFecha} keyboardType="numbers-and-punctuation" />
        <Campo etiqueta="Hora de inicio (HH:MM)" value={horaInicio} onChangeText={setHoraInicio} keyboardType="numbers-and-punctuation" />
        {error ? <Aviso tono="error" texto={error} /> : null}
        <Boton titulo="Crear visita" onPress={enviar} cargando={crear.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
