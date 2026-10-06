# nucleo-compartido.md — ALCOP

> Estado: **spec cerrado para Etapa 1 (v0.1)** — Q&A con Christian 06-10-2026. Modelo de **Obra** y su mantenedor (incluye la asignación de titulares que antes vivía en "Asignaciones"/UsuarioObra). Pendientes al final.

## 1. Propósito

Definir la **Obra** —raíz de todo el sistema: toda inspección, hallazgo, visita y respuesta de formulario cuelga de una obra— y su mantenedor en el núcleo compartido, incluyendo la asignación de los titulares que reciben las notificaciones por obra. El Panel de obras y resumen (visibilidad por perfil) consume este modelo.

## 2. Actores

- **Administrador** (TOTAL en ambas áreas): crea/edita/elimina obras y asigna titulares.
- Usuarios con acceso a un área ven las obras y su parte del resumen (visibilidad §05 de `alcop-esquema.html`); no administran el catálogo de obras.

## 3. Glosario

- **Obra**: proyecto/faena de construcción con un identificador propio (`codigo`), estado de avance y titulares de notificación.
- **Titular de obra**: usuario asignado a un `RolObra` (Administrador, Jefe de Terreno, Prevencionista) para efectos de notificación automática.
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

// Asignación de titulares (absorbe el antiguo mantenedor "Asignaciones").
// Varios usuarios pueden compartir un mismo RolObra en una obra; un mismo
// usuario puede ocupar más de un rol. El @@unique solo evita duplicar la misma
// persona en el mismo rol de la misma obra.
model UsuarioObra {
  id           Int      @id @default(autoincrement())
  usuarioId    String
  usuario      Usuario  @relation(fields: [usuarioId], references: [id])
  obraId       Int
  obra         Obra     @relation(fields: [obraId], references: [id])
  rolObra        RolObra
  creadoEn       DateTime  @default(now())
  creadoPor      String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn    DateTime?
  eliminadoPor   String?

  @@unique([obraId, rolObra, usuarioId])
}

enum RolObra {
  ADMINISTRADOR
  JEFE_DE_TERRENO
  PREVENCIONISTA
}
```

> Cambios respecto al modelo provisional: `activo` (boolean) → `estado` (enum); se agregan `codigo` (único/obligatorio), `mandante`, `fechaTerminoEstimada` y auditoría completa. En `UsuarioObra` el `@@unique([obraId, rolObra])` pasa a `@@unique([obraId, rolObra, usuarioId])` (varios titulares por rol) y se agrega soft-delete + auditoría.

## 5. Flujos

1. **Crear obra** (Administrador): `codigo` + nombre + datos; nace en `SIN_INICIAR`. Los titulares se asignan en un **segundo paso**, desde el detalle de la obra (`/obras/:id`) — flujo en dos pasos en Etapa 1; la asignación inline dentro del alta queda como mejora futura (QA-OBR-006, 06-10-2026).
2. **Asignar titulares**: por cada `RolObra`, agregar uno o más usuarios. Reemplazar/quitar no borra el historial de notificaciones ya enviadas (ese historial vive en `alertas`, pendiente).
3. **Cambiar estado**: Sin iniciar → En ejecución → Suspendida/Terminada (transición libre entre estados, sin máquina rígida en Etapa 1).
4. **Panel de obras y resumen**: lista las obras con su estado; el cumplimiento (semáforo AL DÍA/PENDIENTE) se deriva de las visitas (módulos Prevención/Técnica), no de `estado`.

## 6. Reglas

- **Auditoría + soft-delete para TODO registro** (decisión canónica 06-10-2026): toda tabla de negocio lleva `creadoEn/creadoPor`, `actualizadoEn/actualizadoPor`, `eliminadoEn/eliminadoPor`; nunca `DELETE` físico. `creadoPor`/`actualizadoPor`/`eliminadoPor` = `usuarioId` (cuid) del actor. Aplica a Obra y UsuarioObra ya; el *retrofit* de las tablas existentes queda como tarea (ver §10 y CLAUDE.md §11).
- **Código**: `codigo` obligatorio y único por obra.
- **Titulares**: 3 roles (`ADMINISTRADOR`, `JEFE_DE_TERRENO`, `PREVENCIONISTA`). Se permiten **varios usuarios por rol**; un usuario puede tener más de un rol. **Bloqueo blando**: una obra puede guardarse sin los 3 roles cubiertos, pero el sistema **advierte** mientras falte al menos un titular en algún rol (no impide operar en Etapa 1).
- **Validación de nivel por rol** (usuarios-perfiles.md §7): no se puede asignar como `PREVENCIONISTA` a un usuario con `nivelPrevencion = SIN_ACCESO`, ni como `JEFE_DE_TERRENO` a uno con `nivelTecnica = SIN_ACCESO`. `ADMINISTRADOR` no tiene restricción de área.
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
