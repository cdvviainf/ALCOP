-- "Ubicación" de los formularios de Técnica pasa a ser la pregunta "Unidad (Lote)":
-- se elige del listado de unidades de lote de la obra (Docs/formularios-dinamicos.md §13).
UPDATE "Pregunta" p
SET "tipoRespuesta" = 'LOTE_UNIDAD', "opciones" = '{}'
FROM "Formulario" f
JOIN "Area" a ON a.id = f."areaId"
WHERE p."formularioId" = f.id
  AND a.codigo = 'TECNICA'
  AND p."tipoRespuesta" = 'TEXTO'
  AND lower(trim(replace(p.texto, '*', ''))) IN ('ubicación', 'ubicacion');

-- Respuestas previas en texto ("Lote 94 (Ch III)", "Casa 7 (CO)"): se vinculan a la
-- unidad de la obra del registro cuando el texto empieza con "<tipo de lote> <número>".
-- El texto original se conserva en valorTexto (se muestra si no hubo calce).
UPDATE "RespuestaPregunta" rp
SET "valorLoteUnidadId" = lu.id
FROM "Pregunta" p, "RespuestaFormulario" rf, "LoteUnidad" lu, "TipoLote" tl
WHERE rp."preguntaId" = p.id
  AND p."tipoRespuesta" = 'LOTE_UNIDAD'
  AND rp."valorLoteUnidadId" IS NULL
  AND rp."valorTexto" ~* '^\s*[[:alpha:]]+\s+0*[0-9]+'
  AND rf.id = rp."respuestaFormularioId"
  AND lu."obraId" = rf."obraId"
  AND lu."eliminadoEn" IS NULL
  AND tl.id = lu."tipoLoteId"
  AND lower(tl.nombre) = lower(substring(rp."valorTexto" from '^\s*([[:alpha:]]+)\s+'))
  AND lu.correlativo = substring(rp."valorTexto" from '^\s*[[:alpha:]]+\s+0*([0-9]+)')::int;
