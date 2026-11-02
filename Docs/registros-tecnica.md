# registros-tecnica.md — Registro Técnico (llenado de formularios)

> Estado: **v0.1 (02-11-2026)**. Autoritativo sobre modelos, rutas y permisos de este módulo (CLAUDE.md §12.11).

## 1. Propósito

Aplicar los formularios del área Técnica (ej. checklists LCH-AT) **directamente sobre una obra**, sin calendario: seleccionar obra, seleccionar formulario y llenarlo igual que en Registro Prevención (`registros-prevencion.md`): guardado parcial, fotos por pregunta en la BD, cierre con fecha de revisión y PDF.

## 2. Actores

- **Registrador** (`TEC_REGISTROS = TOTAL` o `esAdmin`): aplica, llena, sube fotos y cierra.
- **Lector** (`TEC_REGISTROS = LECTURA`): ve registros, detalle y PDF.

## 3. Glosario

- **Registro técnico**: una `RespuestaFormulario` con `formularioProgramadoId = null` de un formulario del área Técnica.
- **Fecha de aplicación**: día (America/Santiago) de `fechaHora`, fijado al abrir el registro.
- **Estados**: **En progreso** (`BORRADOR`) y **Completado** (`CERRADO`). No hay por aplicar ni atrasado: no hay agenda.

## 4. Modelo de datos

Reutiliza `RespuestaFormulario`, `RespuestaPregunta` y `RespuestaPreguntaFoto(+Data)`, sin columnas nuevas. Migración `20261102000000_registros_tecnica`: índice único parcial `(obraId, formularioId) WHERE formularioProgramadoId IS NULL AND estado = 'BORRADOR'`.

## 5. Flujos (bajo `/api/tecnica`)

1. **Picker**: `GET /registros/formularios-opciones`.
2. **Aplicar**: `POST /registros { obraId, formularioId }` → 201 `{ id, reanudado: false }`, o 200 `{ id, reanudado: true }` si retoma el borrador abierto.
3. **Listar**: `GET /registros?obraId&estado&page&limit`, más recientes primero.
4. **Detalle**: `GET /registros/:id`.
5. **Guardar parcial**: `PUT /registros/:id/respuestas`.
6. **Fotos**: `POST /registros/:id/preguntas/:preguntaId/fotos`, `GET` y `DELETE /registros/fotos/:fotoId`.
7. **Cerrar**: `POST /registros/:id/cerrar { fechaRevision }`.
8. **PDF**: `GET /registros/:id/reporte.pdf` (solo cerrados).

## 6. Reglas de negocio

- Aplicables: formularios del área Técnica, activos, no eliminados y con ≥1 pregunta. Sin filtro por lotes ni procedimientos (mismo criterio que el calendario de Prevención).
- **Un solo borrador abierto por obra + formulario**: aplicar de nuevo lo retoma. Al cerrarlo, una nueva aplicación crea otro registro; los cerrados se acumulan como historial.
- Respuestas, tipos, CHECKBOX (Cumple/No cumple/N.A.), obligatorias, fotos, `fechaRevision ≤ hoy` y formulario desactivado: igual que `registros-prevencion.md §6`.
- Las rutas de Técnica no alcanzan registros agendados de Prevención, ni al revés.
- Abrir un registro cuenta como respuesta: bloquea editar las preguntas del formulario (`formularios-dinamicos.md`), igual que un borrador de Prevención.

## 7. Validaciones

Zod en query, params y body; imagen ≤ `IMAGEN_MAX_MB`. Obra inexistente o eliminada → 404. Formulario no aplicable → 409.

## 8. Estados

`BORRADOR` → `CERRADO`, sin reapertura.

## 9. Integraciones

- **Permiso**: función `TEC_REGISTROS` (área Técnica). Los perfiles existentes la reciben en `SIN_ACCESO`; se habilita desde Perfiles.
- **Sidebar**: "Registro Técnico" en la sección Registro → `/registro/tecnica`.

## 10. Pendientes

1. Asociar el registro a una unidad de lote (hoy solo obra + formulario).
2. Descartar un borrador abierto por error.
3. Reapertura de un registro cerrado.
