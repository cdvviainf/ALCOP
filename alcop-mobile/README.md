# alcop-mobile — App ALCOP Terreno (Etapa 2)

App Android / iOS (Expo + React Native + TypeScript) sobre la misma API que la web.
Spec: [`../Docs/app-movil.md`](../Docs/app-movil.md).

## Desarrollo local (emulador Android)

```bash
# 1. API corriendo en el puerto 3001 (cd ../alcop-api && npm run dev)
# 2. Exponer Metro (8081) y la API (3001) al emulador como localhost
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:3001 tcp:3001
# 3. Levantar la app en Expo Go
EXPO_PUBLIC_API_URL=http://localhost:3001/api npx expo start --go --localhost --android
```

En un teléfono físico en la misma red, usar la IP del computador en `EXPO_PUBLIC_API_URL`
(ver `.env.example`).

## Comandos

- `npm run typecheck` — TypeScript.
- `npx expo-doctor` — chequeo de dependencias y configuración.
- `npx expo install <paquete>` — agrega dependencias con la versión compatible del SDK.
