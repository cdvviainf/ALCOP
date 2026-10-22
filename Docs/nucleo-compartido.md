# nucleo-compartido.md — ALCOP

> Estado: **spec cerrado para Etapa 1 (v0.1)** — Q&A con Christian 06-10-2026. Modelo de **Obra** y su mantenedor (incluye la asignación de titulares que antes vivía en "Asignaciones"/UsuarioObra). Pendientes al final.

## 1. Propósito

Definir la **Obra** —raíz de todo el sistema: toda inspección, hallazgo, visita y respuesta de formulario cuelga de una obra— y su mantenedor en el núcleo compartido, incluyendo la asignación de los titulares que reciben las notificaciones por obra. El Panel de obras y resumen (visibilidad por perfil) consume este modelo.

## 2. Actores

- **Administrador** (TOTAL en ambas áreas): crea/edita/elimina obras y asigna titulares.
- Usuarios con acceso a un área ven las obras y su parte del resumen (visibilidad §05 de `alcop-esquema.html`); no administran el catálogo de obras.

## 3. Glosario

- **Obra**: proyecto/faena de construcción con un identificador propio (`codigo`), estado de avance y titulares de notificación.
- **Acceso a obra** (`UsuarioObra`): **pertenencia** de un usuario a una obra. En Etapa 1 su uso es acotar quién puede ser **titular** (y, a futuro, destinatario de notificaciones); **no** es un filtro de autorización operativa por obra —el acceso a los módulos lo gobierna el **Perfil** (funciones), no `UsuarioObra` (ver §6).
- **Titular de obra** (`ObraTitular`): usuario asignado a un `RolObra` (Administrador, Jefe de Terreno, Prevencionista) para notificación automática. **Un titular por rol por obra**, elegido **solo entre los usuarios con acceso** a esa obra.
- **Estado de obra**: fase administrativa de la obra (Sin iniciar → En ejecución → Suspendida/Terminada). NO es el semáforo de cumplimiento (ese es derivado de las visitas, va en Analítica).

## 4. Modelo de datos

```prisma
enum EstadoObra {
  SIN_INICIAR
  EN_EJECUCION
  SUSPENDIDA
  TERMINADA
}

model Obra {
  id                   Int        @id @default(autoincrement())
  codigo               String     @unique            // identificador interno, OBLIGATORIO y único
  nombre               String
  mandante             String?                       // cliente/mandante de la obra
  direccion            String?
  comuna               String?
  fechaInicio          DateTime?
  fechaTerminoEstimada DateTime?
  estado               EstadoObra @default(SIN_INICIAR)
  usuarios             UsuarioObra[]
  respuestas           RespuestaFormulario[]
  // Auditoría completa (convención canónica — ver §6):
  creadoEn             DateTime   @default(now())
  creadoPor            String?
  actualizadoEn        DateTime?  @updatedAt
  actualizadoPor       String?
  eliminadoEn          DateTime?
  eliminadoPor         String?
}

// ACCESO usuario↔obra (22-10-2026): pertenencia pura, SIN rol. Es lo que define
// qué usuarios pueden entrar a la obra. Unicidad (obraId, usuarioId) entre las vivas
// (índice único PARCIAL en la migración, respeta soft-delete).
model UsuarioObra {
  id             Int      @id @default(autoincrement())
  usuarioId      String
  usuario        Usuario  @relation(fields: [usuarioId], references: [id])
  obraId         Int
  obra           Obra     @relation(fields: [obraId], references: [id])
  creadoEn       DateTime  @default(now())
  creadoPor      String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn    DateTime?
  eliminadoPor   String?
}

// TITULAR por rol (22-10-2026): un usuario por RolObra por obra (índice único
// PARCIAL (obraId, rolObra)). El usuario titular DEBE tener acceso (UsuarioObra).
model ObraTitular {
  id             Int      @id @default(autoincrement())
  obraId         Int
  obra           Obra     @relation(fields: [obraId], references: [id])
  rolObra        RolObra
  usuarioId      String
  usuario        Usuario  @relation(fields: [usuarioId], references: [id])
  creadoEn       DateTime  @default(now())
  creadoPor      String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn    DateTime?
  eliminadoPor   String?
}

enum RolObra {
  ADMINISTRADOR
  JEFE_DE_TERRENO
  PREVENCIONISTA
}
```

> **Rework de permisos por obra (22-10-2026, decisión de Christian):** se **separó acceso de titular**. Antes `UsuarioObra` llevaba el `rolObra` (cada fila = titular con rol, varios por rol). Ahora `UsuarioObra` es **acceso puro** (pertenencia usuario↔obra) y los **titulares** viven en `ObraTitular` con **un usuario por rol** (`@@unique([obraId, rolObra])` como índice parcial). El titular se elige **solo entre los usuarios con acceso** a esa obra. Revocar el acceso retira (soft) las titularidades de ese usuario en la obra. Supersede el modelo previo de "varios titulares por rol en UsuarioObra".

## 5. Flujos

1. **Crear obra** (Administrador): `codigo` + nombre + datos; nace en `SIN_INICIAR`. Los titulares se asignan en un **segundo paso**, desde el detalle de la obra (`/obras/:id`) — flujo en dos pasos en Etapa 1; la asignación inline dentro del alta queda como mejora futura (QA-OBR-006, 06-10-2026).
2. **Dar acceso y asignar titulares** (desde "Permisos Obra"): primero se concede **acceso** a los usuarios de la obra (`UsuarioObra`); luego se asigna **un titular por rol** (`ObraTitular`), elegido entre los usuarios con acceso. Asignar un rol que ya tiene titular lo **reemplaza**; revocar el acceso retira las titularidades de ese usuario. Reemplazar/quitar no borra el historial de notificaciones ya enviadas (vive en `alertas`, pendiente).
3. **Cambiar estado**: Sin iniciar → En ejecución → Suspendida/Terminada (transición libre entre estados, sin máquina rígida en Etapa 1).
4. **Panel de obras y resumen**: lista las obras con su estado; el cumplimiento (semáforo AL DÍA/PENDIENTE) se deriva de las visitas (módulos Prevención/Técnica), no de `estado`.

## 6. Reglas

- **Auditoría + soft-delete para toda ENTIDAD PRINCIPAL de negocio** (decisión canónica 06-10-2026, precisada 22-10-2026): toda tabla de negocio principal lleva `creadoEn/creadoPor`, `actualizadoEn/actualizadoPor`, `eliminadoEn/eliminadoPor`; nunca `DELETE` físico. `creadoPor`/`actualizadoPor`/`eliminadoPor` = `usuarioId` (cuid) del actor. **Excepción (precisión 22-10-2026):** los **blobs/registros hijos efímeros** que un spec de módulo declare explícitamente como tales —p. ej. las **fotos** de un hallazgo (`HallazgoFoto`/`HallazgoPrevencionFoto` y sus `*Data`)— pueden borrarse **físicamente** sin auditoría propia; la trazabilidad vive en la entidad padre (auditada y soft-deleted). Así está declarado en `tecnica.md §6` y `prevencion.md §6`. Aplica a Obra, UsuarioObra, ObraTitular ya; el *retrofit* de tablas existentes queda como tarea (ver §10 y CLAUDE.md §11).
- **Código**: `codigo` obligatorio y único por obra.
- **Acceso**: `UsuarioObra` asocia usuarios a la obra y es el **conjunto elegible para titular**. Administrar accesos y titulares requiere **Administrador** (`requireAdmin`). **Alcance Etapa 1 (22-10-2026):** el acceso NO restringe por sí mismo la lectura/operación de obras ni de visitas —eso lo gobierna el Perfil (funciones `OBRAS`, `PREV_INSPECCION`, `TEC_INSPECCION`). El *scoping operativo por obra* (que un inspector solo vea/opere sus obras asignadas) queda como **mejora futura** si se requiere; no está comprometido en Etapa 1.
- **Titulares**: 3 roles (`ADMINISTRADOR`, `JEFE_DE_TERRENO`, `PREVENCIONISTA`), **un usuario por rol por obra** (22-10-2026; reemplaza "varios por rol"). El titular debe tener **acceso** a la obra. **Bloqueo blando**: la obra puede guardarse sin los 3 roles cubiertos, pero el sistema **advierte** mientras falte alguno (no impide operar en Etapa 1).
- **Validación de área por rol** (usuarios-perfiles.md §7, modelo v2): no se puede asignar como `PREVENCIONISTA` a un usuario con el **Área Prevención deshabilitada** en su perfil, ni como `JEFE_DE_TERRENO` con el **Área Técnica deshabilitada**. `ADMINISTRADOR` no tiene restricción de área. `esAdmin` pasa siempre.
- **Borrado de obra**: soft-delete. Una obra con inspecciones registradas (RespuestaFormulario u otras) **no se elimina**; se cambia su `estado` (p. ej. a `TERMINADA`) o se desactiva vía soft-delete solo si no tiene registros. (Mismo criterio que Usuario.)
- **Autorización**: administrar obras y titulares requiere **Administrador** (TOTAL en ambas áreas) → `requireAdmin`. Lectura del listado: cualquier usuario autenticado (alimenta selects y panel).

## 7. Validaciones

- `codigo` único (409 en colisión), obligatorio, no vacío.
- `nombre` obligatorio.
- `estado` ∈ enum `EstadoObra`.
- `fechaTerminoEstimada`, si viene junto con `fechaInicio`, **no puede ser anterior** a `fechaInicio` — validación **dura** en frontend y backend (OBR-004, 06-10-2026; se endurece respecto al "blanda/advertir" inicial porque el mantenedor genérico no soporta un aviso no bloqueante y una fecha incoherente no debe guardarse).
- Titular: usuario existente y activo; cumple el nivel del rol (§6); sin duplicar misma persona+rol en la obra.

## 8. Estados

`Obra.estado`: `SIN_INICIAR` (default) · `EN_EJECUCION` · `SUSPENDIDA` · `TERMINADA`. Transiciones libres en Etapa 1 (sin workflow forzado). El semáforo de cumplimiento es un concepto separado (Analítica, derivado de visitas).

## 9. Integraciones

- `UsuarioObra` → módulo `alertas` (pendiente): al guardar hallazgo/visita/informe IA, se notifica por correo a todos los titulares de la obra.
- `RespuestaFormulario` y visitas (Prevención/Técnica) referencian `Obra` por FK.
- Panel de obras y resumen + Analítica (semáforo) consumen Obra + visitas.

## 10. Pendientes

- [ ] **Retrofit de auditoría**: agregar `actualizadoEn/actualizadoPor` (y los que falten de `creadoPor`/`eliminadoPor`) a las tablas ya creadas (catálogos, Perfil, CategoriaFormulario, Usuario) + setear `actualizadoPor` en cada update. Tarea separada (migración + factory/módulos).
- [ ] **Migración de `codigo` en Obra**: las 4 obras del seed no tienen `codigo`; generar uno (slug del nombre) al migrar, o re-seed.
- [ ] Definir si `TERMINADA`/`SUSPENDIDA` bloquean nuevas inspecciones (regla de los módulos de visitas — prevencion.md/tecnica.md).
- [ ] ¿`mandante` obligatorio? Hoy opcional. Confirmar al construir.
- [ ] SLA/journal cuando se quita un titular (¿se notifica al saliente?) — se resuelve con `alertas.md`.
- [ ] **Selector de titulares** (OBR-009): hoy el detalle de obra carga los primeros 100 usuarios sin búsqueda. Suficiente para Etapa 1 (operación ~24 usuarios: 6 obras × 4), pero cuando la base crezca hay que agregar búsqueda/paginación al selector.
