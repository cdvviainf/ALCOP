-- Backfill de LoteUnidad para los ObraLote ya existentes (QA-OLA-A-002).
-- Genera "<TipoLote.nombre> <correlativo padded>" (ej. "Casa 001") para
-- correlativo 1..cantidad de cada ObraLote activo. Idempotente por el unique.
INSERT INTO "LoteUnidad" ("obraId", "tipoLoteId", "correlativo", "descripcion", "creadoEn")
SELECT ol."obraId",
       ol."tipoLoteId",
       g.n,
       tl."nombre" || ' ' || lpad(g.n::text, greatest(3, length(ol."cantidad"::text)), '0'),
       now()
FROM "ObraLote" ol
JOIN "TipoLote" tl ON tl."id" = ol."tipoLoteId"
CROSS JOIN LATERAL generate_series(1, ol."cantidad") AS g(n)
WHERE ol."eliminadoEn" IS NULL
ON CONFLICT ("obraId", "tipoLoteId", "correlativo") DO NOTHING;
