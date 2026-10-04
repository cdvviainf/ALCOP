# 00-mantenedores-requeridos.md — ALCOP

> Listado consolidado de mantenedores (catálogos) requeridos para la Etapa 1, derivado de `alcop-esquema.html` + las reglas de negocio confirmadas por Christian el 04-10-2026. Formato igual al de `mantenedores-generales.md` de FAS.

## Mantenedores simples (catálogo — CRUD básico, pocas filas, cambian poco)

| # | Mantenedor | Filas esperadas | Origen / uso |
|---|---|---|---|
| 1 | **Area** | 2 fijas (Prevención, Técnica) | Base de todo el modelo de accesos — ver `usuarios-perfiles.md` |
| 2 | **CategoriaFormulario** | Dinámica — sin lista cerrada. Seed inicial solo con las conocidas hoy: ~8 Prevención (EPP, Herramientas, Seguridad General, Instalaciones de Faena, Emergencias, Trabajos en Altura, Bodegas, Salud Ocupacional) + 3 de ejemplo en Técnica (LCH-AT-01AS, LCH-AT-02(F), LCH-AT-05). El resto se crea desde la app, al vuelo, igual que un `Formulario` (confirmado 04-10-2026). | Agrupa formularios — ver `formularios-dinamicos.md` |
| 3 | **TipoRespuesta** | 5 fijas (Checkbox, Selección múltiple, Número, Texto, Texto largo) | Enum, no requiere UI de mantenedor — se codifica directo |
| 4 | **NivelRiesgo** | 4 (Alto, Medio, Observación, No conformidad) | Clasificación de Hallazgos — Prevención |
| 5 | **TipoHallazgoTecnico** | 3 (No conformidad, Mejora, Sugerencia) | Clasificación de visitas — Técnica |
| 6 | **EtapaConstructiva** | 5 (Obra gruesa, Faenas húmedas, Terminaciones, Especialidades, Urbanización) | Clasificación de visitas — Técnica |
| 7 | **EtapaNido** | 6, ordenadas (Descubierto, Picado, Buzón, Llenado, Descimbre, Perfilado) | Hito de nidos — Técnica |
| 8 | **RolObra** | 3 fijas (Administrador, Jefe de Terreno, Prevencionista) | Asignación por obra para notificaciones — ver `usuarios-perfiles.md` |
| 9 | **NivelAcceso** | 3 fijas (Sin acceso, Lectura, Total) | Enum del Perfil — no requiere UI de mantenedor |

## Mantenedores con más estructura (administrables, pero con reglas propias)

| # | Mantenedor | Notas |
|---|---|---|
| 10 | **Obra** | Raíz de todo — nombre, dirección, estado activo/inactivo, fecha de inicio. Especificar en `nucleo-compartido.md` (pendiente). |
| 11 | **Perfil** | 6 precargados (ver tabla en `usuarios-perfiles.md` §6); nivel por Área, no por ítem de menú individual. |
| 12 | **Usuario** | Vía Better Auth + tabla propia con `perfilId`. |
| 13 | **UsuarioObra** | No es un catálogo clásico — es la asignación obra↔usuario↔rol que dispara las alertas. |

## No son mantenedores — son el motor dinámico (punto 2 del pedido)

- **Formulario** y **Pregunta** — se crean desde la propia aplicación por un usuario con permiso, no por un desarrollador. Ver `formularios-dinamicos.md`.

## Pendiente de spec (dependen de módulos aún no especificados)

- Catálogos propios de **Reportes** (si necesita un "tipo de reporte") — a definir en `reportes.md`.
- Catálogos propios de **Alertas** (plantillas de correo, si se necesitan) — a definir en `alertas.md`.

## Pendientes de esta lista

- [x] Confirmar la lista completa de categorías LCH-AT de Técnica — **confirmado 04-10-2026: no hace falta lista completa por adelantado**, el mantenedor es 100% dinámico y se cargan las que se necesiten desde la app.
- [ ] Confirmar si `EtapaConstructiva` y `TipoHallazgoTecnico` van en tablas separadas o se fusionan en una sola clasificación de visita técnica.
