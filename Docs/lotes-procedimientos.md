# lotes-procedimientos.md — ALCOP

> Estado: **spec cerrado para Etapa 1 (v0.1)** — Q&A con Christian 12-10-2026. Define la cadena de trazabilidad Obra → Lotes → Procedimientos → Formularios de control. Pendientes al final.
> Vive en el **Núcleo compartido** — configura qué formularios de control aplican a cada obra, derivándolo de la composición de lotes de la obra.

## 1. Propósito

Hoy un `Formulario` (checklist) es una plantilla suelta: cualquiera se puede responder contra cualquier obra, sin un criterio que diga *qué* formularios corresponden a *qué* obra. Este spec introduce la cadena que lo determina:

```
Obra ──(cantidad)──▶ TipoLote ──(1..N)──▶ Procedimiento ──(1..N)──▶ Formulario de control
     configuración        maestro              maestro PDF            (formularios-dinamicos.md)
```

- Una **Obra** se compone de **lotes** con una cantidad por tipo (ej. `90 Casa + 1 Portería + 1 Plaza + 1 Vía de acceso`).
- Cada **TipoLote** (maestro) tiene asociados uno o más **Procedimientos** constructivos.
- Cada **Procedimiento** (maestro, PDF normativo de construcción) apunta a uno o más **Formularios de control**.

Con esto el sistema **deriva automáticamente** los procedimientos aplicables y los formularios de control que deben llenarse para una obra, recorriendo `Obra → sus TipoLote → sus Procedimientos → sus Formularios`. Ese conjunto derivado es el esqueleto que después consumen los módulos de visitas de Prevención/Técnica.

## 2. Actores

- **Administrador** (`esAdmin`) / usuario con `TOTAL` en las funciones correspondientes: administra los maestros `TipoLote` y `Procedimiento`, y configura los lotes de cada obra.
- Usuario con `LECTURA` en esas funciones: ve los maestros y la composición de lotes, no los edita.
- Usuarios de terreno: consumen (a futuro) la lista de formularios aplicables por obra.

## 3. Glosario

- **TipoLote**: categoría de unidad que compone una obra (Casa, Departamento, Bodega, Estacionamiento, Portería, Plaza, Vía de acceso, Oficina, …). Maestro 100% dinámico, sin lista cerrada.
- **Procedimiento (constructivo)**: documento normativo de construcción (PDF) con código, nombre y vigencia. Apunta a uno o más formularios de control que verifican su cumplimiento.
- **Formulario de control**: un `Formulario` del motor dinámico (`formularios-dinamicos.md`) usado para controlar un procedimiento. No es un tipo nuevo — es el mismo `Formulario`.
- **Lote de obra (`ObraLote`)**: la cantidad de un `TipoLote` que compone una obra concreta. Agregado por tipo (no se enumeran unidades individuales en Etapa 1).
- **Formularios aplicables**: conjunto derivado (no almacenado) de formularios de control que corresponden a una obra, resultado de recorrer la cadena.

## 4. Modelo de datos

```prisma
model TipoLote {
  id           Int       @id @default(autoincrement())
  codigo       String    @unique // slug del nombre, único (validado en la app)
  nombre       String
  orden        Int       @default(0)
  activo       Boolean   @default(true)
  procedimientos TipoLoteProcedimiento[]
  obras        ObraLote[]
  // Auditoría + soft delete (convención canónica, nucleo-compartido.md §6):
  creadoEn     DateTime  @default(now())
  creadoPor    String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn  DateTime?
  eliminadoPor String?
}

model Procedimiento {
  id            Int       @id @default(autoincrement())
  codigo        String    @unique // identificador del procedimiento, obligatorio y único
  nombre        String
  vigenciaDesde DateTime              // fecha desde la que rige el documento
  vigenciaHasta DateTime?             // null = vigente indefinido
  activo        Boolean   @default(true)
  archivo       ProcedimientoArchivo? // PDF adjunto (bytes en BD, tabla separada)
  tiposLote     TipoLoteProcedimiento[]
  formularios   ProcedimientoFormulario[]
  creadoEn      DateTime  @default(now())
  creadoPor     String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn   DateTime?
  eliminadoPor  String?
}

// Puente M:N  TipoLote ↔ Procedimiento.
model TipoLoteProcedimiento {
  id             Int      @id @default(autoincrement())
  tipoLoteId     Int
  tipoLote       TipoLote @relation(fields: [tipoLoteId], references: [id])
  procedimientoId Int
  procedimiento  Procedimiento @relation(fields: [procedimientoId], references: [id])
  creadoEn       DateTime @default(now())
  creadoPor      String?

  @@unique([tipoLoteId, procedimientoId])
}

// Puente M:N  Procedimiento ↔ Formulario de control.
model ProcedimientoFormulario {
  id             Int      @id @default(autoincrement())
  procedimientoId Int
  procedimiento  Procedimiento @relation(fields: [procedimientoId], references: [id])
  formularioId   Int
  formulario     Formulario @relation(fields: [formularioId], references: [id])
  creadoEn       DateTime @default(now())
  creadoPor      String?

  @@unique([procedimientoId, formularioId])
}

// Configuración de lotes de una obra — agregado (cantidad por tipo).
model ObraLote {
  id           Int       @id @default(autoincrement())
  obraId       Int
  obra         Obra      @relation(fields: [obraId], references: [id])
  tipoLoteId   Int
  tipoLote     TipoLote  @relation(fields: [tipoLoteId], references: [id])
  cantidad     Int                    // >= 1
  creadoEn     DateTime  @default(now())
  creadoPor    String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn  DateTime?
  eliminadoPor String?

  @@unique([obraId, tipoLoteId])
}
```

> Relaciones inversas a agregar en modelos existentes: `Obra.lotes ObraLote[]` y `Formulario.procedimientos ProcedimientoFormulario[]`.

### Decisiones cerradas (12-10-2026)

1. **Vigencia**: rango `vigenciaDesde` (obligatoria) + `vigenciaHasta` (opcional, null = sin término). El flag "vigente hoy" se deriva por fecha, no se almacena.
2. **PDF**: el binario se guarda **en la base de datos** (columna `Bytes`/`bytea`) en la tabla `ProcedimientoArchivo` (1:1 con `Procedimiento`), separada a propósito para no cargar el blob en listados/detalles (decisión de Christian, 12-10-2026 — reemplaza el disco local que se usaba antes). Ventajas: el backup de la BD incluye los PDFs y no hay volumen ni permisos de filesystem. Límite `PROCEDIMIENTO_PDF_MAX_MB` (20 MB), solo `application/pdf`. La descarga se sirve por `GET /procedimientos/:id/archivo` (streamea los bytes desde la BD).
3. **Lotes agregados**: `ObraLote.cantidad` por tipo, sin enumerar unidades individuales. Si las inspecciones terminan siendo por unidad (Casa-45), se evalúa un modelo de instancias al especificar las visitas — no en Etapa 1.
4. **Procedimiento sin área**: enlaza formularios de cualquier área (Prevención o Técnica).
5. **Permisos/menú**: dos funciones nuevas transversales (`TIPOS_LOTE`, `PROCEDIMIENTOS`); la composición de lotes de la obra se gobierna por la función existente `OBRAS`. **Ubicación en el menú (13-10-2026, decisión de Christian):** los ítems **Tipos de Lote** y **Lotes de Obra** se agrupan bajo **Datos Maestros → Técnicos** en el sidebar. Es una decisión de **organización/UX** del menú; NO cambia los permisos: `TIPOS_LOTE` sigue siendo transversal y la composición de lotes sigue gobernada por `OBRAS` (los guards del backend son los mismos). `Procedimientos` permanece como ítem de Configuración.

## 5. Flujos

1. **Maestro de tipos de lote** (función `TIPOS_LOTE`, nivel TOTAL): CRUD simple — nombre (código autoslug), orden, activo. En el detalle se asignan los procedimientos del tipo (M:N vía `TipoLoteProcedimiento`).
2. **Maestro de procedimientos** (función `PROCEDIMIENTOS`, nivel TOTAL): alta con código, nombre, vigenciaDesde/Hasta y **subida del PDF**; en el detalle se seleccionan uno o más formularios de control (M:N vía `ProcedimientoFormulario`).
3. **Configurar lotes de la obra** (función `OBRAS`, nivel TOTAL): en la pantalla **Lotes de Obra** (`/obras/lotes`), con **selector de obra** arriba y un bloque "Lotes" donde se agregan filas `TipoLote + cantidad`. Un tipo no se repite en la misma obra (`@@unique`). Se adopta el **mismo patrón que Permisos Obra / titulares** (`/obras/permisos`): el sistema no tiene (aún) una página de detalle `/obras/:id`, por lo que la configuración por obra se hace vía selector, no en un detalle. El selector carga las primeras 100 obras sin búsqueda — límite compartido y aceptado para Etapa 1 (ver OBR-009 en `nucleo-compartido.md §10`, operación ~6 obras); cuando exista `/obras/:id`, lotes y titulares se moverán ahí (decisión 12-10-2026, QA-LP-005).
4. **Derivar formularios aplicables**: `GET /api/nucleo/obras/:id/formularios-aplicables` recorre `ObraLote → TipoLote → TipoLoteProcedimiento → Procedimiento → ProcedimientoFormulario → Formulario` y devuelve la lista **deduplicada** de formularios (con los procedimientos y tipos de lote que los traen, para trazabilidad). No se almacena; se calcula al vuelo.

## 6. Reglas

- **Auditoría + soft delete para todo registro** (convención canónica): maestros y `ObraLote` llevan auditoría completa; las puentes llevan `creadoEn/creadoPor` (son relaciones, se borran duro al desvincular — ver abajo).
- **Código único**: `TipoLote.codigo` y `Procedimiento.codigo` únicos; slug del nombre en TipoLote, manual/obligatorio en Procedimiento.
- **Cantidad**: `ObraLote.cantidad >= 1` (validación dura front y back).
- **No borrar en uso (soft delete)**:
  - Un `TipoLote` usado en alguna `ObraLote` activa no se elimina; se desactiva (`activo = false`).
  - Un `Procedimiento` usado por algún `TipoLote` activo no se elimina; se desactiva.
  - Las desvinculaciones M:N (`TipoLoteProcedimiento`, `ProcedimientoFormulario`) son borrado físico de la fila puente — no son entidades de negocio, solo aristas.
- **Vigencia coherente**: si viene `vigenciaHasta`, no puede ser anterior a `vigenciaDesde` (validación dura front y back).
- **PDF obligatorio** al crear un procedimiento; reemplazable en edición. Solo PDF (`application/pdf`); límite de tamaño configurable (default 20 MB).
- **Derivación**: los formularios aplicables solo consideran filas activas en toda la cadena (TipoLote activo, Procedimiento activo, Formulario `activo = true`, sin `eliminadoEn`).
- **Autorización**:
  - `TipoLote` / `Procedimiento`: `requirePermiso(TIPOS_LOTE|PROCEDIMIENTOS, TOTAL)` para escribir, `LECTURA` para leer; `esAdmin` todo.
  - `ObraLote`: `requirePermiso(OBRAS, TOTAL)` para escribir (igual que administrar la obra).

## 7. Validaciones

- `TipoLote.nombre` obligatorio; `codigo` único (409 en colisión).
- `Procedimiento`: `codigo` único obligatorio; `nombre` obligatorio; `vigenciaDesde` obligatoria; `vigenciaHasta >= vigenciaDesde` si viene; `archivoUrl` presente tras subir el PDF.
- `ObraLote`: `tipoLoteId` existente y activo; `cantidad` entero `>= 1`; sin duplicar tipo en la obra (409).
- Puentes: no duplicar la misma arista (`@@unique`, 409/idempotente).

## 8. Estados

- `TipoLote.activo` y `Procedimiento.activo`: true/false (soft disable). No tienen máquina de estados.
- `ObraLote` no tiene estado propio; existe o no (soft delete).

## 9. Integraciones

- **Formularios dinámicos** (`formularios-dinamicos.md`): `ProcedimientoFormulario` referencia `Formulario`. El selector de formularios en el detalle del procedimiento lista formularios activos.
- **Obra** (`nucleo-compartido.md`): `ObraLote` cuelga de `Obra`; el bloque de lotes se configura en la pantalla con selector de obra `/obras/lotes`, mismo patrón que titulares en `/obras/permisos` (ver §5.3). Migrará al detalle `/obras/:id` cuando éste exista.
- **Visitas Prevención/Técnica** (pendientes de spec): consumirán `GET …/formularios-aplicables` para saber qué checklists corresponden a cada obra/lote.
- **Storage de archivos**: el PDF comparte la decisión de storage pendiente con las fotos de formularios/IA.

## 10. Pendientes

- [x] Storage del PDF: **en BD (bytea)** desde 12-10-2026 (ver decisión #2). Si a futuro los PDFs crecen mucho, evaluar mover a object storage (S3) junto con las fotos de formularios/IA.
- [ ] ¿Inspección por unidad individual de lote (Casa-45) o basta el agregado? — se resuelve al especificar visitas (prevencion.md/tecnica.md).
- [ ] ¿El `GET …/formularios-aplicables` debe también exponerse por tipo de lote dentro de la obra (checklist por lote) o solo el consolidado de la obra? — definir al construir visitas.
- [ ] Límite de tamaño/formato del PDF definitivo (hoy 20 MB, solo `application/pdf`).
- **Selectores y límite de 100 (QA-LP-009, 12-10-2026):** los pickers de relación (`VinculosManager`: procedimientos↔formularios y tipo-lote↔procedimientos) tienen **búsqueda** server-side (`?q`), por lo que alcanzan todo el catálogo. El **selector de tipo de lote** de la pantalla de lotes y el **selector de obra** cargan las primeras 100 filas sin búsqueda: límite **aceptado para Etapa 1** (tipos de lote y obras son catálogos acotados — decenas de filas); agregar búsqueda/combobox a esos dos selectores queda como mejora futura si la base crece.
- [ ] ¿Versionado de procedimientos (histórico de PDFs por vigencia) o basta reemplazar el archivo? — hoy se reemplaza; evaluar si ALCOP necesita histórico normativo.
