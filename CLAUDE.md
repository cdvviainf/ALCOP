# CLAUDE.md — Sistema de Inspección en Terreno (ALCOP)

> Documento vivo. Actualizar con cada decisión técnica relevante.
> Última actualización: Octubre 2026 · Versión 0.1 (post luz verde, Etapa 1 + Etapa 2)

---

## 0. Fuente autoritativa

> El **alcance funcional** (módulos, roles, Carta Gantt, condiciones comerciales) vive en `alcop-esquema.html` — la propuesta comercial que ALCOP aceptó (ambas etapas, 145 UF con descuento por aceptación conjunta). Este `CLAUDE.md` mantiene el **contrato técnico**: stack, estructura, convenciones, entorno, Docker y reglas para Claude Code.
>
> **Metodología spec-first (igual que en FAS):** antes de implementar cada módulo se escribe su spec en `Docs/<modulo>.md` con todas las reglas de negocio, modelo de datos y casos borde resueltos vía preguntas y respuestas con Christian. Hasta que un spec esté cerrado, cualquier detalle no definido en `alcop-esquema.html` se pregunta — nunca se inventa.
>
> **Specs cerrados (04-10-2026):** `usuarios-perfiles.md` (perfil con nivel de acceso por Área, no por ítem de menú individual — más simple que el modelo de FAS) y `formularios-dinamicos.md` (motor de formularios 100% dinámico: Formulario → Pregunta con `tipoRespuesta` [Checkbox/Selección múltiple/Número/Texto/Texto largo], obligatoria/opcional, foto opcional por pregunta, permisos por usuario vía `FormularioPermiso`). Ambos superseden cualquier mención anterior de "ItemMenu" para ALCOP — ese patrón de FAS no aplica aquí, es más simple.
>
> **Convenciones canónicas (iguales a FAS/IFK):**
> - **IDs:** `id Int @id @default(autoincrement())` en todas las tablas.
> - **Autorización:** por **perfil + ítem de menú + nivel** (`SIN_ACCESO`/`LECTURA`/`TOTAL`), no por rol fijo — ver sección 08 de `alcop-esquema.html` y el spec `Docs/usuarios-perfiles.md`.
> - **Prefijo de API:** `/api/<módulo>` (sin versión). Ej.: `/api/nucleo`, `/api/prevencion`, `/api/tecnica`.
> - **Frontend:** route group `(app)` bajo `src/app/` (ej. `src/app/(app)/prevencion`).
> - **Naming de dominio:** español (`codigo`, `descripcion`, `creadoEn`, `creadoPor`, `eliminadoEn`...).

---

## Decisiones Canónicas

### Decisión canónica — Base del frontend (alcop-web)

Template base: next-shadcn-dashboard-starter (Kiranism) — el mismo que en FAS.
Stack alineado: Next.js 15 App Router, React 19, Tailwind v4, shadcn/ui.
Se adopta como ESQUELETO, no como aplicación final: se forkea y se adapta.

Reglas de adaptación (obligatorias):
1. AUTH: arrancar Clerk por completo (rutas, middleware, providers) y reemplazar por Better Auth contra alcop-api.
2. DATA FETCHING: NO usar la capa de fetching propia del template. Usar TanStack Query + ky contra alcop-api.
3. NAVEGACIÓN: sidebar construido desde ItemMenu + perfiles, respetando niveles LECTURA / TOTAL — con la regla de visibilidad de la sección 05 de `alcop-esquema.html` (usuario con ambos perfiles ve Prevención + Técnica; usuario de un área ve solo la suya).
4. Quitar módulos no usados del template (kanban, e-commerce, etc.).

Se conserva del template: TanStack Tables server-side (search/filter/paginación), formularios React Hook Form + Zod, theming por CSS variables (remarcar a identidad ALCOP).

### Decisión canónica — Análisis IA

- Adaptador genérico de IA (mismo patrón que el adaptador DTE de FAS): `src/modules/ai/analisis-ia.adapter.ts`, configurado por variable de entorno (`AI_PROVIDER=gemini|mock`).
- El flujo es igual en Prevención y Técnica: fotos → adaptador IA → informe en el formato fijo (Obra, Inspector, Fecha y hora, Ubicación, Imágenes, Observaciones) → editable por el usuario antes de guardar como reporte definitivo.
- En desarrollo, usar `AI_PROVIDER=mock` (respuestas dummy) hasta tener la cuenta/API key de Gemini de ALCOP.

### Decisión canónica — Etapa 2 (App móvil) en stand by

- Christian pidió (04-10-2026) dejar la **definición técnica** de la app móvil nativa en stand by — no especificar módulos, pantallas ni modelo de datos de Etapa 2 todavía.
- Esto NO afecta lo ya comprometido comercialmente con ALCOP (145 UF totales, Etapa 2 = 63 UF, Gantt de la sección 09 de `alcop-esquema.html`) — es solo una pausa en el trabajo de especificación técnica hasta que Etapa 1 esté más avanzada.
- Mientras esté en stand by: no crear `Docs/app-movil.md`, no iniciar `alcop-mobile/`.

---

## 1. Contexto del proyecto

**Cliente:** ALCOP Constructora SPA — constructora chilena con obras en paralelo (prevención de riesgos + control de calidad técnico).

**Objetivo:** Reemplazar la inspección en papel por un sistema web (luego app móvil nativa) con dos frentes — Web Prevención y Web Técnica — sobre un núcleo de datos compartido por obra, incluyendo análisis de fotos con IA y generación de reportes editables.

**Operado por:** VIAIN Asesorías Informáticas. ALCOP no tiene equipo TI interno.

**Estado comercial:** Propuesta aceptada completa — Etapa 1 (Web) + Etapa 2 (App móvil), 145 UF totales (96 + 63 − 14 UF de descuento por aceptación conjunta), pago 30/70 por etapa. Ver sección 11 de `alcop-esquema.html`.

---

## 2. Repositorios

| Repo | Descripción | Path local |
|------|-------------|------------|
| `alcop-api` | Backend — API REST | `/Users/christiandroguett/sites/ALCOP/alcop-api` |
| `alcop-web` | Frontend — Next.js (Etapa 1) | `/Users/christiandroguett/sites/ALCOP/alcop-web` |
| `alcop-mobile` | App nativa Android/iOS (Etapa 2 — a definir fecha de inicio) | `/Users/christiandroguett/sites/ALCOP/alcop-mobile` |

Los repos son independientes. La comunicación es exclusivamente vía API REST (JSON).

---

## 3. Stack tecnológico

Mismo stack que FAS (consistencia de portafolio VIAIN) — se reutilizan Docker Compose, Makefile y setup-check.sh con el mismo patrón.

### alcop-api (Backend)
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Lenguaje | TypeScript | 5.x |
| Framework | Fastify | 5.x |
| Validación | Zod | 3.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 17 |
| Caché / Colas | Redis + BullMQ | latest |
| Auth | Better Auth | latest |
| Email | Resend (o Nodemailer/SMTP propio de ALCOP) | latest |
| PDF | Playwright (Chromium headless) | latest |
| Excel | ExcelJS | latest |
| IA (Análisis IA) | Adaptador genérico → Gemini API | latest |
| Tests | Vitest | latest |

### alcop-web (Frontend)
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js | 15 (App Router) |
| Lenguaje | TypeScript | 5.x |
| UI base | React | 19 |
| Estilos | Tailwind CSS | v4 |
| Componentes | shadcn/ui | latest |
| Estado servidor | TanStack Query | v5 |
| Formularios | React Hook Form + Zod | latest |
| HTTP client | ky | latest |

### Infraestructura
- **Contenedores:** Docker + Docker Compose (ver `docker-compose.yml` — puertos distintos a FAS para correr ambos stacks en paralelo en la misma máquina: Postgres 5434, Redis 6380, pgAdmin 5051, Redis Commander 8082, API 3011, Web 3010)
- **CI/CD:** GitHub Actions (a configurar)
- **Despliegue:** a definir — ver sección 11 de `alcop-esquema.html` para el detalle de costos de hosting/VPS no incluidos en la propuesta ($150.000–$450.000 CLP/año) y de API de IA ($60.000–$400.000 CLP/año)

---

## 4. Estructura de directorios

### alcop-api
```
alcop-api/
├── src/
│   ├── config/           # Variables de entorno, configuración global
│   ├── lib/              # Instancias compartidas (prisma, redis, resend, etc.)
│   ├── plugins/          # Plugins Fastify (auth, cors, swagger, error-handler)
│   ├── modules/
│   │   ├── auth/
│   │   ├── usuarios/
│   │   ├── nucleo/              # Panel de obras y resumen + Formularios dinámicos
│   │   │   ├── obras/
│   │   │   └── formularios/     # Motor de checklists con creación por sección
│   │   ├── prevencion/
│   │   │   ├── hallazgos/
│   │   │   ├── visitas/
│   │   │   └── analisis-ia/
│   │   ├── tecnica/
│   │   │   ├── visitas/         # Incluye hitos: nidos, puntales
│   │   │   └── analisis-ia/
│   │   ├── reportes/            # PDFs: formularios, visitas, hallazgos, informes IA
│   │   └── alertas/              # Notificación automática por obra (Administrador, Jefe de Terreno, Prevencionista)
│   ├── shared/           # DTOs, tipos, utilidades compartidas (incl. ai/analisis-ia.adapter.ts)
│   └── server.ts         # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
├── docker/
├── .env.example
├── package.json
└── tsconfig.json
```

### Estructura de cada módulo
```
modulo/
├── modulo.routes.ts      # Definición de rutas Fastify
├── modulo.controller.ts  # Handlers de rutas (thin — solo orquesta)
├── modulo.service.ts     # Lógica de negocio
├── modulo.repository.ts  # Queries Prisma (acceso a datos)
├── modulo.schema.ts      # Schemas Zod (validación request/response)
└── modulo.types.ts       # Tipos TypeScript del módulo
```

### alcop-web
```
alcop-web/
├── src/
│   app/
│   ├── (auth)/
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Panel de obras y resumen (visibilidad por perfil)
│   │   ├── prevencion/
│   │   │   ├── hallazgos/
│   │   │   ├── visitas/
│   │   │   └── analisis-ia/
│   │   └── tecnica/
│   │       ├── visitas/
│   │       └── analisis-ia/
│   ├── api/
│   └── layout.tsx
│   components/
│   ├── ui/
│   ├── shared/
│   └── modules/
│   lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
│   hooks/
│   types/
├── public/
├── .env.local.example
├── package.json
└── tsconfig.json
```

---

## 5. Base de datos — Modelo de datos

### Convenciones
- **IDs:** `id Int @id @default(autoincrement())` en todas las tablas.
- **Auditoría (naming español):** `creadoEn`/`creadoPor`, `actualizadoEn`/`actualizadoPor`, `eliminadoEn`/`eliminadoPor` (soft delete).
- **Autorización:** perfil + ítem de menú + nivel (no roles fijos).

### Schema Prisma — mapa de modelos (a especificar en `Docs/`)

| Spec (`Docs/`) | Estado | Modelos principales |
|---|---|---|
| `00-entorno-general.md` | Borrador inicial | Convenciones transversales, visibilidad por perfil |
| `00-mantenedores-requeridos.md` | **Cerrado** | Listado consolidado de catálogos (Area, CategoriaFormulario, NivelRiesgo, EtapaNido, RolObra, etc.) |
| `usuarios-perfiles.md` | **Cerrado** | Area, Usuario, Perfil (nivel por área), UsuarioObra |
| `formularios-dinamicos.md` | **Cerrado** | CategoriaFormulario, Formulario, Pregunta, RespuestaFormulario, RespuestaPregunta, FormularioPermiso |
| `nucleo-compartido.md` | Pendiente de spec | Obra, PanelResumen |
| `prevencion.md` | Pendiente de spec | Hallazgo, VisitaPrevencion, AnalisisIA |
| `tecnica.md` | Pendiente de spec | VisitaTecnica, HitoEtapa (nidos/puntales), AnalisisIA |
| `reportes.md` | Pendiente de spec | Reporte (PDF generado), vínculo a Formulario/Visita/Hallazgo/AnalisisIA |
| `alertas.md` | Pendiente de spec | Notificación por obra (Administrador, Jefe de Terreno, Prevencionista) |
| `app-movil.md` | **En stand by** — no especificar aún | — |

> Cada spec sigue el formato canónico de 10 secciones usado en FAS: Propósito, Actores, Glosario, Modelo de Datos, Flujos, Reglas, Validaciones, Estados, Integraciones, Pendientes.

---

## 6. API REST — Convenciones

- **Prefijo:** `/api/<módulo>` (sin versión). Ej.: `/api/nucleo`, `/api/prevencion`, `/api/tecnica`, `/api/reportes`.
- **Auth:** sesión Better Auth; autorización por perfil + ítem de menú + nivel.
- **Paginación:** `?page=1&limit=20` → `{ data, meta: { total, page, limit, totalPages } }`.
- **Errores:** `{ error: { code, message, details? } }`.
- **Fechas:** ISO 8601.

---

## 7. Reglas de negocio críticas (de alcop-esquema.html — se refinan al especificar cada módulo)

### Prevención
- Sin ciclo de corrección: un hallazgo se ingresa, se reporta y queda como registro — nunca se reabre.
- Cada obra tiene Administrador, Jefe de Terreno y Prevencionista asignados; los tres se notifican automáticamente por correo en cada revisión de su obra.

### Técnica
- Con ciclo de corrección: un hallazgo/hito queda activo en "Por resolver" hasta que una nueva inspección lo cierre.
- Hitos de nidos (6 etapas: descubierto → picado → buzón → llenado → descimbre → perfilado) y de retiro de puntales (fecha hormigonado + criterio del calculista = fecha retiro) viven dentro del registro de visitas técnicas — no son módulos aparte.

### Análisis IA (ambos frentes)
- Entrada: fotos de una inspección/visita. Salida: informe editable en formato fijo (Obra, Inspector, Fecha y hora automatizada, Ubicación, Imágenes, Observaciones).
- El usuario siempre revisa y edita antes de guardar como reporte definitivo — la IA nunca escribe un reporte final sin pasar por el usuario.

### Núcleo compartido
- Panel de obras y resumen con visibilidad por perfil: usuario con ambos permisos ve todo; usuario de un área ve solo su parte.
- Motor de formularios dinámicos (checklists con creación de ítems por sección) es compartido por ambos frentes.

---

## 8. Variables de entorno

### alcop-api (.env)
```env
# App
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3011

# Database
DATABASE_URL=postgresql://alcop_user:alcop_pass@localhost:5434/alcop_db

# Redis
REDIS_URL=redis://:alcop_redis_pass@localhost:6380

# Auth (Better Auth)
BETTER_AUTH_SECRET=change_me_in_production
BETTER_AUTH_URL=http://localhost:3011

# Email
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@alcop.cl

# Análisis IA
AI_PROVIDER=mock
# AI_PROVIDER=gemini
# AI_API_KEY=xxxx

# CORS
CORS_ORIGIN=http://localhost:3010

# Motor de Documentos (PDF) — Playwright.
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### alcop-web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3011/api
```

---

## 9. Docker Compose

Ver `docker-compose.yml` en la raíz del proyecto (PostgreSQL 17, Redis 7, pgAdmin, Redis Commander, alcop-api, alcop-web). Puertos de host elegidos para no chocar con el stack de FAS si ambos corren a la vez en la misma máquina — ver tabla de la sección 3.

---

## 10. Fases de implementación (de la Carta Gantt — sección 09 de alcop-esquema.html)

**Etapa 1 — Web (24 días hábiles, ~5 semanas):**
1. Núcleo compartido: arquitectura y modelo de datos, autenticación y permisos, UI base, Panel de obras y resumen, Formularios dinámicos, Biblioteca y PDF, Notificaciones por obra, Analítica y semáforo.
2. Web Prevención: Registro de hallazgos, Visitas de prevención, Análisis IA — Prevención.
3. Web Técnica: Formularios LCH-AT, Registro de visitas técnicas (hitos nidos/puntales), Análisis IA — Técnica.
4. Cierre: QA integral y corrección, Capacitación a usuarios clave, Entrega Fase 1.

**Etapa 2 — App móvil nativa (15 días hábiles adicionales, ~3 semanas):** no corre en paralelo a la Etapa 1; parte cuando ALCOP decida iniciarla. Arquitectura app nativa → Autenticación con backend → Pantallas de Prevención → Pantallas de Técnica → Notificaciones push nativas → QA en dispositivos reales → Entrega Fase 2.

---

## 11. Decisiones técnicas tomadas

- Ambas etapas (Web + App móvil) aprobadas por ALCOP en conjunto — 145 UF totales, pago 30/70 por etapa.
- Proyecto puede iniciar en octubre 2026 (fecha de inicio real de Fase 2 aún a definir con ALCOP).
- Stack técnico alineado al de FAS (Node/Fastify/Prisma/PostgreSQL + Next.js/shadcn) para reutilizar convenciones, tooling y agentes de desarrollo ya rodados en VIAIN.
- Costos de hosting/VPS y de API de IA corren por cuenta de ALCOP, fuera de la propuesta (sección 11 de alcop-esquema.html) — igual que las suscripciones Google Play / Apple Developer para la Etapa 2.
- Proveedor de IA aún no elegido — se parte con `AI_PROVIDER=mock` y adaptador genérico, igual que el patrón de adaptador DTE de FAS.
- Modelo de accesos simplificado respecto a FAS: `Perfil` tiene nivel de acceso por Área (Prevención/Técnica), no un sistema de `ItemMenu` granular — no se justifica la complejidad para 2 áreas.
- Formularios 100% dinámicos desde la Etapa 1 (no hay formularios hardcodeados en código): tipos de respuesta Checkbox, Selección múltiple, Número, Texto, Texto largo; foto opcional por pregunta; permisos de ver/editar por usuario además del nivel de área.
- Definición técnica de la Etapa 2 (App móvil) puesta en stand by el 04-10-2026 — foco 100% en Etapa 1 por ahora.
- Reglas de acceso y permisos cerradas el 04-10-2026: "Jefe Prevencionista" queda `SIN_ACCESO` en Técnica (difiere de la redacción "ambas" de alcop-esquema.html §08); `FormularioPermiso` solo amplía acceso, nunca lo niega; `CategoriaFormulario` es 100% dinámico, sin lista cerrada previa.

---

## 12. Reglas para Claude Code

1. **Nunca omitir validación Zod** en ningún endpoint — validar request body, params y query params siempre.
2. **Repository pattern obligatorio** — las queries Prisma van en `.repository.ts`, nunca en el service ni en el controller.
3. **Transacciones Prisma** para cualquier operación que modifique más de una tabla.
4. **Nunca exponer campos sensibles** en respuestas API (passwords, tokens internos, API keys de IA).
5. **Controladores thin** — solo reciben el request, llaman al service y devuelven la respuesta. Cero lógica de negocio.
6. **Errores de negocio como excepciones tipadas** — clases `BusinessError` con código y mensaje, capturadas en el error handler global de Fastify.
7. **Soft delete en entidades principales** — nunca `DELETE` físico en tablas de negocio.
8. **Logs estructurados** con Pino — nunca `console.log` en producción.
9. **Variables de entorno validadas al arrancar** con Zod — si falta una variable crítica, el proceso no inicia.
10. **El adaptador de IA es intercambiable** — ninguna lógica de módulo depende directamente de Gemini; todo pasa por `analisis-ia.adapter.ts`.
11. **Los specs de `Docs/` son autoritativos** sobre modelos, rutas y permisos una vez escritos; hasta entonces, `alcop-esquema.html` es la referencia de alcance. Ante cualquier ambigüedad no cubierta por ninguno de los dos, preguntar a Christian antes de inventar.
