# App móvil (Etapa 2) — Spec

> Estado: **v0.1 borrador (12-11-2026)** — se levanta el stand by de la Etapa 2 (Christian, 12-11-2026, con OK del cliente a la Etapa 1; quedan pendientes ajustes de Dashboard y PDF en la web).
> Alcance comercial: `alcop-esquema.html` §04, §09 (Gantt Fase 2) y §11 — 63 UF, 15 días hábiles.

## 1. Propósito

Llevar los flujos de **terreno** de la Etapa 1 a una app instalable Android / iOS con experiencia más fluida (cámara rápida, push, uso con una mano). La app es **otro cliente de la misma API** (`alcop-api`): misma lógica, mismos datos y los mismos permisos. Según §03/§04 de la propuesta, **no** incluye modo sin conexión (la conectividad en obra está resuelta).

Hitos comprometidos (Gantt §09): arquitectura de la app nativa → autenticación con el backend → pantallas de Prevención → pantallas de Técnica → notificaciones push nativas → QA en dispositivos reales → entrega.

## 2. Actores

Los mismos usuarios de la web (`Usuario` + `Perfil` granular + `esAdmin`). En la app opera el personal de terreno (Prevencionista, Jefe de terreno, Supervisor, Administrador de obra). La **configuración** (mantenedores, usuarios, perfiles, permisos de obra, calendario, formularios) **queda solo en la web**.

## 3. Glosario

- **App**: `alcop-mobile` (Expo / React Native).
- **Build de desarrollo**: binario propio instalado en el teléfono (EAS `development`), necesario para push.
- **Token push**: `ExpoPushToken` del dispositivo, registrado por usuario.

## 4. Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Framework | **Expo SDK (React Native) + TypeScript**, `expo-router` | Compila a apps nativas Android/iOS desde un solo código TS (mismo lenguaje que api/web); builds de iOS en la nube (EAS), sin Mac con Xcode. |
| Builds y publicación | **EAS Build / EAS Submit** | Firma y publicación en Google Play / App Store (cuentas de ALCOP, §11). |
| Auth | **Better Auth** con plugin `@better-auth/expo` (servidor + cliente) | Mismo proveedor que la web; la sesión se guarda en `expo-secure-store` y se envía como cookie a la API. |
| Datos | **TanStack Query v5 + ky v1** | Mismas convenciones que la web (CLAUDE.md §3). |
| Formularios | React Hook Form + Zod | Igual que la web. |
| Cámara / fotos | `expo-image-picker` (cámara y galería) + `expo-image-manipulator` | Fotos comprimidas antes de subirlas; la API vuelve a aplicar la calidad configurada. |
| Push | `expo-notifications` + **Expo Push Service** (FCM/APNs) | Un solo envío desde la API para Android e iOS. |
| UI | Componentes propios con la identidad ALCOP (naranja `#e8560f`, carbón `#1a1a1a`, fondo `#f4f3f1`) | Coherente con la web; sin librería pesada de UI. |
| Configuración | `EXPO_PUBLIC_API_URL` (por perfil de EAS: dev / qa / prod) | Igual que `NEXT_PUBLIC_API_URL` en la web. |

## 5. Alcance funcional (pantallas)

Visibilidad por **función del perfil** (mismo mapa de `GET /api/usuarios/me`) y por **obra con acceso** (`UsuarioObra`; `esAdmin` ve todas), igual que en la web.

1. **Ingreso**: email + contraseña; sesión persistente; cerrar sesión.
2. **Inicio**: resumen (`GET /api/nucleo/dashboard`) con KPIs y **Mi agenda** (atrasadas / próximas) con acceso directo al registro.
3. **Visita Técnica** (`TEC_INSPECCION`): listar / crear / continuar visitas; agregar hallazgos o notas técnicas (lote-unidad, tipo, comentario, fotos con cámara); finalizar.
4. **Registro Técnica** (`TEC_REGISTROS`): aplicar un formulario técnico a una obra, llenarlo (todos los tipos de respuesta + fotos por pregunta) y cerrarlo.
5. **Visita Prevención** (`PREV_INSPECCION`): igual que Técnica, con categoría › subcategoría, nivel de riesgo, plazo y fotos.
6. **Registro Prevención** (`PREV_REGISTROS`): llenar los formularios agendados y cerrarlos con fecha de revisión.
7. **PDF**: abrir / compartir el reporte PDF de visitas y registros cerrados (endpoints `reporte.pdf` existentes).

**Fuera de la app:** mantenedores, usuarios / perfiles / permisos, calendario (programación), editor de formularios, gráfico mensual del dashboard. **Análisis IA**: entra en la app recién cuando exista en la web/API (hoy no está construido).

## 6. Reglas

- La app **no** duplica reglas de negocio: valida en el cliente solo para la UX; la API es la que autoriza y valida (Zod, permisos, alcance por obra).
- Los permisos y la lista de obras se piden en cada inicio de sesión y al volver la app al frente (sin caché persistente de permisos).
- Sin modo sin conexión: si no hay red, la acción falla con un mensaje y se puede reintentar; lo que se tipeó en un formulario no se pierde mientras la pantalla siga abierta.

## 7. Cambios en la API

- `auth.ts`: plugin `expo()` de `@better-auth/expo` y el esquema de la app (`alcop://`) en `trustedOrigins`.
- **Push**: nueva tabla `DispositivoPush` (`usuarioId`, `token` único, `plataforma`, auditoría) y endpoints `POST/DELETE /api/usuarios/me/dispositivos`. El envío se hace desde un servicio `push` usando la API de Expo.
- **Pendiente:** validar el acceso a la obra en las escrituras con `obraId` (visitas, registros, programación) — ya registrado en `nucleo-compartido.md §6`; en la app pasa a ser relevante porque es otro cliente.

## 8. Estados

Sin estados nuevos: la app usa los de la API (visita `EN_CURSO`/`FINALIZADA`, registro `BORRADOR`/`CERRADO`).

## 9. Integraciones

- `alcop-api` (REST, misma sesión Better Auth).
- Expo Push Service → FCM (Android) / APNs (iOS).
- Google Play Console y Apple Developer Program (cuentas y costos de ALCOP, §11).

## 10. Pendientes

- [ ] **Eventos de push** (qué notifica y a quién). Propuesta: (a) formulario agendado a tu nombre — aviso el día anterior y el mismo día; (b) registro atrasado; (c) a los titulares de la obra al finalizar una visita o cerrar un registro (mismo criterio que las alertas por correo, `alertas.md` pendiente).
- [ ] Cuentas de Google Play Console / Apple Developer de ALCOP (nombre del publicador, bundle id; propuesta `cl.alcop.terreno`).
- [ ] Nombre visible de la app e ícono (propuesta: "ALCOP Terreno", logo de la web).
- [ ] Análisis IA en la app (cuando exista en la API).
