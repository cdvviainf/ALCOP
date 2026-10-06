# Plan de construcción — Mantenedores (ALCOP)

> Deriva de `00-mantenedores-requeridos.md` (fuente autoritativa del listado) + el estado real del scaffold. Estado al **06-10-2026**.
> Objetivo: construir TODOS los mantenedores con un patrón común, en fases de bajo riesgo primero.

---

## 0. Cimientos compartidos (construir UNA vez, antes que todo)

La mayoría de los mantenedores son el mismo CRUD. Antes de replicarlos conviene dejar dos piezas reutilizables:

**Backend — patrón de catálogo.** Ya está probado en `nucleo/obras/` (routes → controller thin → service → repository → schema Zod → types). Dos opciones:
- (a) Replicar ese patrón por catálogo (explícito, consistente con CLAUDE.md §12).
- (b) Un `shared/catalogo.factory.ts` que, dado un modelo Prisma + schema Zod + nivel requerido, genere el router CRUD estándar (list paginado `?q`/`?page`/`?limit`, get, create, patch, soft-delete). **Recomendado** para los catálogos simples (NivelRiesgo, etc.) — reduce boilerplate; los que tienen reglas propias (Usuario, UsuarioObra) van explícitos.

**Frontend — CRUD reutilizable.** Crear `components/shared/crud-maintainer.tsx`: `DataTable` (TanStack, server-side con `?q`/paginación) + diálogo de alta/edición (React Hook Form + Zod) + borrado con confirmación, manejado por una **config por catálogo** (columnas, campos del form, endpoint). Cada mantenedor pasa a ser ~1 archivo de config. Usa el `api` client (proxy same-origin) + `useQuery`/`useMutation`.

**Autorización (cerrado 06-10-2026 — Administrador = acceso total).**
- Catálogos ligados a un Área → `requireArea(area, 'TOTAL')` para mutar, `requireAuth` para leer.
- Config global (Area, Perfil, Usuario, UsuarioObra, CategoriaFormulario) → requiere **Administrador** = `nivelPrevencion = TOTAL` **y** `nivelTecnica = TOTAL`. Implementar un helper `requireAdmin` (ambas áreas TOTAL), más preciso que `requireAnyArea('TOTAL')`.

**Convención de prefijos** (`/api/<módulo>`): núcleo/config → `/api/nucleo`; catálogos de Prevención → `/api/prevencion`; de Técnica → `/api/tecnica`.

---

## 1. Estado actual

| Pieza | Modelo | Backend | Frontend |
|---|---|---|---|
| Area | ✅ | — (solo seed) | ❌ |
| Perfil | ✅ (+seed 6) | ✅ CRUD `/api/nucleo/perfiles` (requireAdmin, guard borrado) | ✅ `/usuarios/perfiles` (selects de nivel) |
| Usuario | ✅ (+ Better Auth) | ✅ CRUD `/api/usuarios` (requireAdmin, alta atómica, guard 90d) | ✅ `/usuarios` |
| UsuarioObra | ✅ | ✅ `/api/nucleo/usuario-obras` (requireAdmin, validación §7) | ✅ `/usuarios/asignaciones` (UI a medida) |
| Obra | ✅ definitivo (codigo/estado/mandante/fechas/auditoría, spec `nucleo-compartido.md`) | ✅ CRUD + titulares `/api/nucleo/obras` | ✅ `/obras` + detalle `/obras/[id]` (titulares) |
| CategoriaFormulario | ✅ (+activo/soft-delete/auditoría, +seed 11) | ✅ CRUD `/api/nucleo/categorias-formulario` (authz TOTAL-en-área) | ✅ `/formularios/categorias` |
| Area | ✅ | ✅ GET lectura `/api/nucleo/areas` (repo pattern pend. Fase D) | — (llena selects) |
| Formulario / Pregunta | ✅ | ❌ | ⚠️ checklist EPP mock |
| TipoRespuesta / RolObra / NivelAcceso | ✅ enum | — | — (enums, sin UI) |
| **NivelRiesgo** | ✅ (+seed 4) | ✅ CRUD `/api/prevencion/niveles-riesgo` (factory) | ✅ `/prevencion/niveles-riesgo` (crud-maintainer) |
| **TipoHallazgoTecnico** | ❌ | ❌ | ❌ |
| **EtapaConstructiva** | ❌ | ❌ | ❌ |
| **EtapaNido** | ❌ | ❌ | ❌ |

---

## 2. Plan por mantenedor

Leyenda: **M**=modelo Prisma · **B**=endpoints · **S**=seed · **F**=UI · **A**=authz.

### Catálogos simples (tabla + CRUD, pocas filas)
| # | Mantenedor | Qué falta | Seed inicial | Dominio |
|---|---|---|---|---|
| 1 | **Area** | B (GET lista, solo lectura) · F opcional | 2 (ya seedeadas) | núcleo |
| 2 | **CategoriaFormulario** | B (CRUD, crear al vuelo) · F | 11 (ya) | núcleo |
| 4 | **NivelRiesgo** | **M** + B + S + F | Alto, Medio, Observación, No conformidad | prevención |
| 5 | **TipoHallazgoTecnico** | ✅ hecho (`/api/tecnica/tipos-hallazgo`, `/tecnica/tipos-hallazgo`) | No conformidad, Mejora, Sugerencia | técnica |
| 6 | **EtapaConstructiva** | ✅ hecho (`/api/tecnica/etapas-constructivas`) | Obra gruesa, Faenas húmedas, Terminaciones, Especialidades, Urbanización | técnica |
| 7 | **EtapaNido** | ✅ hecho (`/api/tecnica/etapas-nido`, con `orden`) | Descubierto, Picado, Buzón, Llenado, Descimbre, Perfilado | técnica |

> Modelo sugerido para los nuevos catálogos: `{ id, codigo @unique?, nombre, orden? (EtapaNido), activo @default(true), creadoEn }`. Soft-delete solo si se espera borrar; si no, flag `activo`.

### Enums (sin mantenedor UI — ya en código)
| # | | Nota |
|---|---|---|
| 3 | **TipoRespuesta** | enum (5) — no requiere UI |
| 8 | **RolObra** | enum (3) |
| 9 | **NivelAcceso** | enum (3) |

### Con estructura / reglas propias
| # | Mantenedor | Qué falta | Reglas clave |
|---|---|---|---|
| 10 | **Obra** | ✅ hecho (modelo definitivo + CRUD + titulares + UI) | Spec `nucleo-compartido.md` cerrado; absorbe la asignación de titulares (varios por rol); pasó el ciclo Codex |
| 11 | **Perfil** | B (CRUD) + F | **Editable desde UI** (CRUD completo de niveles, confirmado 06-10-2026; los 6 seed son punto de partida). Nivel por Área, no por ítem |
| 12 | **Usuario** | B (CRUD + alta vía Better Auth) + F | Alta la hace Administrador (registro público deshabilitado); enlazar `authUserId`; soft-delete con regla de 90 días (usuarios-perfiles §7) |
| 13 | **UsuarioObra** | B + F | Una obra = 1 titular por `RolObra` (`@@unique`); validar nivel del usuario (usuarios-perfiles §7); dispara alertas |

---

## 3. Fases de ejecución (orden recomendado)

> **Progreso (06-10-2026):** Fase A ✅ COMPLETA + **Fase B ✅ COMPLETA** (NivelRiesgo · Prevención; TipoHallazgoTecnico, EtapaConstructiva, EtapaNido · Técnica), verificadas end-to-end. Técnica usa `requireArea('TECNICA','TOTAL')` y prefijo `/api/tecnica`. Migración `add_catalogos_tecnica`, seeds: 3 tipos / 5 etapas constructivas / 6 etapas de nido. 4 páginas con `CrudMaintainer` + items en sidebar. `next build` OK (16 rutas), smoke test de los 3 endpoints nuevos OK (listado en orden + 401 sin auth).
> - Backend: `shared/catalogo.factory.ts` (CRUD genérico sobre delegate Prisma + Zod + authz, soft-delete, 409 en único), `shared/slug.ts` (compartido con el seed), helper `requireAdmin` en `plugins/auth-guard.ts`.
> - Frontend: `components/shared/crud-maintainer.tsx` (DataTable + búsqueda debounced + paginación + diálogo RHF/Zod + borrado con confirmación + toasts sonner). shadcn `dialog`/`sonner` añadidos; `Toaster` montado en `providers.tsx`.
> - NivelRiesgo: modelo+migración `add_nivel_riesgo`, seed de 4 (Alto/Medio/Observación/No conformidad), ruta `/api/prevencion/niveles-riesgo`, página `/prevencion/niveles-riesgo` + entrada en sidebar.
> - Verificado: typecheck API+web OK, `next build` OK, CRUD vía curl (auto-slug codigo, 409 duplicado, 422 inválido, soft-delete 204→404, 401 sin auth).
> - **Siguiente:** resto de Fase B — TipoHallazgoTecnico, EtapaConstructiva, EtapaNido (técnica). EtapaNido ejercita `orden` ordenable.

1. **Fase A — Cimientos** (§0): factory de catálogo backend + `crud-maintainer` frontend + regla de authz. Habilita todo lo demás. ✅
2. **Fase B — Catálogos simples nuevos** ✅: NivelRiesgo ✅ · TipoHallazgoTecnico ✅ · EtapaConstructiva ✅ · EtapaNido ✅. Independientes, bajo riesgo, ejercitan el patrón punta a punta (migración + seed + CRUD + UI). Van a su área (Prevención/Técnica).
3. **Fase C — Config de núcleo** ✅ (salvo UI de Obra): Perfil ✅ · CategoriaFormulario ✅ · Usuario ✅ · UsuarioObra ✅. UI de Obra sigue FUERA hasta cerrar `nucleo-compartido.md`. Pasó el ciclo Codex (3 rondas QA + arbitraje + tests). Pendientes registrados: C-006 (compatibilidad perfil↔rol post-asignación → `usuarios-perfiles.md §10`, no se enforza en Etapa 1) y repo-pattern de `areas.routes.ts` → Fase D.
4. **Fase D — Cierre** ✅: Area al patrón repository (controller/service/repository/schema/types) con GET de lectura; sidebar filtrado por nivel de Área del perfil (`nucleo`=≥LECTURA en un área, `prevencion`/`tecnica` por su nivel, `admin`=TOTAL en ambas; no renderiza hasta resolver `/me`); visibilidad de CategoriaFormulario extremo-a-extremo (lista filtrada server-side por áreas accesibles, detalle 404 si el área no es accesible, acciones por fila según TOTAL del área). Pasó el ciclo Codex (4 rondas QA + tests). Deuda preexistente (no Fase D): ESLint del API sin `eslint.config.*`; sin cobertura Vitest.

Cada ítem = 1 ciclo: migración (si hay modelo) → seed idempotente → endpoints con Zod + repository + authz → UI (config del `crud-maintainer`) → verificación local → commit. (Si se activa el ciclo Codex, pasa por su QA.)

---

## 4. Decisiones (CERRADAS con Christian — 06-10-2026)

- [x] **EtapaConstructiva vs TipoHallazgoTecnico** → **tablas separadas** (dos catálogos independientes). Resuelve `00-mantenedores-requeridos.md` §40.
- [x] **Perfiles** → **editables desde la UI** (CRUD completo de niveles; los 6 seed son punto de partida, no fijos). Resuelve `usuarios-perfiles.md` §10.
- [x] **Obra** → **cerrar primero el modelo** en `Docs/nucleo-compartido.md` (spec-first, Q&A con Christian) ANTES de construir su UI de mantenedor. Prerequisito de la Fase C para Obra; no bloquea el resto.
- [x] **Acceso a configuración** → **Administrador = acceso total** (TOTAL en ambas áreas). Se implementa con el helper `requireAdmin`.
- [ ] **Catálogos simples — tabla vs enum**: asumimos **tabla administrable** (coherente con "mantenedor"). Confirmar al construir cada uno si de verdad se editará; si no, degradar a enum. (Pendiente menor, no bloquea.)

> **Nada bloquea ya la Fase A ni la Fase B.** Único prerequisito nuevo: `nucleo-compartido.md` (modelo de Obra) debe cerrarse antes de la **UI de Obra** en la Fase C — el resto de la Fase C (Perfil, Usuario, UsuarioObra, CategoriaFormulario) no depende de eso.
