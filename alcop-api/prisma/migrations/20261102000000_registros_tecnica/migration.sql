-- Registro Técnico (Docs/registros-tecnica.md): aplicación directa de formularios,
-- sin calendario. Un solo borrador abierto por obra + formulario; los cerrados se
-- acumulan como historial. No afecta a los registros agendados de Prevención.
CREATE UNIQUE INDEX "RespuestaFormulario_borrador_directo_key"
  ON "RespuestaFormulario" ("obraId", "formularioId")
  WHERE "formularioProgramadoId" IS NULL AND "estado" = 'BORRADOR';
