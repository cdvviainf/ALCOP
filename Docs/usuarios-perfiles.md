# usuarios-perfiles.md — ALCOP

> Estado: **spec cerrado para Etapa 1 (v0.1)** — pendientes señalados al final.

## 1. Propósito

Definir cómo se autentican los usuarios, qué nivel de acceso tienen por área (Prevención / Técnica), y cómo se asigna un usuario a una obra para efectos de notificación automática.

## 2. Actores

Los 6 roles observados en el mockup y confirmados en la propuesta (alcop-esquema.html §08): Administrador, Jefe Prevencionista, Supervisor de obra, Prevencionista de obra, Jefe de terreno, Trabajador. En este sistema un "rol" no es un enum fijo en código — es la combinación de los niveles de acceso que tiene el Perfil del usuario en cada Área (ver §4).

## 3. Glosario

- **Área**: Prevención o Técnica — las dos mitades funcionales del sistema (catálogo fijo de 2 filas).
- **Perfil**: conjunto de niveles de acceso (uno por Área) que se asigna a uno o más usuarios. Reemplaza al enum `UserRole` — no hay roles fijos en código, todo pasa por Perfil.
- **Nivel**: `SIN_ACCESO` / `LECTURA` / `TOTAL` — igual a la convención usada en FAS/IFK.
- **Asignación a obra**: un usuario puede estar asignado a 0, 1 o varias obras con un rol de notificación (Administrador, Jefe de Terreno, Prevencionista) — es lo que dispara el correo automático en cada revisión (alcop-esquema.html §06/07).

## 4. Modelo de datos (resuelve el pendiente de `00-entorno-general.md` §3)

```prisma
model Area {
  id          Int      @id @default(autoincrement())
  codigo      String   @unique // "PREVENCION" | "TECNICA"
  nombre      String
}

model Usuario {
  id            String   @id @default(cuid()) // String — referencia Better Auth
  nombre        String
  email         String   @unique
  activo        Boolean  @default(true)
  // Administrador transversal: si true, acceso TOTAL a todo y el perfil se ignora
  // (perfilId opcional). Si false, el acceso lo define el Perfil (granular).
  esAdmin       Boolean  @default(false)
  perfilId      Int?
  perfil        Perfil?  @relation(fields: [perfilId], references: [id])
  obras         UsuarioObra[]
  creadoEn      DateTime @default(now())
  creadoPor     String?
  eliminadoEn   DateTime?
}

// Modelo de accesos GRANULAR por función (confirmado 07-10-2026 — reemplaza el
// "un nivel por Área"). Cada Perfil enciende/apaga cada Área y asigna un nivel por
// función dentro de ella; además un nivel transversal para Obras.
model Perfil {
  id             Int             @id @default(autoincrement())
  nombre         String
  areaPrevencion Boolean         @default(false) // Área Prevención: Sí/No
  areaTecnica    Boolean         @default(false) // Área Técnica: Sí/No
  permisos       PerfilPermiso[]
  usuarios       Usuario[]
  creadoEn       DateTime        @default(now())
  eliminadoEn    DateTime?
}

// Catálogo de funciones/mantenedores controlables por perfil.
model Funcion {
  id       Int             @id @default(autoincrement())
  codigo   String          @unique // OBRAS, PREV_INSPECCION, TEC_CAT_ETAPAS_NIDO, ...
  nombre   String
  area     FuncionArea     // TRANSVERSAL | PREVENCION | TECNICA
  orden    Int             @default(0)
  permisos PerfilPermiso[]
}

enum FuncionArea {
  TRANSVERSAL
  PREVENCION
  TECNICA
}

// Nivel de un Perfil sobre una Función. Si el Área de la función está apagada en
// el perfil, el nivel efectivo es SIN_ACCESO sin importar el valor guardado.
model PerfilPermiso {
  id        Int         @id @default(autoincrement())
  perfilId  Int
  perfil    Perfil      @relation(fields: [perfilId], references: [id])
  funcionId Int
  funcion   Funcion     @relation(fields: [funcionId], references: [id])
  nivel     NivelAcceso @default(SIN_ACCESO)

  @@unique([perfilId, funcionId])
}

enum NivelAcceso {
  SIN_ACCESO
  LECTURA
  TOTAL
}

// Asignación de un usuario a una obra con un rol de notificación.
// Un usuario puede aparecer en varias obras; una obra tiene exactamente
// un Administrador, un Jefe de Terreno y un Prevencionista asignados
// (regla de negocio — ver §6).
model UsuarioObra {
  id            Int      @id @default(autoincrement())
  usuarioId     String
  usuario       Usuario  @relation(fields: [usuarioId], references: [id])
  obraId        Int
  obra          Obra     @relation(fields: [obraId], references: [id])
  rolObra       RolObra
  creadoEn      DateTime @default(now())

  @@unique([obraId, rolObra]) // una obra solo puede tener un titular por rol a la vez
}

enum RolObra {
  ADMINISTRADOR
  JEFE_DE_TERRENO
  PREVENCIONISTA
}
```

> `Obra` se especifica en `nucleo-compartido.md` — aquí solo se referencia por FK.

## 5. Flujos

1. **Login** — Better Auth, sesión por cookie/JWT. Al autenticar, el frontend pide `GET /api/usuarios/me` → devuelve `esAdmin` + el mapa de permisos efectivos por función, para construir el sidebar (cada ítem visible si su función ≥ `LECTURA`; `esAdmin` ve todo).
2. **Asignación a obra** — un Administrador (`esAdmin`) asigna/reemplaza los titulares (varios por `RolObra`) por obra desde "Permisos Obra". Reemplazar un titular no elimina el historial de notificaciones ya enviadas.
3. **Notificación automática** — cuando se guarda un Hallazgo, una Visita (Prevención o Técnica) o un informe de Análisis IA, el sistema busca los `UsuarioObra` de esa obra y envía el correo a los 3 roles asignados (alcop-esquema.html §06/07).

## 6. Reglas

> **Modelo v2 (07-10-2026, granular).** El acceso ya NO es "un nivel por Área", sino:
> - **Usuario.esAdmin**: si true → acceso TOTAL a todo (bypassa el perfil); la config de Accesos (Usuarios, Perfiles, Permisos Obra) es solo para `esAdmin`.
> - **Perfil**: `areaPrevencion`/`areaTecnica` (Sí/No) + un `nivel` (Total/Lectura/Sin Acceso) por cada Función (Inspección, Formularios, Análisis IA, Reportes y cada catálogo), más la función transversal **Obras**.
> - **Nivel efectivo**: si el Área de la función está apagada en el perfil → `SIN_ACCESO`. `TOTAL` = crear/editar/eliminar; `LECTURA` = ver (y completar, en formularios); `SIN_ACCESO` = oculto.
> - La tabla de 6 perfiles de abajo es el **seed inicial** mapeado al modelo v2 (cada área de la fila con nivel X → área encendida + todas sus funciones en X; Obras = el mayor de ambos). El usuario admin del seed queda `esAdmin=true`.


- Una obra **debe** tener los 3 roles de notificación asignados antes de poder operar (bloqueo blando: se puede crear la obra, pero el sistema advierte mientras falte alguno).
- Por función: `TOTAL` permite crear/editar/eliminar; `LECTURA` solo consultar (y completar formularios); `SIN_ACCESO` oculta el ítem del sidebar.
- `esAdmin` ve y opera todo (incluida la config de Accesos). Un no-admin ve solo las funciones con nivel ≥ `LECTURA`, respetando los toggles de área.
- Los 6 perfiles de la propuesta se precargan como seed inicial; las columnas de abajo son el **nivel por área** del modelo antiguo, que el seed **expande** a todas las funciones de esa área (y Obras = el mayor de ambos):

| Perfil | Prevención | Técnica |
|---|---|---|
| Administrador | TOTAL | TOTAL |
| Jefe Prevencionista | TOTAL | SIN_ACCESO |
| Supervisor de obra | TOTAL | TOTAL |
| Prevencionista de obra | TOTAL | SIN_ACCESO |
| Jefe de terreno | SIN_ACCESO | TOTAL |
| Trabajador | LECTURA | SIN_ACCESO |

> **Confirmado con Christian (04-10-2026):** `nivelTecnica = SIN_ACCESO` para "Jefe Prevencionista" — el perfil queda 100% acotado a Prevención. Esto difiere deliberadamente de alcop-esquema.html §08, donde "Jefe Prevencionista" y "Supervisor de obra" figuran ambos como "ambas áreas" (redacción comercial simplificada); el modelo técnico es más preciso y prevalece sobre esa tabla.

## 7. Validaciones

- `email` único por usuario.
- Un usuario no puede ser eliminado (soft delete) si tiene revisiones registradas en los últimos 90 días — se desactiva (`activo = false`) en su lugar.
- `UsuarioObra`: no se puede asignar como `PREVENCIONISTA` a un usuario cuyo perfil tenga el **Área Prevención deshabilitada** (ni como `JEFE_DE_TERRENO` con el Área Técnica deshabilitada). `esAdmin` no tiene restricción.

## 8. Estados

`Usuario.activo`: true/false (no hay estados intermedios). `Perfil`: no tiene estados, solo soft delete.

## 9. Integraciones

- Better Auth para sesión/autenticación.
- Resend/SMTP para el correo de notificación por obra (ver `alertas.md`, pendiente de spec).

## 10. Pendientes

- [x] Confirmar nivelTecnica de "Jefe Prevencionista" — **SIN_ACCESO**, confirmado 04-10-2026 (ver nota en §6).
- [x] Definir si el panel permite crear Perfiles nuevos — **confirmado: Perfiles 100% dinámicos**, CRUD completo desde la UI (admin define nombre, toggles de área y nivel por función). Los 6 de §6 son seed inicial. El nivel por función gobierna crear/eliminar (TOTAL) vs ver/completar (LECTURA).
- [ ] Definir SLA/journal de auditoría cuando se reemplaza un `UsuarioObra` (¿se notifica al saliente?).
- [ ] **Compatibilidad perfil↔rol tras la asignación** (QA Fase C, 06-10-2026): hoy §7 solo valida al **asignar** un titular. Si después se cambia el `perfilId` del usuario o se bajan los niveles del perfil, un titular puede quedar incompatible (p. ej. Prevencionista con `SIN_ACCESO` en Prevención) y seguir recibiendo notificaciones. El spec no define qué hacer: (1) permitir y advertir [coherente con el "bloqueo blando" de §6], (2) rechazar el cambio, o (3) retirar la asignación automáticamente. **Decisión 06-10-2026: opción 1 — no se enforza en Etapa 1**, se resuelve al especificar `alertas.md`/validaciones de obra. No es un defecto exigible todavía.
