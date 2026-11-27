import { useMemo, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors, radius } from '@/lib/theme'
import type { Area } from '@/lib/dashboard'
import { elegirFotos, useFotoRemota, type ArchivoFoto } from '@/lib/fotos'

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

// ─── Botón ────────────────────────────────────────────────────────────────────
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
  style,
}: {
  titulo: string
  onPress: () => void
  variante?: 'primario' | 'secundario' | 'peligro'
  cargando?: boolean
  deshabilitado?: boolean
  style?: ViewStyle
}) {
  const inactivo = deshabilitado || cargando
  const prim = variante === 'primario'
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.boton,
        prim ? styles.botonPrim : styles.botonSec,
        variante === 'peligro' && { borderColor: colors.danger },
        inactivo && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={prim ? '#fff' : colors.ink} />
      ) : (
        <Text style={[styles.botonTexto, { color: prim ? '#fff' : variante === 'peligro' ? colors.danger : colors.ink }]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  )
}

// ─── Campo de texto con etiqueta ─────────────────────────────────────────────
export function Etiqueta({ children, obligatoria }: { children: ReactNode; obligatoria?: boolean }) {
  return (
    <Text style={styles.etiqueta}>
      {children}
      {obligatoria ? <Text style={{ color: colors.danger }}> *</Text> : null}
    </Text>
  )
}

export function Campo({
  etiqueta,
  obligatoria,
  style,
  ...props
}: TextInputProps & { etiqueta?: string; obligatoria?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      {etiqueta ? <Etiqueta obligatoria={obligatoria}>{etiqueta}</Etiqueta> : null}
      <TextInput
        placeholderTextColor={colors.label}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 88, textAlignVertical: 'top' }, props.editable === false && { opacity: 0.6 }, style]}
      />
    </View>
  )
}

// ─── Selector (lista en modal, con búsqueda) ─────────────────────────────────
export interface ItemSelector {
  id: number | string
  nombre: string
  detalle?: string
}

export function Selector({
  etiqueta,
  obligatoria,
  items,
  valor,
  onCambio,
  placeholder = 'Selecciona…',
  vacio = 'No hay opciones.',
  deshabilitado = false,
  cargando = false,
}: {
  etiqueta?: string
  obligatoria?: boolean
  items: ItemSelector[]
  valor: number | string | null
  onCambio: (id: number | string) => void
  placeholder?: string
  vacio?: string
  deshabilitado?: boolean
  cargando?: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const elegido = items.find((i) => i.id === valor)
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? items.filter((i) => `${i.nombre} ${i.detalle ?? ''}`.toLowerCase().includes(t)) : items
  }, [items, q])

  return (
    <View style={{ gap: 6 }}>
      {etiqueta ? <Etiqueta obligatoria={obligatoria}>{etiqueta}</Etiqueta> : null}
      <Pressable
        disabled={deshabilitado}
        onPress={() => {
          setQ('')
          setAbierto(true)
        }}
        style={[styles.input, styles.selector, deshabilitado && { opacity: 0.6 }]}
      >
        <Text style={[styles.selectorTexto, !elegido && { color: colors.label }]} numberOfLines={1}>
          {cargando ? 'Cargando…' : elegido ? elegido.nombre : items.length ? placeholder : vacio}
        </Text>
        <Text style={styles.selectorFlecha}>▾</Text>
      </Pressable>

      <Modal visible={abierto} animationType="slide" onRequestClose={() => setAbierto(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.content }}>
          <View style={styles.modalCabecera}>
            <Text style={styles.modalTitulo} numberOfLines={1}>
              {etiqueta ?? 'Selecciona'}
            </Text>
            <Pressable onPress={() => setAbierto(false)} hitSlop={12}>
              <Text style={styles.modalCerrar}>Cerrar</Text>
            </Pressable>
          </View>
          {items.length > 8 ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Buscar…"
                placeholderTextColor={colors.label}
                style={styles.input}
                autoCorrect={false}
              />
            </View>
          ) : null}
          <FlatList
            data={filtrados}
            keyExtractor={(i) => String(i.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.vacio}>{vacio}</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onCambio(item.id)
                  setAbierto(false)
                }}
                style={({ pressed }) => [styles.opcion, item.id === valor && styles.opcionSel, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.opcionTexto, item.id === valor && { color: colors.primary, fontWeight: '700' }]}>{item.nombre}</Text>
                {item.detalle ? <Text style={styles.opcionDetalle}>{item.detalle}</Text> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  )
}

// ─── Opciones en fila (segmentos / botones de elección) ──────────────────────
export function Opciones<T extends string>({
  opciones,
  valor,
  onCambio,
  deshabilitado = false,
}: {
  opciones: { valor: T; nombre: string }[]
  valor: T | null
  onCambio: (v: T) => void
  deshabilitado?: boolean
}) {
  return (
    <View style={styles.opciones}>
      {opciones.map((o) => {
        const sel = o.valor === valor
        return (
          <Pressable
            key={o.valor}
            disabled={deshabilitado}
            onPress={() => onCambio(o.valor)}
            style={[styles.opcionChip, sel && styles.opcionChipSel, deshabilitado && !sel && { opacity: 0.4 }]}
          >
            <Text style={[styles.opcionChipTexto, sel && { color: colors.primary, fontWeight: '700' }]}>{o.nombre}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Estados de carga / error / vacío ────────────────────────────────────────
export function Cargando() {
  return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
}

export function Aviso({ texto, tono = 'neutro' }: { texto: string; tono?: 'neutro' | 'ok' | 'error' | 'alerta' }) {
  const bg = tono === 'ok' ? colors.okBg : tono === 'error' ? colors.dangerBg : tono === 'alerta' ? colors.warnBg : colors.card
  const fg = tono === 'ok' ? colors.okFg : tono === 'error' ? colors.danger : tono === 'alerta' ? colors.warnFg : colors.muted
  return (
    <View style={[styles.aviso, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 14 }}>{texto}</Text>
    </View>
  )
}

export function Insignia({ texto, tono }: { texto: string; tono: 'ok' | 'alerta' | 'error' | 'neutro' | 'info' }) {
  const map = {
    ok: [colors.okBg, colors.okFg],
    alerta: [colors.warnBg, colors.warnFg],
    error: [colors.dangerBg, colors.danger],
    neutro: [colors.content, colors.muted],
    info: ['#0284c71a', '#0369a1'],
  } as const
  const [bg, fg] = map[tono]
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipTexto, { color: fg }]}>{texto}</Text>
    </View>
  )
}

// ─── Fotos ────────────────────────────────────────────────────────────────────
/** Miniatura de una foto guardada en la API (requiere la cookie de sesión). */
export function FotoRemota({ ruta, onQuitar }: { ruta: string; onQuitar?: () => void }) {
  const { data: uri, isError } = useFotoRemota(ruta)
  return (
    <View>
      {uri ? (
        <Image source={{ uri }} style={styles.miniatura} />
      ) : (
        <View style={[styles.miniatura, { alignItems: 'center', justifyContent: 'center' }]}>
          {isError ? <Text style={{ fontSize: 11, color: colors.muted }}>Sin imagen</Text> : <ActivityIndicator color={colors.muted} />}
        </View>
      )}
      {onQuitar ? (
        <Pressable onPress={onQuitar} style={styles.quitarFoto} hitSlop={8}>
          <Text style={styles.quitarFotoTexto}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Fotos locales por subir (cámara o galería) con opción de quitar. */
export function FotosLocales({
  fotos,
  onCambio,
  max = 10,
}: {
  fotos: ArchivoFoto[]
  onCambio: (f: ArchivoFoto[]) => void
  max?: number
}) {
  const agregar = async (origen: 'camara' | 'galeria') => {
    const nuevas = await elegirFotos(origen)
    onCambio([...fotos, ...nuevas].slice(0, max))
  }
  return (
    <View style={{ gap: 8 }}>
      {fotos.length ? (
        <View style={styles.fotos}>
          {fotos.map((f, i) => (
            <View key={f.uri}>
              <Image source={{ uri: f.uri }} style={styles.miniatura} />
              <Pressable onPress={() => onCambio(fotos.filter((_, j) => j !== i))} style={styles.quitarFoto} hitSlop={8}>
                <Text style={styles.quitarFotoTexto}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {fotos.length < max ? <BotonesFoto onElegir={agregar} /> : null}
    </View>
  )
}

export function BotonesFoto({ onElegir, cargando = false }: { onElegir: (o: 'camara' | 'galeria') => void; cargando?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Boton titulo="📷 Cámara" variante="secundario" onPress={() => onElegir('camara')} cargando={cargando} style={{ flex: 1 }} />
      <Boton titulo="Galería" variante="secundario" onPress={() => onElegir('galeria')} deshabilitado={cargando} style={{ flex: 1 }} />
    </View>
  )
}

export const ui = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.content },
  contenido: { padding: 16, gap: 12, paddingBottom: 48 },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.ink },
  texto: { fontSize: 15, color: colors.ink },
  sub: { fontSize: 13, color: colors.muted },
})

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipTexto: { fontSize: 11, fontWeight: '700' },
  seccion: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 8 },
  boton: { minHeight: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1 },
  botonPrim: { backgroundColor: colors.primary, borderColor: colors.primary },
  botonSec: { backgroundColor: colors.card, borderColor: colors.border },
  botonTexto: { fontSize: 15, fontWeight: '700' },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  selector: { flexDirection: 'row', alignItems: 'center' },
  selectorTexto: { flex: 1, fontSize: 15, color: colors.ink },
  selectorFlecha: { fontSize: 14, color: colors.muted, marginLeft: 8 },
  modalCabecera: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  modalTitulo: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink },
  modalCerrar: { fontSize: 15, fontWeight: '600', color: colors.primary },
  opcion: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  opcionSel: { backgroundColor: '#e0441b12' },
  opcionTexto: { fontSize: 16, color: colors.ink },
  opcionDetalle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  vacio: { padding: 16, fontSize: 14, color: colors.muted },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.card },
  opcionChipSel: { borderColor: colors.primary, backgroundColor: '#e0441b14' },
  opcionChipTexto: { fontSize: 14, color: colors.ink },
  aviso: { borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniatura: { width: 88, height: 88, borderRadius: radius.sm, backgroundColor: colors.border },
  quitarFoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarFotoTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
