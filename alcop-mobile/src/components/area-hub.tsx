import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

import { Aviso, Boton, Cargando, Insignia, Opciones, Selector, Tarjeta, ui } from '@/components/ui'
import { api } from '@/lib/api'
import { fechaCl } from '@/lib/fechas'
import { puede, useMe } from '@/lib/me'
import { useObras } from '@/lib/obras'
import { AREA, type AreaCodigo, type Paginado, type RegistroLista, type VisitaLista } from '@/lib/tipos'
import { colors, radius } from '@/lib/theme'

type Seccion = 'visitas' | 'registros'

/** Pestaña de un área: sus visitas y sus registros (formularios), según permisos. */
export function AreaHub({ area }: { area: AreaCodigo }) {
  const cfg = AREA[area]
  const { data: me } = useMe()
  const verVisitas = puede(me, [cfg.fnVisitas])
  const verRegistros = puede(me, [cfg.fnRegistros])
  const [seccion, setSeccion] = useState<Seccion>('visitas')

  // Si el perfil no ve visitas, parte en registros.
  useEffect(() => {
    if (me && !verVisitas && verRegistros) setSeccion('registros')
  }, [me, verVisitas, verRegistros])

  const opciones = [
    ...(verVisitas ? [{ valor: 'visitas' as const, nombre: 'Visitas' }] : []),
    ...(verRegistros ? [{ valor: 'registros' as const, nombre: 'Registros' }] : []),
  ]

  return (
    <SafeAreaView style={ui.pantalla} edges={['top']}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{cfg.nombre}</Text>
        {opciones.length > 1 ? <Opciones opciones={opciones} valor={seccion} onCambio={setSeccion} /> : null}
      </View>
      {!me ? (
        <Cargando />
      ) : seccion === 'visitas' && verVisitas ? (
        <ListaVisitas area={area} puedeCrear={puede(me, [cfg.fnVisitas], 'TOTAL')} />
      ) : verRegistros ? (
        <ListaRegistros area={area} puedeCrear={puede(me, [cfg.fnRegistros], 'TOTAL')} />
      ) : (
        <View style={{ padding: 16 }}>
          <Aviso texto="No tienes acceso a esta área." />
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Visitas ──────────────────────────────────────────────────────────────────
function ListaVisitas({ area, puedeCrear }: { area: AreaCodigo; puedeCrear: boolean }) {
  const router = useRouter()
  const [estado, setEstado] = useState<'EN_CURSO' | 'TODAS'>('EN_CURSO')
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['visitas', area, estado],
    queryFn: () =>
      api
        .get(AREA[area].visitas, {
          searchParams: { limit: '50', orden: 'fecha', dir: 'desc', ...(estado === 'EN_CURSO' ? { estado } : {}) },
        })
        .json<Paginado<VisitaLista>>(),
  })
  useFocusEffect(
    useCallback(() => {
      void refetch()
    }, [refetch])
  )

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(v) => String(v.id)}
      contentContainerStyle={ui.contenido}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {puedeCrear ? <Boton titulo="+ Nueva visita" onPress={() => router.push({ pathname: '/visita/nueva', params: { area } })} /> : null}
          <Opciones
            opciones={[
              { valor: 'EN_CURSO', nombre: 'En curso' },
              { valor: 'TODAS', nombre: 'Todas' },
            ]}
            valor={estado}
            onCambio={setEstado}
          />
          {isLoading ? <Cargando /> : null}
          {isError ? <Aviso tono="error" texto="No se pudieron cargar las visitas. Desliza hacia abajo para reintentar." /> : null}
        </View>
      }
      ListEmptyComponent={
        !isLoading && !isError ? <Aviso texto={estado === 'EN_CURSO' ? 'No hay visitas en curso.' : 'No hay visitas.'} /> : undefined
      }
      renderItem={({ item: v }) => (
        <Pressable onPress={() => router.push(`/visita/${area}/${v.id}`)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Tarjeta style={styles.fila}>
            <View style={styles.filaArriba}>
              <Text style={styles.filaFecha}>
                {fechaCl(v.fecha)}
                {v.horaInicio ? ` · ${v.horaInicio}` : ''}
              </Text>
              <Insignia texto={v.estado === 'EN_CURSO' ? 'En curso' : 'Finalizada'} tono={v.estado === 'EN_CURSO' ? 'alerta' : 'ok'} />
            </View>
            <Text style={styles.filaTitulo} numberOfLines={2}>
              {v.obra.nombre}
            </Text>
            <Text style={ui.sub}>
              {v.usuario.nombre} · {v.hallazgos} {v.hallazgos === 1 ? 'registro' : 'registros'}
            </Text>
          </Tarjeta>
        </Pressable>
      )}
    />
  )
}

// ─── Registros ────────────────────────────────────────────────────────────────
const ESTADO_REG: Record<string, { texto: string; tono: 'ok' | 'alerta' | 'error' | 'neutro' | 'info' }> = {
  COMPLETADO: { texto: 'Completado', tono: 'ok' },
  EN_PROGRESO: { texto: 'En progreso', tono: 'alerta' },
  VIGENTE: { texto: 'Hoy', tono: 'info' },
  ATRASADO: { texto: 'Atrasado', tono: 'error' },
  POR_APLICAR: { texto: 'Por aplicar', tono: 'neutro' },
}

type FiltroPrev = 'VIGENTE' | 'ATRASADO' | 'POR_APLICAR' | 'COMPLETADO'

function ListaRegistros({ area, puedeCrear }: { area: AreaCodigo; puedeCrear: boolean }) {
  const router = useRouter()
  const { data: obrasResp, isLoading: cargandoObras } = useObras()
  const obras = obrasResp?.data ?? []
  const [obraId, setObraId] = useState<number | null>(null)
  const [filtroPrev, setFiltroPrev] = useState<FiltroPrev>('VIGENTE')
  const [filtroTec, setFiltroTec] = useState<'EN_PROGRESO' | 'COMPLETADO'>('EN_PROGRESO')

  useEffect(() => {
    if (obraId === null && obras.length) setObraId(obras[0].id)
  }, [obras, obraId])

  const estado = area === 'PREVENCION' ? filtroPrev : filtroTec
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['registros', area, obraId, estado],
    queryFn: () =>
      api
        .get(AREA[area].registros, { searchParams: { obraId: String(obraId), estado, limit: '50' } })
        .json<Paginado<RegistroLista>>(),
    enabled: obraId !== null,
  })
  useFocusEffect(
    useCallback(() => {
      if (obraId !== null) void refetch()
    }, [refetch, obraId])
  )

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={ui.contenido}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {area === 'TECNICA' && puedeCrear ? (
            <Boton titulo="+ Aplicar formulario" onPress={() => router.push({ pathname: '/registro/nuevo', params: { obraId: obraId ?? '' } })} />
          ) : null}
          <Selector
            etiqueta="Obra"
            items={obras.map((o) => ({ id: o.id, nombre: o.nombre, detalle: o.codigo }))}
            valor={obraId}
            onCambio={(id) => setObraId(Number(id))}
            cargando={cargandoObras}
            vacio="No tienes obras asignadas."
          />
          {area === 'PREVENCION' ? (
            <Opciones
              opciones={[
                { valor: 'VIGENTE', nombre: 'Hoy' },
                { valor: 'ATRASADO', nombre: 'Atrasados' },
                { valor: 'POR_APLICAR', nombre: 'Próximos' },
                { valor: 'COMPLETADO', nombre: 'Completados' },
              ]}
              valor={filtroPrev}
              onCambio={setFiltroPrev}
            />
          ) : (
            <Opciones
              opciones={[
                { valor: 'EN_PROGRESO', nombre: 'En progreso' },
                { valor: 'COMPLETADO', nombre: 'Completados' },
              ]}
              valor={filtroTec}
              onCambio={setFiltroTec}
            />
          )}
          {isLoading && obraId !== null ? <Cargando /> : null}
          {isError ? <Aviso tono="error" texto="No se pudieron cargar los registros. Desliza hacia abajo para reintentar." /> : null}
        </View>
      }
      ListEmptyComponent={!isLoading && !isError && obraId !== null ? <Aviso texto="No hay registros con este filtro." /> : undefined}
      renderItem={({ item: r }) => {
        const est = ESTADO_REG[r.estado] ?? { texto: r.estado, tono: 'neutro' as const }
        return (
          <Pressable onPress={() => router.push(`/registro/${area}/${r.id}`)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <Tarjeta style={styles.fila}>
              <View style={styles.filaArriba}>
                <Text style={styles.filaFecha}>{fechaCl(r.fecha)}</Text>
                <Insignia texto={est.texto} tono={est.tono} />
                {r.enProgreso ? <Insignia texto="En borrador" tono="alerta" /> : null}
              </View>
              <Text style={styles.filaTitulo} numberOfLines={2}>
                {r.formulario.nombre}
              </Text>
              <Text style={ui.sub}>
                {r.formulario.codigo}
                {r.responsable ? ` · ${r.responsable}` : ''}
              </Text>
            </Tarjeta>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  cabecera: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  titulo: { fontSize: 24, fontWeight: '700', color: colors.ink },
  fila: { gap: 4, padding: 14, borderRadius: radius.md },
  filaArriba: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filaFecha: { fontSize: 14, fontWeight: '700', color: colors.ink, marginRight: 'auto' },
  filaTitulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
})
