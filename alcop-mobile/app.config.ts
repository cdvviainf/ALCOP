import type { ConfigContext, ExpoConfig } from 'expo/config'

// Variantes por ambiente (eas.json → env.APP_VARIANT). La de QA usa otro nombre e
// identificador para poder convivir en el mismo teléfono con la de producción.
// La URL de la API viene de EXPO_PUBLIC_API_URL (también por perfil de eas.json).
const esQA = process.env.APP_VARIANT === 'qa'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: esQA ? 'ALCOP Terreno QA' : 'ALCOP Terreno',
  slug: config.slug ?? 'alcop-terreno',
  ios: {
    ...config.ios,
    bundleIdentifier: esQA ? 'cl.alcop.terreno.qa' : 'cl.alcop.terreno',
  },
  android: {
    ...config.android,
    package: esQA ? 'cl.alcop.terreno.qa' : 'cl.alcop.terreno',
  },
})
