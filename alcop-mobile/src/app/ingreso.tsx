import { useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { authClient } from '@/lib/auth-client'
import { colors, radius } from '@/lib/theme'

export default function Ingreso() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const ingresar = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      const { error: err } = await authClient.signIn.email({ email: email.trim().toLowerCase(), password })
      if (err) setError(err.status === 401 ? 'Correo o contraseña incorrectos.' : (err.message ?? 'No se pudo ingresar.'))
      // Con sesión, el guard del layout raíz lleva a la app.
    } catch {
      setError('Sin conexión con el servidor. Revisa tu red e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centro}>
        {/* Logo vertical naranja + blanco sobre negro (propuesta de gráfica, dirección A). */}
        <Image
          source={require('../../assets/logo-vertical-blanco.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="ALCOP Constructora"
        />

        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Ingreso</Text>
          <Text style={styles.subtitulo}>Usa la misma cuenta del sistema web.</Text>

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            placeholder="nombre@alcop.cl"
            placeholderTextColor={colors.label}
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={ingresar}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={ingresar}
            disabled={enviando}
            style={({ pressed }) => [styles.boton, (pressed || enviando) && { backgroundColor: colors.primaryHover }]}
          >
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Ingresar</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.panel },
  centro: { flex: 1, justifyContent: 'center', padding: 20, gap: 24 },
  logo: { width: 200, height: 106, alignSelf: 'center', marginBottom: 8 },
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20 },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitulo: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: 12, marginBottom: 6 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.content },
  error: { marginTop: 12, color: colors.danger, fontSize: 14 },
  boton: { marginTop: 20, height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
