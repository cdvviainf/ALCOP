# programacion-prevencion.md — Programación de Prevención (Calendario)

> Estado: **v0.2 (09-11-2026)** — el calendario agenda formularios de **Prevención o de
> Técnica** (decisión de Christian, 09-11-2026). v0.1 (27-10-2026): Ola 1 solo Prevención.
> Autoritativo sobre modelos, rutas y permisos de este módulo (CLAUDE.md §11).

---

## 1. Propósito

Dar a cada **obra** un **calendario mensual** donde se **agenda la aplicación de
formularios de Prevención** en fechas concretas, a cargo del **prevencionista de la
obra**. Este calendario **es** el mecanismo por el cual un formulario de Prevención
se aplica a una obra (no se deriva de la cadena lotes→procedimientos; esa cadena es
de Técnica/trazabilidad documental).

Flujo operativo: el responsable abre la obra, ve el **mes en curso**, pincha una
**fecha** y asigna **uno o más formularios** + un **comentario**. Puede navegar a
meses anteriores (solo lectura) y futuros (programables). **No se permite programar
ni editar fechas anteriores a hoy.**

### 1.1 Programación Técnica (v0.2)

Al pinchar una fecha, la ventana permite elegir el **tipo de programación**
(Prevención o Técnica) y filtra los formularios del área elegida. En **Técnica** cada
formulario agendado tiene **fecha de inicio y fecha de término** (por defecto, ambas =
la fecha elegida en el calendario) y el calendario **marca ambas fechas** (▶ inicio,
■ término; si coinciden, una sola marca). El responsable snapshot de Técnica es el
titular `JEFE_DE_TERRENO` de la obra.

## 2. Actores

- **Programador** (`PREV_PROGRAMACION = TOTAL` o `esAdmin`): crea/edita/elimina
  agendamientos. Típicamente Administrador o Jefe Prevencionista.
- **Lector** (`PREV_PROGRAMACION = LECTURA`): ve el calendario (p. ej. el
  prevencionista consulta lo que le toca).
- **Programador/Lector técnico**: igual, con la función `TEC_PROGRAMACION` (área
  Técnica). Los perfiles existentes la reciben en `SIN_ACCESO`; se habilita desde Perfiles.
- **Jefe de terreno de la obra** (`ObraTitular rolObra = JEFE_DE_TERRENO`): responsable
  snapshot de las programaciones técnicas.
- **Prevencionista de la obra**: el titular `ObraTitular (rolObra = PREVENCIONISTA)`;
  es el responsable implícito de los formularios agendados (snapshot al crear).

## 3. Glosario

- **Día de programación / agendamiento**: registro `ProgramacionPrevencion` único por
  `(obra, fecha, area)` entre los vivos (una fecha puede tener un día de Prevención y
  otro de Técnica). Agrupa N formularios + 1 comentario.
- **Formulario programado**: línea `FormularioProgramado` (un formulario dentro de un
  día).
- **Ventana (Técnica)**: `fechaInicio`–`fechaTermino` de un formulario técnico agendado.
- **Vencido**: derivado, no persistido — `fecha < hoy` (día pasado en el calendario).

## 4. Modelo de datos

`ProgramacionPrevencion` (cabecera por día; el nombre se conserva por compatibilidad):
`id`, `obraId→Obra`, `area AreaProgramacion (PREVENCION|TECNICA, default PREVENCION)`, `fecha @db.Date`, `comentario String?`, `usuarioId String?→Usuario`
(snapshot del titular del área al crear — PREVENCIONISTA o JEFE_DE_TERRENO; `null` si no hay),
`formularios FormularioProgramado[]`, auditoría completa + soft delete.

`FormularioProgramado` (línea): `id`, `programacionId→ProgramacionPrevencion`,
`formularioId→Formulario`, `orden Int`, `fechaInicio/fechaTermino @db.Date?` (solo
Técnica; obligatorias ahí, `null` en Prevención; CHECK término ≥ inicio),
`creadoEn/creadoPor`, `eliminadoEn/eliminadoPor`.

Índices únicos **parciales** (`WHERE "eliminadoEn" IS NULL`):
`ProgramacionPrevencion (obraId, fecha, area)` y `FormularioProgramado (programacionId, formularioId)`.

Migraciones: `20261027000000_programacion_prevencion`, `20261109000000_programacion_tecnica`
(enum + `area` + ventana; los días existentes quedan como PREVENCION).

## 5. Flujos

El mismo módulo se monta dos veces: **`/api/prevencion/programacion`** (area
PREVENCION, función `PREV_PROGRAMACION`) y **`/api/tecnica/programacion`** (area
TECNICA, función `TEC_PROGRAMACION`). Toda operación por id está acotada al área (un id
de la otra área → 404). Diferencias de Técnica:

- `POST /programacion` y `POST /programacion/:id/formularios` reciben
  `formularios: [{ formularioId, fechaInicio?, fechaTermino? }]` (por defecto inicio =
  fecha del día y término = inicio). Prevención sigue recibiendo `formularioIds`.
- `PATCH /programacion/:id/formularios/:fpId { fechaInicio, fechaTermino }` cambia la
  ventana (solo Técnica; en Prevención → 409).
- `GET /programacion?obraId&anio&mes` incluye además los días cuyos formularios
  **inician o terminan** en el mes, aunque el día agendado sea de otro mes.

Front: pantalla única **`/programacion`** (menú "Calendario", visible con cualquiera de
las dos funciones). La ventana del día ofrece el selector de tipo solo con las áreas
que el usuario puede ver.

1. **Ver calendario**: `GET /programacion?obraId&anio&mes` → días del mes con sus
   formularios. El front pinta la grilla Lun→Dom; cada día muestra el nº de
   formularios; días pasados atenuados; hoy resaltado.
2. **Agendar (día nuevo)**: pinchar fecha ≥ hoy → modal → elegir formularios +
   comentario → `POST /programacion`. Resuelve el titular PREVENCIONISTA como snapshot.
3. **Editar (día existente)**: `PATCH /programacion/:id` (comentario),
   `POST /programacion/:id/formularios` (anexar, ignora duplicados),
   `DELETE /programacion/:id/formularios/:fpId` (quitar línea),
   `DELETE /programacion/:id` (eliminar día, soft delete en cascada lógica).
4. **Picker de formularios**: `GET /programacion/formularios-opciones?q=` → formularios
   de Prevención activos (self-contained a esta función; no exige PREV_FORMULARIOS).

## 6. Reglas de negocio

- Formularios agendables = **todos los de área PREVENCION activos** (decisión de
  Christian, 27-10-2026). Sin filtro por aplicabilidad de lotes.
- **Prevención: fecha fija** por agendamiento (sin ventana desde–hasta).
- **Técnica: ventana por formulario**: inicio ≥ hoy y término ≥ inicio; por defecto
  ambas = fecha elegida. El día sigue editable solo si su fecha no pasó.
- Formularios agendables en Técnica = **todos los del área TECNICA activos** (mismo
  criterio que Prevención).
- Registro Prevención considera **solo** los días de área PREVENCION.
- **Un día por (obra, fecha)**; un formulario no se duplica en el mismo día.
- **No programar ni editar fechas pasadas** (`hoy` en `America/Santiago`, igual que la
  vigencia de procedimientos). Meses/días pasados: solo lectura.
- El **responsable** es el prevencionista titular de la obra; se toma snapshot al
  crear y **no se reasigna** automáticamente si luego cambia el titular.
- Obra inexistente/eliminada → 404 (lock `FOR UPDATE` al crear).

## 7. Validaciones (Zod + negocio)

- `fecha`: formato `YYYY-MM-DD`, existente, no anterior a hoy.
- `formularioIds` (Prevención): array no vacío de enteros positivos, deduplicado.
  `formularios` (Técnica): array no vacío, sin ids repetidos, fechas `YYYY-MM-DD`
  válidas, término ≥ inicio (422); inicio < hoy → 409. Cada id debe ser un formulario
  activo del área (si no → 409 nombrando el id).
- `comentario`: string 1–2000 o `null`.
- `obraId/anio/mes`: enteros válidos (`mes` 1–12).

## 8. Estados

- El día no tiene máquina de estados. La línea tampoco en esta ola.
- `vencido` es **derivado** al leer (sin cron).

## 9. Integraciones

- **Permisos**: funciones `PREV_PROGRAMACION` (área PREVENCION) y `TEC_PROGRAMACION`
  (área TECNICA), guards `requirePermiso(<función del área>, 'LECTURA'|'TOTAL')`.
  Sidebar: "Calendario" (Configuración) → `/programacion`, visible con cualquiera.
- **Obras**: titular PREVENCIONISTA (`ObraTitular`) como responsable snapshot.
- **Formularios**: `Formulario` (área PREVENCION) como catálogo agendable.

## 10. Pendientes (olas siguientes)

1. **Cumplimiento**: enlazar un agendamiento con el registro que lo cumple
   (`RespuestaFormulario`) y marcar PENDIENTE→CUMPLIDO. Depende del **motor de
   respuestas** (hoy diferido). Hasta entonces el calendario es solo planificación;
   no se persiste estado de cumplimiento (se evitó dejar columnas muertas).
2. **Notificaciones**: avisar al prevencionista al publicar y recordatorios X días
   antes de la fecha → módulo `alertas` (stub) + requiere scheduler (la API no tiene
   cron aún).
3. **Agenda del prevencionista** (`mi-agenda` cross-obra) y **reporte PDF** del mes.
4. **Reasignación**: política si cambia el titular PREVENCIONISTA a mitad de mes.
5. **Selector de obra limitado a 100** (QA-PP-007, no bloqueante): el selector carga
   `nucleo/obras?limit=100` sin búsqueda/paginación, igual que todos los selectores de
   obra del sistema. Se adopta el mismo criterio ya aceptado para Etapa 1 en
   `lotes-procedimientos.md §…` (operación dimensionada en ~6 obras). Si el alcance
   cambia, migrar a un combobox con búsqueda/paginación remota (transversal a toda la app).
6. **Técnica ↔ Registro Técnica**: enlazar el formulario técnico agendado con el
   registro que lo llena (hoy Registro Técnica es aplicación directa; el calendario
   técnico es solo planificación) y su estado dentro de la ventana (por aplicar /
   en curso / atrasado).
