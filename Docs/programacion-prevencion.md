# programacion-prevencion.md — Programación de Prevención (Calendario)

> Estado: **v0.1 (27-10-2026)** — Ola 1 (calendario de agendamiento) implementada.
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

## 2. Actores

- **Programador** (`PREV_PROGRAMACION = TOTAL` o `esAdmin`): crea/edita/elimina
  agendamientos. Típicamente Administrador o Jefe Prevencionista.
- **Lector** (`PREV_PROGRAMACION = LECTURA`): ve el calendario (p. ej. el
  prevencionista consulta lo que le toca).
- **Prevencionista de la obra**: el titular `ObraTitular (rolObra = PREVENCIONISTA)`;
  es el responsable implícito de los formularios agendados (snapshot al crear).

## 3. Glosario

- **Día de programación / agendamiento**: registro `ProgramacionPrevencion` único por
  `(obra, fecha)` entre los vivos. Agrupa N formularios + 1 comentario.
- **Formulario programado**: línea `FormularioProgramado` (un formulario dentro de un
  día).
- **Vencido**: derivado, no persistido — `fecha < hoy` (día pasado en el calendario).

## 4. Modelo de datos

`ProgramacionPrevencion` (cabecera por día):
`id`, `obraId→Obra`, `fecha @db.Date`, `comentario String?`, `usuarioId String?→Usuario`
(snapshot del titular PREVENCIONISTA al crear; `null` si la obra no tiene titular),
`formularios FormularioProgramado[]`, auditoría completa + soft delete.

`FormularioProgramado` (línea): `id`, `programacionId→ProgramacionPrevencion`,
`formularioId→Formulario`, `orden Int`, `creadoEn/creadoPor`, `eliminadoEn/eliminadoPor`.

Índices únicos **parciales** (`WHERE "eliminadoEn" IS NULL`):
`ProgramacionPrevencion (obraId, fecha)` y `FormularioProgramado (programacionId, formularioId)`.

Migración: `20261027000000_programacion_prevencion`.

## 5. Flujos

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
- **Fecha fija** por agendamiento (sin ventana desde–hasta).
- **Un día por (obra, fecha)**; un formulario no se duplica en el mismo día.
- **No programar ni editar fechas pasadas** (`hoy` en `America/Santiago`, igual que la
  vigencia de procedimientos). Meses/días pasados: solo lectura.
- El **responsable** es el prevencionista titular de la obra; se toma snapshot al
  crear y **no se reasigna** automáticamente si luego cambia el titular.
- Obra inexistente/eliminada → 404 (lock `FOR UPDATE` al crear).

## 7. Validaciones (Zod + negocio)

- `fecha`: formato `YYYY-MM-DD`, existente, no anterior a hoy.
- `formularioIds`: array no vacío de enteros positivos, deduplicado; cada id debe ser
  un formulario de Prevención activo (si no → 409 nombrando el id).
- `comentario`: string 1–2000 o `null`.
- `obraId/anio/mes`: enteros válidos (`mes` 1–12).

## 8. Estados

- El día no tiene máquina de estados. La línea tampoco en esta ola.
- `vencido` es **derivado** al leer (sin cron).

## 9. Integraciones

- **Permisos**: función `PREV_PROGRAMACION` (área PREVENCION), guards
  `requirePermiso('PREV_PROGRAMACION', 'LECTURA'|'TOTAL')`. Sidebar: entrada
  "Programación Prev." en sección Registro, gateada por la función.
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
