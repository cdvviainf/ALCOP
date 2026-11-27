import { useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Aviso,
  BotonesFoto,
  Boton,
  Campo,
  Cargando,
  Etiqueta,
  FotoRemota,
  Opciones,
  Selector,
  Tarjeta,
  TituloSeccion,
  ui,
} from '@/components/ui'
import { api, mensajeDeError, subirMultipart } from '@/lib/api'
import { esFecha, fechaCl, hoyIso } from '@/lib/fechas'
import { adjuntar, elegirFotos } from '@/lib/fotos'
import { puede, useMe } from '@/lib/me'
import { AREA, esArea, type FotoVisita, type Pregunta, type RegistroDetalle } from '@/lib/tipos'
import { colors } from '@/lib/theme'

interface Valor {
  texto: string
  numero: string
  checkbox: string
  seleccion: string[]
  unidadId: number | null
}
const VACIO: Valor = { texto: '', numero: '', checkbox: '', seleccion: [], unidadId: null }

const CHECK = [
  { valor: 'CUMPLE', nombre: 'Cumple' },
  { valor: 'NO_CUMPLE', nombre: 'No cumple' },
  { valor: 'N_A', nombre: 'N.A.' },
] as const

/** Quita las marcas de revisión del import (**negrita**, *Rev*) para mostrar el texto. */
function textoPregunta(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s*\*Rev\*/g, '')
}

function semilla(reg: RegistroDetalle): Map<number, Valor> {
  const porId = new Map(reg.respuestas.map((r) => [r.preguntaId, r]))
  const m = new Map<number, Valor>()
  for (const p of reg.preguntas) {
    const r = porId.get(p.id)
    m.set(p.id, {
      texto: r?.valorTexto ?? '',
      numero: r?.valorNumero != null ? String(r.valorNumero) : '',
      checkbox: r?.valorCheckbox ?? '',
      seleccion: r?.valorSeleccionMultiple ?? [],
      unidadId: r?.valorLoteUnidadId ?? null,
    })
  }
  return m
}

/** Llenado de un formulario (Registro Técnica o Prevención): guardar, fotos y cerrar. */
export default function RegistroPantalla() {
  const params = useLocalSearchParams<{ area: string; id: string }>()
  const area = esArea(params.area) ? params.area : 'TECNICA'
  const id = Number(params.id)
  const cfg = AREA[area]
  const queryClient = useQueryClient()
  const { data: me } = useMe()

  const { data: reg, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['registro', area, id],
    queryFn: () => api.get(`${cfg.registros}/${id}`).json<RegistroDetalle>(),
  })

  const [valores, setValores] = useState<Map<number, Valor>>(new Map())
  const sembrado = useRef<number | null>(null)
  useEffect(() => {
    // Se siembra una sola vez: recargar (p. ej. tras subir una foto) no pisa lo tipeado.
    if (reg && sembrado.current !== reg.id) {
      setValores(semilla(reg))
      sembrado.current = reg.id
    }
  }, [reg])

  const [fechaRevision, setFechaRevision] = useState(hoyIso())
  const [error, setError] = useState<string | null>(null)

  const editable = !!reg && !reg.cerrado && puede(me, [cfg.fnRegistros], 'TOTAL')

  const setValor = (pid: number, patch: Partial<Valor>) =>
    setValores((prev) => {
      const next = new Map(prev)
      next.set(pid, { ...(next.get(pid) ?? VACIO), ...patch })
      return next
    })

  const invalidarListas = () => {
    void queryClient.invalidateQueries({ queryKey: ['registros'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const payload = () =>
    (reg?.preguntas ?? []).map((p) => {
      const v = valores.get(p.id) ?? VACIO
      const num = v.numero.trim().replace(',', '.')
      return {
        preguntaId: p.id,
        valorTexto: v.texto.trim() || null,
        valorNumero: num && !Number.isNaN(Number(num)) ? Number(num) : null,
        valorCheckbox: v.checkbox || null,
        valorSeleccionMultiple: v.seleccion,
        valorLoteUnidadId: v.unidadId,
      }
    })

  const guardar = useMutation({
    mutationFn: () => api.put(`${cfg.registros}/${id}/respuestas`, { json: { respuestas: payload() } }).json<RegistroDetalle>(),
    onSuccess: (data) => {
      queryClient.setQueryData(['registro', area, id], data)
      invalidarListas()
    },
  })

  const cerrar = useMutation({
    mutationFn: async () => {
      // Guarda antes de cerrar para que la validación vea lo que está en pantalla.
      await guardar.mutateAsync()
      return api.post(`${cfg.registros}/${id}/cerrar`, { json: { fechaRevision } }).json<RegistroDetalle>()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['registro', area, id], data)
      invalidarListas()
      Alert.alert('Registro cerrado', 'El formulario quedó completado.')
    },
    onError: async (err) => setError(await mensajeDeError(err, 'No se pudo cerrar el registro.')),
  })

  const onGuardar = () => {
    setError(null)
    guardar.mutate(undefined, {
      onSuccess: () => Alert.alert('Guardado', 'Las respuestas quedaron guardadas como borrador.'),
      onError: async (err) => setError(await mensajeDeError(err, 'No se pudieron guardar las respuestas.')),
    })
  }

  const onCerrar = () => {
    setError(null)
    if (!esFecha(fechaRevision)) return setError('La fecha de revisión debe tener el formato AAAA-MM-DD.')
    if (fechaRevision > hoyIso()) return setError('La fecha de revisión no puede ser futura.')
    Alert.alert('Cerrar registro', 'Después de cerrar no se pueden modificar las respuestas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar registro', onPress: () => cerrar.mutate() },
    ])
  }

  if (isLoading) return <Cargando />
  if (isError || !reg) return <Aviso tono="error" texto="No se pudo cargar el registro." />

  const fotosDe = (pid: number) => reg.respuestas.find((r) => r.preguntaId === pid)?.fotos ?? []
  const respuestaDe = (pid: number) => reg.respuestas.find((r) => r.preguntaId === pid)

  return (
    <KeyboardAvoidingView style={ui.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Registro ${cfg.nombre}` }} />
      <ScrollView
        contentContainerStyle={ui.contenido}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      >
        <Tarjeta style={{ gap: 4 }}>
          <Text style={ui.titulo}>{reg.formulario.nombre}</Text>
          <Text style={ui.sub}>
            {reg.obra.nombre} · {reg.formulario.codigo} · {fechaCl(reg.fecha)}
          </Text>
        </Tarjeta>

        {reg.cerrado ? (
          <Aviso tono="ok" texto={`Registro completado${reg.fechaRevision ? ` · revisión ${fechaCl(reg.fechaRevision)}` : ''}. Solo lectura.`} />
        ) : !editable ? (
          <Aviso texto="Solo lectura: no tienes permiso para editar registros." />
        ) : null}

        {reg.preguntas.length === 0 ? <Aviso tono="alerta" texto="Este formulario no tiene preguntas configuradas." /> : null}

        {reg.preguntas.map((p, i) => (
          <PreguntaCard
            key={p.id}
            n={i + 1}
            p={p}
            v={valores.get(p.id) ?? VACIO}
            unidades={reg.unidades}
            unidadElegida={respuestaDe(p.id)?.valorLoteUnidad ?? null}
            fotos={fotosDe(p.id)}
            editable={editable}
            apiBase={cfg.registros}
            registroId={id}
            onCambio={(patch) => setValor(p.id, patch)}
            onFotos={() => void refetch()}
          />
        ))}

        {editable && reg.preguntas.length ? (
          <>
            <Boton titulo="Guardar borrador" variante="secundario" onPress={onGuardar} cargando={guardar.isPending && !cerrar.isPending} />
            <TituloSeccion>Cerrar registro</TituloSeccion>
            <Campo
              etiqueta="Fecha de revisión (AAAA-MM-DD)"
              obligatoria
              value={fechaRevision}
              onChangeText={setFechaRevision}
              keyboardType="numbers-and-punctuation"
            />
            {error ? <Aviso tono="error" texto={error} /> : null}
            <Boton titulo="Cerrar registro" onPress={onCerrar} cargando={cerrar.isPending} />
          </>
        ) : error ? (
          <Aviso tono="error" texto={error} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function PreguntaCard({
  n,
  p,
  v,
  unidades,
  unidadElegida,
  fotos,
  editable,
  apiBase,
  registroId,
  onCambio,
  onFotos,
}: {
  n: number
  p: Pregunta
  v: Valor
  unidades: { id: number; descripcion: string }[]
  unidadElegida: { id: number; descripcion: string } | null
  fotos: FotoVisita[]
  editable: boolean
  apiBase: string
  registroId: number
  onCambio: (patch: Partial<Valor>) => void
  onFotos: () => void
}) {
  const subir = useMutation({
    mutationFn: async (origen: 'camara' | 'galeria') => {
      const elegidas = await elegirFotos(origen)
      for (const f of elegidas) {
        const fd = new FormData()
        adjuntar(fd, 'imagen', f)
        await subirMultipart(`${apiBase}/${registroId}/preguntas/${p.id}/fotos`, fd)
      }
      return elegidas.length
    },
    onSuccess: (n) => {
      if (n) onFotos()
    },
    onError: async (err) => {
      onFotos()
      Alert.alert('Foto', await mensajeDeError(err, 'No se pudo subir la foto.'))
    },
  })
  const quitarFoto = useMutation({
    mutationFn: (fotoId: number) => api.delete(`${apiBase}/fotos/${fotoId}`),
    onSuccess: onFotos,
    onError: async (err) => Alert.alert('Foto', await mensajeDeError(err, 'No se pudo quitar la foto.')),
  })

  // Unidades de la obra + la ya elegida si dejó de estar vigente.
  const opcionesUnidad =
    unidadElegida && !unidades.some((u) => u.id === unidadElegida.id) ? [unidadElegida, ...unidades] : unidades

  return (
    <Tarjeta style={{ gap: 10 }}>
      <Etiqueta obligatoria={p.obligatoria}>
        <Text style={styles.pregunta}>
          {n}. {textoPregunta(p.texto)}
        </Text>
      </Etiqueta>

      {p.tipoRespuesta === 'CHECKBOX' ? (
        <Opciones
          opciones={CHECK.map((c) => ({ valor: c.valor as string, nombre: c.nombre }))}
          valor={v.checkbox || null}
          onCambio={(val) => onCambio({ checkbox: v.checkbox === val ? '' : val })}
          deshabilitado={!editable}
        />
      ) : p.tipoRespuesta === 'SELECCION_MULTIPLE' ? (
        <View style={styles.multi}>
          {p.opciones.map((op) => {
            const sel = v.seleccion.includes(op)
            return (
              <Opciones
                key={op}
                opciones={[{ valor: op, nombre: `${sel ? '☑' : '☐'}  ${op}` }]}
                valor={sel ? op : null}
                onCambio={() => onCambio({ seleccion: sel ? v.seleccion.filter((x) => x !== op) : [...v.seleccion, op] })}
                deshabilitado={!editable}
              />
            )
          })}
        </View>
      ) : p.tipoRespuesta === 'NUMERO' ? (
        <Campo value={v.numero} onChangeText={(t) => onCambio({ numero: t })} keyboardType="decimal-pad" editable={editable} />
      ) : p.tipoRespuesta === 'LOTE_UNIDAD' ? (
        <View style={{ gap: 4 }}>
          <Selector
            etiqueta={undefined}
            items={opcionesUnidad.map((u) => ({ id: u.id, nombre: u.descripcion }))}
            valor={v.unidadId}
            onCambio={(uid) => onCambio({ unidadId: Number(uid) })}
            deshabilitado={!editable}
            placeholder="Selecciona la unidad…"
            vacio="La obra no tiene unidades de lote configuradas."
          />
          {!v.unidadId && v.texto ? <Text style={ui.sub}>Registrado como texto: «{v.texto}»</Text> : null}
        </View>
      ) : (
        <Campo
          value={v.texto}
          onChangeText={(t) => onCambio({ texto: t })}
          multiline={p.tipoRespuesta === 'TEXTO_LARGO'}
          editable={editable}
        />
      )}

      {p.permiteFoto ? (
        <View style={{ gap: 8 }}>
          <Etiqueta obligatoria={p.fotoObligatoria}>Fotos</Etiqueta>
          {fotos.length ? (
            <View style={styles.fotos}>
              {fotos.map((f) => (
                <FotoRemota
                  key={f.id}
                  ruta={f.url}
                  onQuitar={
                    editable
                      ? () =>
                          Alert.alert('Quitar foto', '¿Quitar esta foto?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Quitar', style: 'destructive', onPress: () => quitarFoto.mutate(f.id) },
                          ])
                      : undefined
                  }
                />
              ))}
            </View>
          ) : !editable ? (
            <Text style={ui.sub}>Sin fotos.</Text>
          ) : null}
          {editable ? <BotonesFoto onElegir={(o) => subir.mutate(o)} cargando={subir.isPending} /> : null}
        </View>
      ) : null}
    </Tarjeta>
  )
}

const styles = StyleSheet.create({
  pregunta: { fontSize: 15, fontWeight: '600', color: colors.ink },
  multi: { gap: 6 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
