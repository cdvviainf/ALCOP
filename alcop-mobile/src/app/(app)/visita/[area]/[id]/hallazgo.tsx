import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Aviso, Boton, Campo, Cargando, Etiqueta, FotosLocales, Opciones, Selector, ui } from '@/components/ui'
import { api, mensajeDeError, subirMultipart } from '@/lib/api'
import { adjuntar, type ArchivoFoto } from '@/lib/fotos'
import { AREA, esArea, type AreaCodigo, type Opcion, type VisitaDetalle } from '@/lib/tipos'

// Tope de fotos por alta (igual que MAX_FOTOS_ALTA del backend).
const MAX_FOTOS = 10

/** Alta de un registro dentro de una visita. Las fotos viajan en el mismo envío. */
export default function AgregarHallazgo() {
  const params = useLocalSearchParams<{ area: string; id: string }>()
  const area: AreaCodigo = esArea(params.area) ? params.area : 'TECNICA'
  const visitaId = Number(params.id)
  const { data: visita } = useQuery({
    queryKey: ['visita', area, visitaId],
    queryFn: () => api.get(`${AREA[area].visitas}/${visitaId}`).json<VisitaDetalle<unknown>>(),
  })
  return (
    <>
      <Stack.Screen options={{ title: area === 'TECNICA' ? 'Agregar registro' : 'Agregar hallazgo' }} />
      {!visita ? (
        <Cargando />
      ) : area === 'TECNICA' ? (
        <FormTecnico visitaId={visitaId} obraId={visita.obra.id} />
      ) : (
        <FormPrevencion visitaId={visitaId} />
      )}
    </>
  )
}

/** Envío multipart común: campos + fotos (`imagen`). */
function useEnviar(area: AreaCodigo, visitaId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const m = useMutation({
    mutationFn: ({ campos, fotos }: { campos: Record<string, string>; fotos: ArchivoFoto[] }) => {
      const fd = new FormData()
      for (const [k, v] of Object.entries(campos)) fd.append(k, v)
      for (const f of fotos) adjuntar(fd, 'imagen', f)
      return subirMultipart(`${AREA[area].visitas}/${visitaId}/hallazgos`, fd)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['visita', area, visitaId] })
      void queryClient.invalidateQueries({ queryKey: ['visitas'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      router.back()
    },
    onError: async (err) => setError(await mensajeDeError(err, 'No se pudo guardar el registro.')),
  })
  return { enviar: m.mutate, enviando: m.isPending, error, setError }
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView style={ui.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ui.contenido} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Técnica ──────────────────────────────────────────────────────────────────
function FormTecnico({ visitaId, obraId }: { visitaId: number; obraId: number }) {
  const { enviar, enviando, error, setError } = useEnviar('TECNICA', visitaId)
  const { data: unidadesResp, isLoading: cargandoUnidades } = useQuery({
    queryKey: ['obra-unidades', obraId],
    queryFn: () => api.get(`nucleo/obras/${obraId}/unidades`).json<{ data: { id: number; descripcion: string }[] }>(),
  })
  const { data: tiposResp } = useQuery({
    queryKey: ['tipos-hallazgo', { all: true }],
    queryFn: () => api.get('tecnica/tipos-hallazgo', { searchParams: { limit: '100' } }).json<{ data: Opcion[] }>(),
  })

  const [unidadId, setUnidadId] = useState<number | null>(null)
  const [tipoRegistro, setTipoRegistro] = useState<'HALLAZGO' | 'NOTA_TECNICA'>('HALLAZGO')
  const [tipoHallazgoId, setTipoHallazgoId] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [fotos, setFotos] = useState<ArchivoFoto[]>([])

  const guardar = () => {
    setError(null)
    if (!unidadId) return setError('Selecciona la unidad de lote.')
    if (tipoRegistro === 'HALLAZGO' && !tipoHallazgoId) return setError('Selecciona el tipo de hallazgo.')
    if (!comentario.trim()) return setError('El comentario es obligatorio.')
    if (tipoRegistro === 'HALLAZGO' && fotos.length === 0) return setError('Un hallazgo requiere al menos una foto.')
    enviar({
      campos: {
        loteUnidadId: String(unidadId),
        tipoRegistro,
        ...(tipoRegistro === 'HALLAZGO' ? { tipoHallazgoId: String(tipoHallazgoId) } : {}),
        comentario: comentario.trim(),
      },
      fotos,
    })
  }

  return (
    <Contenedor>
      <Selector
        etiqueta="Unidad de lote"
        obligatoria
        items={(unidadesResp?.data ?? []).map((u) => ({ id: u.id, nombre: u.descripcion }))}
        valor={unidadId}
        onCambio={(id) => setUnidadId(Number(id))}
        cargando={cargandoUnidades}
        vacio="La obra no tiene unidades de lote configuradas."
      />
      <View style={{ gap: 6 }}>
        <Etiqueta obligatoria>Tipo de registro</Etiqueta>
        <Opciones
          opciones={[
            { valor: 'HALLAZGO', nombre: 'Hallazgo' },
            { valor: 'NOTA_TECNICA', nombre: 'Nota técnica' },
          ]}
          valor={tipoRegistro}
          onCambio={setTipoRegistro}
        />
      </View>
      {tipoRegistro === 'HALLAZGO' ? (
        <Selector
          etiqueta="Tipo de hallazgo"
          obligatoria
          items={(tiposResp?.data ?? []).map((t) => ({ id: t.id, nombre: t.nombre }))}
          valor={tipoHallazgoId}
          onCambio={(id) => setTipoHallazgoId(Number(id))}
        />
      ) : null}
      <Campo etiqueta="Comentario" obligatoria value={comentario} onChangeText={setComentario} multiline />
      <View style={{ gap: 6 }}>
        <Etiqueta obligatoria={tipoRegistro === 'HALLAZGO'}>Fotos</Etiqueta>
        <FotosLocales fotos={fotos} onCambio={setFotos} max={MAX_FOTOS} />
      </View>
      {error ? <Aviso tono="error" texto={error} /> : null}
      <Boton titulo="Guardar registro" onPress={guardar} cargando={enviando} />
    </Contenedor>
  )
}

// ─── Prevención ───────────────────────────────────────────────────────────────
function FormPrevencion({ visitaId }: { visitaId: number }) {
  const { enviar, enviando, error, setError } = useEnviar('PREVENCION', visitaId)
  const { data: areasResp } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('nucleo/areas').json<{ data: Opcion[] }>(),
  })
  const areaId = (areasResp?.data ?? []).find((a) => a.codigo === 'PREVENCION')?.id
  const { data: catResp, isLoading: cargandoCat } = useQuery({
    queryKey: ['categorias-opciones', areaId],
    queryFn: () =>
      api.get('nucleo/categorias-formulario/opciones', { searchParams: { areaId: String(areaId) } }).json<{ data: Opcion[] }>(),
    enabled: !!areaId,
  })
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const { data: subResp, isLoading: cargandoSub } = useQuery({
    queryKey: ['subcategorias-opciones', categoriaId],
    queryFn: () =>
      api
        .get('nucleo/subcategorias-formulario/opciones', { searchParams: { categoriaId: String(categoriaId) } })
        .json<{ data: Opcion[] }>(),
    enabled: !!categoriaId,
  })
  const { data: nivelesResp } = useQuery({
    queryKey: ['niveles-riesgo', { all: true }],
    queryFn: () => api.get('prevencion/niveles-riesgo', { searchParams: { limit: '100' } }).json<{ data: Opcion[] }>(),
  })

  const [subcategoriaId, setSubcategoriaId] = useState<number | null>(null)
  const [nivelId, setNivelId] = useState<number | null>(null)
  const [plazoValor, setPlazoValor] = useState('')
  const [plazoUnidad, setPlazoUnidad] = useState<'DIAS' | 'HORAS'>('DIAS')
  const [comentario, setComentario] = useState('')
  const [fotos, setFotos] = useState<ArchivoFoto[]>([])

  const guardar = () => {
    setError(null)
    const plazo = Number(plazoValor)
    if (!categoriaId) return setError('Selecciona la categoría.')
    if (!subcategoriaId) return setError('Selecciona la subcategoría.')
    if (!nivelId) return setError('Selecciona el nivel de riesgo.')
    if (!Number.isInteger(plazo) || plazo <= 0) return setError('El plazo debe ser un número entero mayor a 0.')
    if (!comentario.trim()) return setError('El comentario es obligatorio.')
    if (fotos.length === 0) return setError('Agrega al menos una foto.')
    enviar({
      campos: {
        categoriaId: String(categoriaId),
        subcategoriaId: String(subcategoriaId),
        nivelRiesgoId: String(nivelId),
        plazoValor: String(plazo),
        plazoUnidad,
        comentario: comentario.trim(),
      },
      fotos,
    })
  }

  return (
    <Contenedor>
      <Selector
        etiqueta="Categoría"
        obligatoria
        items={(catResp?.data ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
        valor={categoriaId}
        onCambio={(id) => {
          setCategoriaId(Number(id))
          setSubcategoriaId(null) // al cambiar la categoría se limpia la subcategoría
        }}
        cargando={cargandoCat}
      />
      <Selector
        etiqueta="Subcategoría"
        obligatoria
        items={(subResp?.data ?? []).map((s) => ({ id: s.id, nombre: s.nombre }))}
        valor={subcategoriaId}
        onCambio={(id) => setSubcategoriaId(Number(id))}
        deshabilitado={!categoriaId}
        cargando={!!categoriaId && cargandoSub}
        placeholder={categoriaId ? 'Selecciona…' : 'Primero elige la categoría'}
        vacio={categoriaId ? 'La categoría no tiene subcategorías.' : 'Primero elige la categoría'}
      />
      <Selector
        etiqueta="Nivel de riesgo"
        obligatoria
        items={(nivelesResp?.data ?? []).map((n) => ({ id: n.id, nombre: n.nombre }))}
        valor={nivelId}
        onCambio={(id) => setNivelId(Number(id))}
      />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Plazo" obligatoria value={plazoValor} onChangeText={setPlazoValor} keyboardType="number-pad" />
        </View>
        <Opciones
          opciones={[
            { valor: 'DIAS', nombre: 'Días' },
            { valor: 'HORAS', nombre: 'Horas' },
          ]}
          valor={plazoUnidad}
          onCambio={setPlazoUnidad}
        />
      </View>
      <Campo etiqueta="Comentario" obligatoria value={comentario} onChangeText={setComentario} multiline />
      <View style={{ gap: 6 }}>
        <Etiqueta obligatoria>Fotos</Etiqueta>
        <FotosLocales fotos={fotos} onCambio={setFotos} max={MAX_FOTOS} />
      </View>
      {error ? <Aviso tono="error" texto={error} /> : null}
      <Boton titulo="Guardar hallazgo" onPress={guardar} cargando={enviando} />
    </Contenedor>
  )
}
