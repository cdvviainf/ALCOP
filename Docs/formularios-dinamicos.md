# formularios-dinamicos.md — ALCOP

> Estado: **spec cerrado para Etapa 1 (v0.1)** — pendientes señalados al final.
> Vive en el **Núcleo compartido** (alcop-esquema.html §05) — lo usan ambas áreas.

## 1. Propósito

Motor genérico para crear formularios (checklists) sin tocar código: un usuario con permiso crea un formulario nuevo, lo asocia a un área, arma sus preguntas con el tipo de respuesta que corresponda, y el formulario queda disponible de inmediato para que los usuarios autorizados lo respondan en terreno.

## 2. Actores

Usuario con `nivel = TOTAL` en el área del formulario (crea/edita la plantilla). Usuario con permiso de ver (§6) la responde. El Administrador puede todo.

## 3. Glosario

- **Formulario**: la plantilla — nombre, código, área, categoría, lista ordenada de preguntas.
- **Pregunta**: un punto de chequeo dentro del formulario — tiene texto, tipo de respuesta, y si es obligatoria.
- **Categoría de formulario**: agrupación temática dentro de un área (ej. "EPP", "Trabajos en Altura" en Prevención; "LCH-AT-01AS" en Técnica) — mismo rol que las categorías ya usadas en el mockup.
- **Respuesta de formulario**: una instancia real de un formulario respondido — para una obra, un inspector, una fecha.
- **Permiso de formulario**: quién puede ver y quién puede editar (responder) un formulario dado, más allá del nivel general del área.

## 4. Modelo de datos

```prisma
model CategoriaFormulario {
  id        Int     @id @default(autoincrement())
  areaId    Int
  area      Area    @relation(fields: [areaId], references: [id])
  codigo    String  // "EPP", "TRABAJOS_ALTURA", "LCH-AT-01AS", ...
  nombre    String
  formularios Formulario[]
}

model Formulario {
  id              Int      @id @default(autoincrement())
  codigo          String   @unique // autogenerado o manual, ej. "SSOMA-E-001"
  nombre          String
  areaId          Int
  area            Area     @relation(fields: [areaId], references: [id])
  categoriaId     Int
  categoria       CategoriaFormulario @relation(fields: [categoriaId], references: [id])
  requiereObra    Boolean  @default(true) // casi siempre true — toda respuesta queda ligada a una obra
  activo          Boolean  @default(true)
  preguntas       Pregunta[]
  permisos        FormularioPermiso[]
  respuestas      RespuestaFormulario[]
  creadoEn        DateTime @default(now())
  creadoPor       String
  eliminadoEn     DateTime?
}

model Pregunta {
  id              Int      @id @default(autoincrement())
  formularioId    Int
  formulario      Formulario @relation(fields: [formularioId], references: [id])
  orden           Int        // posición dentro del formulario
  texto           String     // el punto de chequeo / la pregunta
  tipoRespuesta   TipoRespuesta
  obligatoria     Boolean    @default(true)
  permiteFoto     Boolean    @default(false) // habilita el registro fotográfico en la pregunta
  fotoObligatoria Boolean    @default(false) // si permiteFoto, la foto es requerida al responder (13-10-2026, pedido de Christian)
  opciones        String[]   // solo aplica si tipoRespuesta = SELECCION_MULTIPLE (lista de alternativas)
}

enum TipoRespuesta {
  CHECKBOX           // Cumple / No cumple / N.A. (como en el mockup EPP)
  SELECCION_MULTIPLE // una o más alternativas de una lista configurable
  NUMERO
  TEXTO              // campo corto
  TEXTO_LARGO        // campo de texto extendido
}

// Instancia real: un formulario respondido por un usuario, para una obra, en una fecha.
model RespuestaFormulario {
  id            Int      @id @default(autoincrement())
  formularioId  Int
  formulario    Formulario @relation(fields: [formularioId], references: [id])
  obraId        Int
  obra          Obra       @relation(fields: [obraId], references: [id])
  usuarioId     String
  usuario       Usuario    @relation(fields: [usuarioId], references: [id])
  fechaHora     DateTime   @default(now())
  respuestas    RespuestaPregunta[]
  creadoEn      DateTime   @default(now())
}

model RespuestaPregunta {
  id                      Int      @id @default(autoincrement())
  respuestaFormularioId   Int
  respuestaFormulario     RespuestaFormulario @relation(fields: [respuestaFormularioId], references: [id])
  preguntaId              Int
  pregunta                Pregunta @relation(fields: [preguntaId], references: [id])
  valorTexto              String?  // TEXTO, TEXTO_LARGO
  valorNumero             Decimal? // NUMERO
  valorCheckbox           String?  // "CUMPLE" | "NO_CUMPLE" | "N_A"
  valorSeleccionMultiple  String[] // SELECCION_MULTIPLE
  fotoUrl                 String?  // si permiteFoto = true y el usuario adjuntó una imagen
}

// Permisos por usuario (punto 3 — "quien lo puede o no ver o editar").
// Si un Formulario no tiene ninguna fila en FormularioPermiso, el acceso
// por defecto es el nivel de Área del usuario (ver usuarios-perfiles.md).
// Una fila aquí es una AMPLIACIÓN explícita a ese default — nunca una
// restricción (confirmado con Christian 04-10-2026: solo se amplía, no se niega).
model FormularioPermiso {
  id            Int      @id @default(autoincrement())
  formularioId  Int
  formulario    Formulario @relation(fields: [formularioId], references: [id])
  usuarioId     String
  usuario       Usuario    @relation(fields: [usuarioId], references: [id])
  puedeVer      Boolean    @default(true)
  puedeEditar   Boolean    @default(false) // "editar" = responder el formulario, no modificar la plantilla

  @@unique([formularioId, usuarioId])
}
```

## 5. Flujos

1. **Crear formulario** (usuario con `TOTAL` en el área): nombre, área, categoría (existente o nueva), agrega preguntas una a una (texto + tipo + obligatoria + ¿permite foto?), guarda. Queda `activo = true` de inmediato — no hay paso de "publicar" aparte.
2. **Responder formulario** (usuario con acceso — nivel de área o `FormularioPermiso.puedeEditar`): selecciona obra → selecciona formulario de su categoría → responde cada pregunta según su tipo → si alguna pregunta tiene `permiteFoto`, puede adjuntar una imagen → guarda como `RespuestaFormulario`.
3. **Ampliar acceso a un formulario** (excepción): el creador o el Administrador agrega filas en `FormularioPermiso` para usuarios específicos que deban ver/editar un formulario fuera de lo que su nivel de área ya permite. Confirmado 04-10-2026: **solo amplía, nunca niega** — ver regla en §6.

## 6. Reglas

- **Tipos de respuesta soportados en Etapa 1** (punto 2 del pedido de Christian): `CHECKBOX`, `SELECCION_MULTIPLE`, `NUMERO`, `TEXTO`, `TEXTO_LARGO`. El `CHECKBOX` reusa el patrón Cumple/No cumple/N.A. ya validado en el mockup; no es un booleano simple.
- **Selección de obra**: vive en `RespuestaFormulario`, no en `Formulario` — un formulario es una plantilla reutilizable en cualquier obra; quien la selecciona es quien la responde, no quien la crea. (`Formulario.requiereObra` existe por si en el futuro se necesita un formulario que no dependa de obra — hoy siempre es `true`.)
- **Registro fotográfico**: es una capacidad por pregunta (`Pregunta.permiteFoto`), no un tipo de respuesta aparte — una pregunta `CHECKBOX` puede o no pedir foto, igual que una `TEXTO`. Además, si `permiteFoto`, la foto puede marcarse como **obligatoria** (`fotoObligatoria`, 13-10-2026): en ese caso la respuesta no se podrá guardar sin imagen. `fotoObligatoria` solo tiene efecto cuando `permiteFoto = true` (se fuerza a false en el backend si no). La **validación al responder** (rechazar la respuesta si falta la foto obligatoria) vive en el **motor de llenado**, que está diferido a la vista de Registros (ver estado de implementación) — hoy solo se persiste la configuración de la plantilla.
- **Permisos por nivel de Área** (confirmado con Christian 06-10-2026 — el Perfil es dinámico y su nivel por Área gobierna esto):
  - **TOTAL**: crear, editar y eliminar plantillas (Formulario/Pregunta) y categorías del área, además de ver y completar/responder.
  - **LECTURA**: ver **y completar/responder** formularios del área — NO crea ni elimina plantillas.
  - **SIN_ACCESO**: la sección del área no aparece.
  > Esto **actualiza** la redacción previa de este §6 ("con TOTAL lo responde"): responder/completar es nivel **LECTURA**, no TOTAL — un trabajador de terreno debe poder llenar el checklist. TOTAL se reserva para administrar la plantilla.
- El default de acceso a un formulario es el nivel de Área del usuario. `FormularioPermiso` es **solo para ampliar** — da acceso extra a alguien que por su área no lo tendría. Confirmado con Christian (04-10-2026): no existe el caso de negar/restringir; el nivel de área nunca se le quita a nadie vía `FormularioPermiso`. Una fila siempre otorga (`puedeVer`/`puedeEditar` describen cuánto acceso adicional, nunca una resta).
- Una plantilla con respuestas ya registradas no se puede eliminar — solo desactivar (`activo = false`); las respuestas existentes quedan intactas.

## 7. Validaciones

- Toda `Pregunta` con `tipoRespuesta = SELECCION_MULTIPLE` debe tener al menos 2 `opciones`.
- Una `RespuestaPregunta` de una pregunta `obligatoria = true` no puede guardarse vacía (según su tipo: `valorTexto`/`valorNumero`/`valorCheckbox`/`valorSeleccionMultiple` no nulo).
- No se puede responder un `Formulario` con `activo = false`.

## 8. Estados

`Formulario.activo`: true/false. `RespuestaFormulario` no tiene ciclo de estados propio — hereda el de su área (Prevención: sin corrección, se guarda y queda; Técnica: puede quedar "por resolver" — ver `tecnica.md`, pendiente de spec).

## 9. Integraciones

- Fotos: mismo storage que usa Análisis IA para las imágenes de inspección (a definir — S3-compatible o disco local con backup, pendiente de decisión de infraestructura).
- Reportes: toda `RespuestaFormulario` es fuente de un PDF en el módulo `reportes` (pendiente de spec).

## 10. Pendientes

- [ ] Confirmar si además de los 5 tipos listados por Christian hace falta `FECHA` o `FIRMA` como tipo de respuesta propio (el mockup EPP ya usa "firma realizó/revisó" como campo — hoy no tiene tipo dedicado).
- [ ] Definir dónde se guardan las fotos (storage) y el límite de tamaño/cantidad por pregunta.
- [x] Definir si una `CategoriaFormulario` se puede crear al vuelo desde el mismo formulario de creación — **confirmado 04-10-2026: sí, 100% dinámico**, sin lista cerrada ni mantenedor aparte previo (ver `00-mantenedores-requeridos.md`).
- [x] Confirmar la nota de §6 sobre `FormularioPermiso` negando acceso explícito — **confirmado 04-10-2026: solo ampliar**, nunca negar (ver nota en §6).

### Estado de implementación (12-10-2026)

**Implementado:** el **constructor de plantillas** (CRUD de `Formulario` + `Pregunta`) — módulo `nucleo/formularios` con autorización por área (TOTAL para administrar, LECTURA para ver, dinámica en el service como Categorías), picker transversal `/formularios/opciones` (gateado `PROCEDIMIENTOS:LECTURA`), y UI `/formularios` + `/formularios/nuevo` + `/formularios/[id]` con `components/modules/formulario-builder.tsx`. La **categoría se crea al vuelo** desde el builder (QA-FD-004, §10) — el botón inline "Nueva categoría" se ofrece **solo** a quien tiene la función Categorías del área (`PREV_CAT_CATEGORIAS`/`TEC_CAT_CATEGORIAS` TOTAL, o `esAdmin`); quien no, elige una existente (evita un 403 a mitad del alta). El builder lista las categorías vía un **picker dedicado** `GET /categorias-formulario/opciones?areaId=` (activas, proyección mínima), accesible por la función **Categorías O Formularios** del área — así un admin de Formularios sin la función Categorías igual puede elegir una categoría existente (QA-FD-004 ronda 3). Carga las primeras 100 sin búsqueda — límite **aceptado para Etapa 1** (las categorías por área son una decena). Alta: la plantilla **nace activa** y `requiereObra=true` (no configurables en el alta — §5.1/§6, QA-FD-006/007). Editar preguntas se bloquea si el formulario ya tiene respuestas (`tieneRespuestas` en el detalle); en ese caso solo se edita metadata/estado (QA-FD-003).

**Diferido (acordado con Christian 12-10-2026):**
- **Motor de LLENADO** (responder formularios → `RespuestaFormulario`/`RespuestaPregunta`, fotos, validaciones de respuesta §7, histórico) — va con la **vista operativa de Registros** (spec aparte). Hasta entonces el módulo solo administra plantillas (QA-FD-001).
- **`FormularioPermiso`** (ampliar acceso por usuario, §4/§5.3): **2ª ola**. Hoy el acceso se rige solo por el nivel de Área; nadie queda bloqueado porque aún no hay forma de crear esas filas (QA-FD-002).
