# 00 — Entorno General (ALCOP)

> Estado: **borrador inicial** — a completar en sesión de especificación con Christian, siguiendo la metodología spec-first de FAS (preguntas primero, documento después).

## 1. Propósito

Documentar las convenciones transversales del sistema (autorización, visibilidad, notificaciones) que todos los módulos (Núcleo, Prevención, Técnica, Reportes, Alertas) comparten, antes de especificar cada uno en detalle.

## 2. Actores (de alcop-esquema.html §08)

| Rol | Acceso | Uso principal |
|---|---|---|
| Administrador | Ambas (Prevención + Técnica) | Control total: activación de módulos, gestión de obras, usuarios. Asignado por obra — recibe notificación en cada revisión. |
| Jefe Prevencionista | Ambas | Gestión de hallazgos de seguridad a nivel general. |
| Supervisor de obra | Ambas | Seguimiento de hallazgos y checklists en terreno. |
| Prevencionista de obra | Web Prevención | Registro de checklists, hallazgos y visitas. Asignado por obra — recibe notificación en cada revisión. |
| Jefe de terreno | Web Técnica | Visita técnica y checklists LCH-AT. Asignado por obra — recibe notificación en cada revisión. |
| Trabajador | Web Prevención | Consulta de estado, sin edición. |

## 3. Regla de visibilidad (Núcleo compartido — alcop-esquema.html §05)

- Usuario con permisos de **ambas** áreas ve el Panel de obras y resumen completo.
- Usuario con perfil de **un área específica** ve solo la parte que le corresponde (Prevención o Técnica).
- Pendiente de especificar: cómo se modela esto en Prisma (¿`PerfilAcceso` por módulo nucleo/prevencion/tecnica, o flag combinado en `Usuario`?) — **preguntar a Christian antes de modelar**.

## 4. Glosario (preliminar)

- **Obra**: unidad organizativa raíz — todo (formularios, hallazgos, visitas, alertas) se filtra por obra.
- **Formulario dinámico**: checklist creado por sección/categoría, con ítems configurables — motor compartido entre Prevención y Técnica.
- **Hito**: etapa específica dentro de una visita técnica (ej. nidos, puntales) — no es un módulo aparte.
- **Análisis IA**: flujo foto → adaptador IA → informe editable (formato fijo: Obra, Inspector, Fecha y hora, Ubicación, Imágenes, Observaciones).

## 5. Pendientes

- [x] Modelo de datos de Usuario/Perfil (spec `usuarios-perfiles.md`, cerrado 04-10-2026) — resuelto con nivel de acceso por Área, sin ItemMenu granular (más simple que FAS).
- [x] Motor de formularios dinámicos (spec `formularios-dinamicos.md`, cerrado 04-10-2026).
- [x] Listado de mantenedores requeridos (`00-mantenedores-requeridos.md`, cerrado 04-10-2026).
- [ ] Modelo de Obra y su relación con Núcleo (spec `nucleo-compartido.md`)
- [ ] Definir si las notificaciones automáticas (sección 06/07) van por BullMQ + Resend o por otro proveedor de email que ya use ALCOP
- [ ] Definir proveedor de IA real (hoy: `AI_PROVIDER=mock`) y costo asociado (ver alcop-esquema.html §11: $60.000–$400.000 CLP/año según uso)
- [ ] Definir proveedor/ubicación de hosting (ver alcop-esquema.html §11: $150.000–$450.000 CLP/año según usuarios/proveedor)
- [ ] Confirmar nivelTecnica de "Jefe Prevencionista" (ver `usuarios-perfiles.md` §6)
- [ ] Confirmar si `FormularioPermiso` necesita negar acceso explícito o solo ampliarlo (ver `formularios-dinamicos.md` §10)

## 6. En stand by

- **Etapa 2 (App móvil nativa):** Christian pidió (04-10-2026) dejar su definición técnica en pausa — no especificar módulos ni modelo de datos de la app móvil todavía. No afecta lo ya comprometido comercialmente (ver `CLAUDE.md` §11).
