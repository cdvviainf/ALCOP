import { useState } from 'react'
import { Alert, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Aviso, Boton, Selector, ui } from '@/components/ui'
import { api, mensajeDeError } from '@/lib/api'
import { useObras } from '@/lib/obras'
import type { Opcion } from '@/lib/tipos'

/** Aplicar un formulario técnico a una obra (si ya hay uno en progreso, se retoma). */
export default function AplicarFormulario() {
  const params = useLocalSearchParams<{ obraId?: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: obrasResp, isLoading: cargandoObras } = useObras()
  const { data: formsResp, isLoading: cargandoForms } = useQuery({
    queryKey: ['registros-tecnica-formularios'],
    queryFn: () => api.get('tecnica/registros/formularios-opciones').json<{ data: Opcion[] }>(),
  })

  const [obraId, setObraId] = useState<number | null>(params.obraId ? Number(params.obraId) : null)
  const [formularioId, setFormularioId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const aplicar = useMutation({
    mutationFn: () =>
      api.post('tecnica/registros', { json: { obraId, formularioId } }).json<{ id: number; reanudado: boolean }>(),
    onSuccess: ({ id, reanudado }) => {
      void queryClient.invalidateQueries({ queryKey: ['registros'] })
      if (reanudado) Alert.alert('Formulario en progreso', 'Este formulario ya estaba en progreso en la obra; se retoma ese registro.')
      router.replace(`/registro/TECNICA/${id}`)
    },
    onError: async (err) => setError(await mensajeDeError(err, 'No se pudo aplicar el formulario.')),
  })

  const enviar = () => {
    setError(null)
    if (!obraId) return setError('Selecciona la obra.')
    if (!formularioId) return setError('Selecciona el formulario.')
    aplicar.mutate()
  }

  return (
    <ScrollView style={ui.pantalla} contentContainerStyle={ui.contenido}>
      <Selector
        etiqueta="Obra"
        obligatoria
        items={(obrasResp?.data ?? []).map((o) => ({ id: o.id, nombre: o.nombre, detalle: o.codigo }))}
        valor={obraId}
        onCambio={(id) => setObraId(Number(id))}
        cargando={cargandoObras}
        vacio="No tienes obras asignadas."
      />
      <Selector
        etiqueta="Formulario"
        obligatoria
        items={(formsResp?.data ?? []).map((f) => ({ id: f.id, nombre: f.nombre, detalle: f.codigo }))}
        valor={formularioId}
        onCambio={(id) => setFormularioId(Number(id))}
        cargando={cargandoForms}
        vacio="No hay formularios técnicos disponibles."
      />
      {error ? <Aviso tono="error" texto={error} /> : null}
      <Boton titulo="Comenzar" onPress={enviar} cargando={aplicar.isPending} />
    </ScrollView>
  )
}
