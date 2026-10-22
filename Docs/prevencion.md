# prevencion.md — Prevención: Visitas y Hallazgos (ALCOP)

> Estado: **spec cerrado v0.2 (22-10-2026)** — Q&A con Christian. Olas 1 y 2 implementadas y cerradas. Pendiente: Análisis IA (ola aparte) y, en Etapa 2, la georreferenciación GPS (ver §10). Implementación por olas.
> - **Ola 1 (implementada, 22-10-2026):** clasificación de hallazgos de prevención = **Categoría › Subcategoría** (mantenedores anidados) + `NivelRiesgo` (ya existía). Se reubicó la UI de Categorías a *Datos Maestros › Prevención* (`/prevencion/categorias`, `/prevencion/subcategorias`); dejó de colgar de rutas de formulario.
> - **Ola 2 (implementada, 22-10-2026):** módulo de **Visitas de Prevención** (visita → hallazgos → reporte PDF), calcado del de Visitas Técnicas (`tecnica.md`) con las diferencias de §5. Backend `prevencion/visitas/*` bajo `/api/prevencion` (permiso `PREV_INSPECCION`); modelos `VisitaPrevencion`/`HallazgoPrevencion` + fotos en BD; fotos en el **alta** del hallazgo (multipart, igual que técnica item 2; tope 10, calidad común al lote); frontend lista `/registro/inspeccion-prevencion` + captura `[id]`.
>
> Base comercial: `alcop-esquema.html` §06 (registro de hallazgos por riesgo, histórico sin apertura/cierre) y §07 (visitas con hallazgos + informe).

## 1. Propósito

Registrar en terreno los **hallazgos de prevención** de una obra dentro de una **visita**, clasificados por Categoría › Subcategoría y Nivel de Riesgo, con un plazo de solución, fotos y comentario; y emitir un reporte. A diferencia de Técnica, **no hay unidad de lote** ni ciclo de corrección (el hallazgo queda como registro histórico).

## 2. Actores

- **Inspector de prevención** (`PREV_INSPECCION` TOTAL, o `esAdmin`): crea visitas/hallazgos, finaliza, genera reporte.
- **Lectura** (`PREV_INSPECCION` LECTURA): ve visitas y reportes.
- **Administrador de catálogos** (`PREV_CAT_CATEGORIAS` TOTAL / `PREV_CAT_NIVEL_RIESGO` TOTAL, o `esAdmin`): administra Categorías, Subcategorías y Niveles de Riesgo.

## 3. Glosario

- **Categoría de prevención** (`CategoriaFormulario`, área PREVENCION): agrupación temática (EPP, Herramientas, Trabajos en Altura…). Catálogo dinámico. En Prevención clasifica hallazgos de visita.
- **Subcategoría** (`SubcategoriaFormulario`): nivel anidado bajo una Categoría; mismos campos; refina la clasificación (p. ej. EPP › Casco).
- **Nivel de Riesgo** (`NivelRiesgo`): severidad del hallazgo (Alto, Medio, Observación, No conformidad).
- **Plazo de solución**: tiempo estimado para subsanar el hallazgo, expresado en **días u horas** (informativo; no abre un ciclo de estado en Etapa 1).

## 4. Modelo de datos

### Ola 1 — clasificación (implementada)

```prisma
// Nivel anidado bajo CategoriaFormulario; hereda el Área de su categoría padre.
model SubcategoriaFormulario {
  id             Int                 @id @default(autoincrement())
  categoriaId    Int
  categoria      CategoriaFormulario @relation(fields: [categoriaId], references: [id])
  codigo         String   // slug del nombre; único por categoría entre las vivas
  nombre         String
  activo         Boolean  @default(true)
  // auditoría completa + soft delete (nucleo-compartido.md §6)
  creadoEn       DateTime @default(now())
  creadoPor      String?
  actualizadoEn  DateTime? @updatedAt
  actualizadoPor String?
  eliminadoEn    DateTime?
  eliminadoPor   String?
}
```

- **Unicidad:** `codigo` único por `categoriaId` **entre las no eliminadas** — garantizado por índice único **parcial** en PostgreSQL (`WHERE "eliminadoEn" IS NULL`), más chequeo en el service (mensaje amigable). El soft-delete conserva el `codigo` sin bloquear recrear.
- **Área:** la subcategoría no guarda `areaId`; lo hereda de la categoría padre.

### Ola 2 — visita/hallazgo (implementado, molde `tecnica.md`)

```prisma
enum PlazoUnidad { DIAS HORAS }

model VisitaPrevencion {
  id, obraId → Obra, usuarioId → Usuario, fecha, horaInicio?, horaTermino?,
  estado EstadoVisita @default(EN_CURSO), resumenFinal?,
  hallazgos HallazgoPrevencion[],
  // auditoría completa + soft delete
  creadoEn, creadoPor?, actualizadoEn? @updatedAt, actualizadoPor?, eliminadoEn?, eliminadoPor?
}

model HallazgoPrevencion {
  id, visitaId → VisitaPrevencion,
  categoriaId → CategoriaFormulario,          // categoría (Prevención)
  subcategoriaId → SubcategoriaFormulario,    // debe pertenecer a la categoría
  nivelRiesgoId → NivelRiesgo,
  plazoValor Int, plazoUnidad PlazoUnidad,    // tiempo de solución
  comentario String,                          // obligatorio
  orden Int, fotos HallazgoPrevencionFoto[],  // ≥1 foto (patrón *Foto/*FotoData en BD)
  creadoEn, eliminadoEn?
  // SIN loteUnidadId. SIN responsable (diferido, ver §10). Sin ciclo "por resolver".
}

// Fotos: metadata + binario en tablas separadas (bytea), igual que técnica.
model HallazgoPrevencionFoto { id, hallazgoId, mimetype, calidad CalidadImagen, tamano, ancho?, alto?, orden, data }
model HallazgoPrevencionFotoData { id, fotoId @unique, datos Bytes }
```

## 5. Flujos

1. **Administrar clasificación** (Ola 1): CRUD de Categorías y Subcategorías en *Datos Maestros › Prevención*; Subcategoría exige elegir la Categoría padre.
2. **Agregar hallazgo** (Ola 2): Categoría → Subcategoría → Nivel de Riesgo → **plazo (valor + días/horas)** → **imagen(es)** → comentario, en un solo paso (fotos incluidas en el alta, igual que `tecnica.md` tras 22-10-2026). El **responsable** del hallazgo está **diferido** (§10), no se registra en esta ola.
3. **Finalizar visita / reporte** (Ola 2): igual a Técnica (reporte HTML→PDF agrupado por Categoría).

## 6. Reglas

- **Autorización catálogos:** administrar Categorías/Subcategorías exige **TOTAL** en la función **`PREV_CAT_CATEGORIAS`** (reutilizada para ambos niveles); Niveles de Riesgo en `PREV_CAT_NIVEL_RIESGO`. Lectura/pickers: `≥ LECTURA` en esa función o en `PREV_INSPECCION` (el alta de hallazgos necesita leer la clasificación).
- **Baja de Categoría:** no se puede eliminar una categoría con **subcategorías activas** (ni con formularios); elimínalas primero (simétrico, QA-OKA-004).
- **Subcategoría bajo padre eliminado:** se trata como inexistente (las queries exigen `categoria.eliminadoEn IS NULL`).
- **Hallazgo (Ola 2):** comentario obligatorio + ≥1 foto (en el alta); sin lote; histórico sin reapertura. **Responsable diferido** (§10): no se captura ni persiste en esta ola. Auditoría completa + soft-delete en el hallazgo (creado/actualizado/eliminado + actor).
- **Fotos (hijos sin auditoría):** las fotos del hallazgo (`HallazgoPrevencionFoto`/`...FotoData`) son registros **hijos** del hallazgo; su borrado es **físico** (sin soft-delete ni auditoría), **igual que en Visitas Técnicas** (`tecnica.md §6`). La trazabilidad vive en el hallazgo padre (auditado y soft-deleted); al quitar una foto solo se elimina esa evidencia puntual mientras la visita está `EN_CURSO`. Excepción deliberada a la regla general de soft-delete, consistente entre ambos módulos.

## 7. Validaciones

- Subcategoría: `nombre` obligatorio; `categoriaId` existente y vigente; `codigo` (slug) único por categoría entre las vivas.
- (Ola 2) Hallazgo: `categoriaId` vigente de Prevención; `subcategoriaId` vigente y perteneciente a esa categoría; `nivelRiesgoId` activo; `plazoValor > 0`; `plazoUnidad ∈ {DIAS,HORAS}`; `comentario` obligatorio; ≥1 foto en el alta.

## 8. Estados

- Catálogos: `activo` true/false + soft delete.
- (Ola 2) `VisitaPrevencion.estado`: `EN_CURSO` → `FINALIZADA`.

## 9. Integraciones

- `CategoriaFormulario` (núcleo, compartida con el constructor de formularios): en Prevención también es raíz de la clasificación de hallazgos.
- `NivelRiesgo` (catálogo de prevención, ya existente).
- (Ola 2) Fotos en BD (patrón `HallazgoFoto`/`HallazgoFotoData`), reporte HTML→PDF (Playwright), y alertas por obra.

## 10. Pendientes

- [x] Ola 2: modelos `VisitaPrevencion`/`HallazgoPrevencion`, módulo backend `prevencion/visitas`, frontend de captura y reporte — **implementado 22-10-2026**.
- [ ] ¿La Categoría de Prevención debe desacoplarse por completo de `CategoriaFormulario` (hoy compartida con el constructor de formularios)? Decisión 22-10-2026: **no por ahora** — se reutiliza la tabla existente y se reencuadra la UI; renombrar/separar es refactor aparte.
- [ ] **GPS/georreferenciación de la visita** (`alcop-esquema.html` §07): **diferido a la Etapa 2 (app móvil)** por decisión de Christian (22-10-2026) — la captura de ubicación es nativa del flujo en terreno; en la web de Etapa 1 no se implementa. Compromiso del alcance comercial igualmente vigente, solo reprogramado de etapa.
- [ ] **Responsable del hallazgo** (`alcop-esquema.html §06` "con foto y responsable"): **diferido a una ola posterior** por decisión de Christian (22-10-2026) — **no implementado en Etapa 1 ni en front ni en API** (se retiró el campo que se había agregado). Compromiso del alcance comercial igualmente vigente, solo reprogramado. Al retomarlo, resolver obligatoriedad y semántica (texto libre vs. relación a usuario) — ver arbitraje QA-OKA-013.
- [ ] Análisis IA de prevención (adaptador genérico) — ola aparte.
