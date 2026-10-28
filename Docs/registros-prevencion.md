# registros-prevencion.md — Registro de Prevención (llenado de formularios)

> Estado: **v0.1 (27-10-2026)** — Ola 1 implementada (llenado + fotos en BD + cierre).
> Autoritativo sobre modelos, rutas y permisos de este módulo (CLAUDE.md §11).

---

## 1. Propósito

Permitir **llenar** los formularios de Prevención **agendados en el calendario**
(`FormularioProgramado`). Cada formulario agendado en una fecha es un **registro** a
completar. El usuario ve los registros de una obra con su **estado por fecha**, los
llena (guardado parcial, con fotos por pregunta en la BD) y los **cierra** indicando
la **fecha de revisión**. Esto concreta el motor de respuestas que estaba diferido
(`formularios-dinamicos.md` FD-001).

## 2. Actores

- **Registrador** (`PREV_REGISTROS = TOTAL` o `esAdmin`): llena, sube fotos y cierra.
- **Lector** (`PREV_REGISTROS = LECTURA`): ve registros, detalle y PDF.

## 3. Glosario

- **Registro**: un `FormularioProgramado` (formulario + fecha + obra, del calendario).
- **Respuesta** (`RespuestaFormulario`): el llenado del registro, `BORRADOR` o `CERRADO`,
  único por registro (`formularioProgramadoId @unique`).
- **Estados derivados** (hoy en `America/Santiago`): **Por aplicar** (fecha futura, no
  cerrado), **Vigente** (fecha = hoy), **Atrasado** (fecha pasada), **Completado** (cerrado).

## 4. Modelo de datos

- `RespuestaFormulario` (ampliado): `formularioProgramadoId @unique` → FormularioProgramado,
  `estado EstadoRespuesta {BORRADOR, CERRADO}`, `fechaRevision DateTime?`, `actualizadoEn/Por`.
  Conserva obra/usuario/formulario/fechaHora.
- `RespuestaPregunta`: `@@unique([respuestaFormularioId, preguntaId])`; valores por tipo
  (texto/numero/checkbox/selección múltiple). Se quitó `fotoUrl`.
- `RespuestaPreguntaFoto` + `RespuestaPreguntaFotoData` (bytea): fotos **siempre en la BD**,
  binario en tabla separada (patrón técnica/prevención). Optimizadas con `jimp`.
- Migración `20261027010000_registros_prevencion`.

## 5. Flujos

1. **Listar**: `GET /registros?obraId&estado&page&limit` → registros de la obra con estado
   derivado + `enProgreso` (borrador con datos).
2. **Detalle**: `GET /registros/:id` → preguntas del formulario + respuestas actuales + fotos.
3. **Guardar parcial**: `PUT /registros/:id/respuestas` (upsert por pregunta; no exige completar).
4. **Fotos**: `POST /registros/:id/preguntas/:preguntaId/fotos` (multipart, en BD),
   `GET /registros/fotos/:fotoId`, `DELETE /registros/fotos/:fotoId`.
5. **Cerrar**: `POST /registros/:id/cerrar` `{ fechaRevision }` → valida y marca CERRADO.
6. **PDF**: `GET /registros/:id/reporte.pdf` (solo cerrados).

## 6. Reglas de negocio

- **Guardado parcial** permitido en cualquier pendiente; **no editable** si está CERRADO.
- **Cerrar** exige: todas las preguntas **obligatorias** respondidas (según su tipo) y, si
  la pregunta tiene `fotoObligatoria`, **≥1 foto**.
- **No se cierra antes de la fecha de aplicación** (fecha ≤ hoy). `fechaRevision` **no futura**.
- Al cerrar, el registro queda ligado a su `FormularioProgramado` → el calendario lo refleja
  como cumplido (derivable por el enlace).
- **CHECKBOX = Cumple / No cumple / N.A.** (valores canónicos `CUMPLE | NO_CUMPLE | N_A`,
  `formularios-dinamicos.md §4/§6`), NO booleano; el backend valida el valor.
- **Formulario desactivado** (`activo = false`): no admite guardar/cerrar/subir foto
  (`formularios-dinamicos.md §7`).
- "Respondida" por tipo: CHECKBOX = uno de los 3 valores; SELECCIÓN MÚLTIPLE = ≥1 opción
  (cada opción debe pertenecer a la pregunta); NÚMERO = valor presente; TEXTO/TEXTO_LARGO =
  texto no vacío.
- Al **cerrar**, `usuarioId` pasa a ser quien cierra ("Completado por" del PDF); el creador
  del borrador queda en `creadoPor`.
- Obra inexistente/eliminada → 404; registro de obra/día eliminado → 404.
- **Histórico protegido** (QA-RP-009): desde el Calendario no se puede quitar un formulario
  ni eliminar un día si tiene un registro **CERRADO** (preserva el respaldo/PDF).
- Concurrencia: lock `FOR UPDATE` del registro al guardar/cerrar/fotos.

## 7. Validaciones (Zod + negocio)

- `obraId/estado/page/limit` en el listado; `estado` ∈ {POR_APLICAR, VIGENTE, ATRASADO, COMPLETADO}.
- `respuestas[]`: valores opcionales (guardado parcial); el service toma solo el campo del tipo.
- `fechaRevision`: `YYYY-MM-DD` existente, ≤ hoy.
- Imagen: tamaño ≤ `IMAGEN_MAX_MB`, imagen válida; calidad opcional (default config).

## 8. Estados

- Respuesta: `BORRADOR` → `CERRADO` (sin reapertura en esta ola).
- Estado del registro: derivado (no persistido) salvo `COMPLETADO` (= respuesta CERRADA).

## 9. Integraciones

- **Permiso**: función `PREV_REGISTROS` (área PREVENCION); guards LECTURA/TOTAL. Sidebar
  "Registro Prevención" en sección Registro.
- **Calendario** (`programacion-prevencion.md`): el registro ES un `FormularioProgramado`.
- **Formularios** (`formularios-dinamicos.md`): preguntas y tipos de respuesta; concreta FD-001.
- **Imagen/PDF**: `shared/imagen.ts` (jimp), `shared/pdf.ts` (Playwright), config de calidad.

## 10. Pendientes (olas siguientes)

1. **Reapertura** de un registro cerrado (hoy irreversible).
2. **Semántica de CHECKBOX obligatorio** (hoy "respondida" = marcada); revisar si aplica
   una confirmación explícita.
3. **Notificaciones** al cerrar / vencer (módulo `alertas`, requiere scheduler).
4. **Vista de cumplimiento en el calendario** (badge "cumplido") y agenda cross-obra.
