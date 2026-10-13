# tecnica.md — Visitas Técnicas (ALCOP)

> Estado: **spec cerrado para esta ola (v0.1)** — Q&A con Christian 13-10-2026. Cubre **Visitas Técnicas** = visita → hallazgos (lote + tipo + fotos + comentario) → reporte resumen. **Fuera de esta ola** (se especifican después): ciclo de corrección "por resolver", hitos de **nidos/puntales**, y **Análisis IA** (solo se deja el campo comentario y el hook del adaptador). No relacionado con Procedimientos/Formularios.
>
> **Implementación por olas (13-10-2026):**
> - **Ola A — Backend (en curso):** modelos + migración (+ backfill de unidades para ObraLote existentes), autogeneración de `LoteUnidad` en el CRUD de ObraLote (atómico), optimización de imagen (`sharp`), `Configuracion` (calidad por defecto) y el módulo `tecnica/visitas` (CRUD visita + hallazgos + subir/descargar/quitar fotos). Autorización por `TEC_INSPECCION`.
> - **Ola B — Reporte + Frontend (implementada, 13-10-2026):** **reporte HTML→PDF** `GET /visitas/:id/reporte.pdf` (Playwright, imágenes embebidas como data URI; `shared/pdf.ts` + `visitas.reporte.ts`). Frontend: lista de visitas + "Nueva visita", página de captura `/registro/inspeccion-tecnica/[id]` (agregar hallazgos con unidad+tipo+comentario, subir/quitar fotos con calidad, finalizar con resumen, exportar PDF), y `/configuracion/calidad-imagen` (admin). El menú "Visita Técnica" ya apunta al módulo. La pantalla del reporte se resolvió como **exportar PDF** desde el detalle (el detalle ya muestra todos los hallazgos agrupados); no se hizo una vista HTML de reporte aparte en pantalla.

## 1. Propósito

Un inspector (función Técnica) va a una obra, recorre **unidades de lote** (Casa 001, Caseta 001…) y registra **hallazgos**: por cada uno elige la unidad, el tipo de hallazgo, adjunta una o más **fotos** (optimizadas y guardadas en BD) y un comentario. Al terminar, el inspector escribe un resumen y **genera un reporte** de secciones fijas, visible en pantalla y exportable a PDF (HTML → PDF con Playwright).

## 2. Actores

- **Inspector técnico** (`TEC_INSPECCION` nivel TOTAL, o `esAdmin`): crea/edita visitas y hallazgos, sube fotos, finaliza y genera el reporte.
- **Lectura** (`TEC_INSPECCION` LECTURA): ve visitas y reportes; no edita.
- **Administrador del sistema** (`esAdmin`): además configura la **calidad de imagen por defecto**.

## 3. Glosario

- **Visita Técnica**: una inspección a una obra en una fecha, con hora de inicio/término, sus hallazgos y un resumen final.
- **Unidad de lote (`LoteUnidad`)**: unidad individual **autogenerada** desde la composición de la obra (`ObraLote`): para `90 Casas` se crean `Casa 001`…`Casa 090`. Es lo que se inspecciona.
- **Hallazgo técnico**: una observación dentro de una visita — unidad de lote + tipo de hallazgo + fotos + comentario.
- **Calidad de imagen**: nivel de compresión al subir una foto (Original / Optimizada / Media / Baja). El sistema sugiere un default configurable.
- **Reporte de visita**: documento de secciones fijas derivado de la visita (datos, lotes inspeccionados, hallazgos por tipo, resumen final). HTML en pantalla + exportable a PDF.

## 4. Modelo de datos

```prisma
enum EstadoVisita {
  EN_CURSO     // editable, se agregan hallazgos
  FINALIZADA   // cerrada; solo lectura; reporte disponible
}

enum CalidadImagen {
  ORIGINAL     // sin recomprimir (tope de seguridad ~4000px)
  OPTIMIZADA   // ~2000px, calidad 82  (default sugerido)
  MEDIA        // ~1280px, calidad 70
  BAJA         // ~800px,  calidad 55
}

// Unidad individual de lote, autogenerada desde ObraLote (decisión 13-10-2026).
model LoteUnidad {
  id          Int       @id @default(autoincrement())
  obraId      Int
  obra        Obra      @relation(fields: [obraId], references: [id])
  tipoLoteId  Int
  tipoLote    TipoLote  @relation(fields: [tipoLoteId], references: [id])
  correlativo Int                   // 1..cantidad
  descripcion String                // "Casa 001" (autogenerada: nombre del tipo + correlativo con padding)
  hallazgos   HallazgoTecnico[]
  creadoEn    DateTime  @default(now())
  eliminadoEn DateTime?

  @@unique([obraId, tipoLoteId, correlativo])
}

model VisitaTecnica {
  id             Int          @id @default(autoincrement())
  obraId         Int
  obra           Obra         @relation(fields: [obraId], references: [id])
  usuarioId      String       // inspector
  usuario        Usuario      @relation(fields: [usuarioId], references: [id])
  fecha          DateTime                 // día de la visita
  horaInicio     String?                  // "HH:MM"
  horaTermino    String?                  // "HH:MM"
  estado         EstadoVisita @default(EN_CURSO)
  resumenFinal   String?                  // texto digitado por el inspector al finalizar
  hallazgos      HallazgoTecnico[]
  // Auditoría + soft delete
  creadoEn       DateTime     @default(now())
  creadoPor      String?
  actualizadoEn  DateTime?    @updatedAt
  actualizadoPor String?
  eliminadoEn    DateTime?
  eliminadoPor   String?
}

model HallazgoTecnico {
  id              Int                 @id @default(autoincrement())
  visitaId        Int
  visita          VisitaTecnica       @relation(fields: [visitaId], references: [id])
  loteUnidadId    Int
  loteUnidad      LoteUnidad          @relation(fields: [loteUnidadId], references: [id])
  tipoHallazgoId  Int
  tipoHallazgo    TipoHallazgoTecnico @relation(fields: [tipoHallazgoId], references: [id])
  comentario      String?             // (futuro: autogenerado por IA desde la foto)
  orden           Int                 @default(0)
  fotos           HallazgoFoto[]
  creadoEn        DateTime            @default(now())
  eliminadoEn     DateTime?
}

// Metadata de la foto (sin el binario → no se arrastra en listados).
model HallazgoFoto {
  id          Int             @id @default(autoincrement())
  hallazgoId  Int
  hallazgo    HallazgoTecnico @relation(fields: [hallazgoId], references: [id])
  mimetype    String          // image/jpeg | image/webp
  calidad     CalidadImagen
  tamano      Int             // bytes tras optimizar
  ancho       Int?
  alto        Int?
  orden       Int             @default(0)
  data        HallazgoFotoData?
  creadoEn    DateTime        @default(now())
}

// Binario de la foto EN LA BASE DE DATOS (bytea), tabla separada (patrón PDF procedimientos).
model HallazgoFotoData {
  id      Int          @id @default(autoincrement())
  fotoId  Int          @unique
  foto    HallazgoFoto @relation(fields: [fotoId], references: [id])
  datos   Bytes
}

// Configuración del sistema (clave/valor). Primer uso: calidad de imagen por defecto.
model Configuracion {
  id    Int    @id @default(autoincrement())
  clave String @unique   // "calidad_imagen_default"
  valor String           // "OPTIMIZADA"
}
```

> Relaciones inversas a agregar: `Obra.loteUnidades`, `Obra.visitas`; `TipoLote.unidades`; `TipoHallazgoTecnico.hallazgos`; `Usuario.visitas`.

### Decisiones cerradas (13-10-2026)

1. **Lote = unidad individual autogenerada**: al configurar `ObraLote` (cantidad N de un tipo), el sistema genera N `LoteUnidad` con `descripcion = "<TipoLote.nombre> <correlativo>"` (correlativo con padding a 3, p. ej. `Casa 001`). El hallazgo referencia una `LoteUnidad`.
2. **Fotos en BD + optimización**: se guardan en BD (bytea) con `sharp`, una rendición por foto a la **calidad elegida al subir**. Presets: Original (tope ~4000px, sin recomprimir), Optimizada (~2000px/q82, **default sugerido**), Media (~1280px/q70), Baja (~800px/q55). El default sale de `Configuracion.calidad_imagen_default` y viene preseleccionado; el usuario puede cambiarlo por foto.
3. **Reporte HTML → PDF**: pantalla de reporte (secciones fijas) + exportar a PDF (Playwright renderiza el HTML). Imágenes embebidas como data URI en el PDF (self-contained).
4. **Alcance**: solo visita → hallazgos → reporte. Sin ciclo de corrección, sin nidos/puntales, sin IA (hook/campo listos para después).

## 5. Flujos

1. **Autogenerar unidades de lote**: al crear/editar `ObraLote` (módulo obras), se sincronizan las `LoteUnidad`:
   - cantidad sube de A→B: se crean las unidades `A+1..B`.
   - cantidad baja de A→B: se eliminan (soft) las unidades `>B` **que no tengan hallazgos**; si alguna con `>B` tiene hallazgos, se **rechaza** la reducción (409).
   - quitar el lote: elimina sus unidades si ninguna tiene hallazgos; si no, se rechaza.
2. **Crear visita** (`TEC_INSPECCION` TOTAL): obra + fecha + hora inicio/término → nace `EN_CURSO`. El inspector es el usuario de la sesión.
3. **Agregar hallazgo**: unidad de lote (de la obra de la visita) + tipo de hallazgo + comentario; sube 1..N fotos (cada una con su calidad; el backend la optimiza y guarda en BD).
4. **Finalizar visita**: el inspector escribe el `resumenFinal` y marca `FINALIZADA` → queda solo lectura.
5. **Reporte**: `GET /visitas/:id/reporte` (datos para pantalla) y `GET /visitas/:id/reporte.pdf` (HTML→PDF). Secciones fijas:
   - **Encabezado**: inspector (usuario), obra, fecha, hora inicio/término.
   - **Lotes inspeccionados**: unidades distintas con hallazgos en la visita.
   - **Hallazgos por tipo**: agrupados por `TipoHallazgoTecnico`, cada uno con unidad, comentario y fotos.
   - **Resumen final**: el texto digitado por el inspector.
6. **Configuración**: `esAdmin` consulta/cambia `calidad_imagen_default` (pantalla de Configuración).

## 6. Reglas

- **Autorización**: visitas/hallazgos/fotos → `requirePermiso('TEC_INSPECCION', 'LECTURA'|'TOTAL')`; `esAdmin` todo. Config de imagen: **cambiar** la calidad por defecto → `requireAdmin`; **consultarla** → cualquier usuario autenticado (para preselección al subir fotos — QA-OLA-B-001). Los selectores que alimenta el módulo (obras, tipos de hallazgo) son legibles por `TEC_INSPECCION` aunque sean de otra función (QA-OLA-B-005): el listado de obras lo lee cualquier autenticado (nucleo-compartido.md §95) y el de tipos de hallazgo se abre a `TEC_CAT_TIPOS_HALLAZGO | TEC_INSPECCION`.
- **Generación de unidades**: `descripcion` con padding a 3 (o al ancho de la cantidad si supera 999). Autogenerada; no editable a mano en esta ola.
- **Edición**: solo visitas `EN_CURSO` se editan (agregar/quitar hallazgos, subir/borrar fotos). `FINALIZADA` = solo lectura (el reporte sigue disponible).
- **Fotos**: solo imágenes (`image/*`); se optimizan con `sharp` según la calidad elegida; se guarda el binario en BD + metadata. Límite de tamaño de entrada configurable (default 25 MB antes de optimizar).
- **Borrado**: soft-delete de visita/hallazgo; el binario de fotos se borra en cascada lógica (al borrar el hallazgo, sus fotos quedan inaccesibles). No hay `DELETE` físico de la visita.
- **No bloquear por procedimientos**: este módulo no consulta Procedimientos/Formularios.

## 7. Validaciones

- Visita: `obraId` existente; `fecha` obligatoria; `horaTermino >= horaInicio` si ambas vienen; estado ∈ enum.
- Hallazgo: `loteUnidadId` pertenece a la **obra de la visita**; `tipoHallazgoId` activo; al menos el comentario **o** una foto (no vacío del todo — confirmar al construir si se exige foto).
- Foto: `mimetype` image/*; `calidad` ∈ enum; tamaño de entrada ≤ límite.
- Finalizar: la visita debe tener al menos un hallazgo (confirmar). `resumenFinal` recomendado (¿obligatorio al finalizar? — ver pendientes).

## 8. Estados

`VisitaTecnica.estado`: `EN_CURSO` (default) → `FINALIZADA`. Transición por "Finalizar". Sin reapertura en esta ola (pendiente si se necesita).

## 9. Integraciones

- **ObraLote / TipoLote** (lotes-procedimientos.md): origen de las `LoteUnidad`.
- **TipoHallazgoTecnico**: catálogo del tipo de hallazgo (ya existe).
- **Playwright**: motor HTML→PDF del reporte (ya en el stack; Chromium en el Dockerfile).
- **sharp**: optimización de imagen (nueva dependencia — verificar build Alpine/musl).
- **Análisis IA** (futuro): el `comentario` del hallazgo se autogenerará desde la foto vía el adaptador `analisis-ia.adapter.ts`.
- **Reportes/Alertas**: a futuro, el reporte de visita puede alimentar notificaciones por obra.

## 10. Pendientes

- [ ] ¿Un hallazgo exige al menos una foto, o basta comentario? (hoy: al menos uno de los dos).
- [ ] ¿`resumenFinal` obligatorio para finalizar? (hoy: recomendado).
- [ ] ¿Reapertura de visitas `FINALIZADA`?
- [ ] Búsqueda/paginación en el selector de unidad de lote (una obra puede tener cientos de unidades).
- [ ] Verificar `sharp` en el build Docker (Alpine/musl, `--ignore-scripts`); fallback `jimp` si falla.
- [ ] Prevención (Visita Prevención) reusando este motor con catálogo `NivelRiesgo` — ola aparte.
- [ ] Nidos/puntales (hitos) y ciclo de corrección — ola aparte.
