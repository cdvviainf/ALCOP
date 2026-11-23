-- Adaptación de formularios LCH-AT a los MS Forms reales + importación de sus respuestas.
-- Generado por gen-import-respuestas-lch-at-msforms.py desde los Excel de MS Forms (no editar a mano). Re-ejecutable:
--   * las preguntas se rehacen solo si el formulario aún no tiene respuestas;
--   * cada registro importado se marca con creadoPor = 'import-msforms:<archivo>#<ID>' y no se duplica.
-- Marcas en Pregunta.texto: **texto** = pregunta nueva (negrita), sufijo *Rev* = similar, por revisar (rojo).
BEGIN;
CREATE TEMP TABLE _orig (codigo text, orden int, texto text, tipo text, oblig bool, pfoto bool, ofoto bool, opciones text[]) ON COMMIT DROP;
CREATE TEMP TABLE _map (codigo text, clave text, preguntaid int) ON COMMIT DROP;
INSERT INTO "Usuario" (id, nombre, email, activo, "esAdmin", "creadoEn", "creadoPor") SELECT 'imp_' || md5('caa@alcop.cl'), 'Cristian Aravena', 'caa@alcop.cl', true, false, now(), 'import-msforms' WHERE NOT EXISTS (SELECT 1 FROM "Usuario" WHERE lower(email) = lower('caa@alcop.cl'));
INSERT INTO "Usuario" (id, nombre, email, activo, "esAdmin", "creadoEn", "creadoPor") SELECT 'imp_' || md5('cqv@alcop.cl'), 'Cristian Quezada', 'cqv@alcop.cl', true, false, now(), 'import-msforms' WHERE NOT EXISTS (SELECT 1 FROM "Usuario" WHERE lower(email) = lower('cqv@alcop.cl'));

-- ===== LCH-AT-01-AP: 14 preguntas del Excel; se reemplazan las del sistema [1, 2, 3, 4, 8, 10]
DO $$ DECLARE v_form int; v_n int; BEGIN
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-01-AP' AND "eliminadoEn" IS NULL;
  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario LCH-AT-01-AP'; END IF;
  IF EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form AND texto = '**Ubicación**') THEN
    RAISE NOTICE 'LCH-AT-01-AP: ya adaptado, se mantiene'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "formularioId" = v_form) THEN
    RAISE EXCEPTION 'LCH-AT-01-AP ya tiene registros: no se pueden rehacer sus preguntas'; END IF;
  SELECT count(*) INTO v_n FROM "Pregunta" WHERE "formularioId" = v_form;
  IF v_n <> (SELECT max(orden) FROM "Pregunta" WHERE "formularioId" = v_form) THEN RAISE EXCEPTION 'LCH-AT-01-AP: orden de preguntas inesperado'; END IF;
  INSERT INTO _orig SELECT 'LCH-AT-01-AP', orden, texto, "tipoRespuesta"::text, obligatoria, "permiteFoto", "fotoObligatoria", opciones
    FROM "Pregunta" WHERE "formularioId" = v_form AND orden NOT IN (1,2,3,4,8,10);
  DELETE FROM "Pregunta" WHERE "formularioId" = v_form;
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
    (v_form, 1, '**Ubicación**', 'TEXTO', true, false, false, '{}'),
    (v_form, 2, '**Control visual del buen estado de los materiales**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 3, 'Se informa en detalle las modificaciones en el trazado a la OT. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 4, '**Se chequea cama de arena 10 cm compactado**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 5, '**Rellenos compactados en capas de 15 cm (arena tmn 5mm)**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 6, 'S-contratista entrega registro de prueba de hermeticidad. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 7, 'El S-contrato cuenta con los planos en version final y en papel para su montaje *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 8, 'Se controlan materiales según especificación técnica *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 9, 'Trazado y replanteo de ramales conforme a requerimiento. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 10, 'Trazado de intersecciones con otros servicios y elementos estructurales *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 11, '**Terminación con relleno bajo radier s-mecanica de suelos o entre mallas si es losa**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 12, 'Se registra prueba de presion entregada por el s-contrato *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 13, 'Se asegura ubicación del cuerpo de todas las llaves de paso, todas deben quedar en correcto plomo sin uso de extensión de vástago. *Rev*', 'CHECKBOX', true, false, false, '{}');
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, 13 + row_number() OVER (ORDER BY orden), texto, tipo::"TipoRespuesta", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = 'LCH-AT-01-AP';
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, (SELECT max(orden) + 1 FROM "Pregunta" WHERE "formularioId" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{}';
END $$;
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'UBICACION', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Ubicación**';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-1', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Control visual del buen estado de los materiales**';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-2', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se informa en detalle las modificaciones en el trazado a la OT. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Se chequea cama de arena 10 cm compactado**';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Rellenos compactados en capas de 15 cm (arena tmn 5mm)**';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'S-contratista entrega registro de prueba de hermeticidad. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'El S-contrato cuenta con los planos en version final y en papel para su montaje *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-7', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se controlan materiales según especificación técnica *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-8', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Trazado y replanteo de ramales conforme a requerimiento. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-9', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Trazado de intersecciones con otros servicios y elementos estructurales *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-10', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Terminación con relleno bajo radier s-mecanica de suelos o entre mallas si es losa**';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-11', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se registra prueba de presion entregada por el s-contrato *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'AP-12', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se asegura ubicación del cuerpo de todas las llaves de paso, todas deben quedar en correcto plomo sin uso de extensión de vástago. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AP', 'OBSERVACIONES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL AND p.texto = '**Observaciones**';

-- ===== LCH-AT-01-AS: 14 preguntas del Excel; se reemplazan las del sistema [1, 2, 3, 4, 7, 9, 10]
DO $$ DECLARE v_form int; v_n int; BEGIN
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-01-AS' AND "eliminadoEn" IS NULL;
  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario LCH-AT-01-AS'; END IF;
  IF EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form AND texto = '**Ubicación**') THEN
    RAISE NOTICE 'LCH-AT-01-AS: ya adaptado, se mantiene'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "formularioId" = v_form) THEN
    RAISE EXCEPTION 'LCH-AT-01-AS ya tiene registros: no se pueden rehacer sus preguntas'; END IF;
  SELECT count(*) INTO v_n FROM "Pregunta" WHERE "formularioId" = v_form;
  IF v_n <> (SELECT max(orden) FROM "Pregunta" WHERE "formularioId" = v_form) THEN RAISE EXCEPTION 'LCH-AT-01-AS: orden de preguntas inesperado'; END IF;
  INSERT INTO _orig SELECT 'LCH-AT-01-AS', orden, texto, "tipoRespuesta"::text, obligatoria, "permiteFoto", "fotoObligatoria", opciones
    FROM "Pregunta" WHERE "formularioId" = v_form AND orden NOT IN (1,2,3,4,7,9,10);
  DELETE FROM "Pregunta" WHERE "formularioId" = v_form;
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
    (v_form, 1, '**Ubicación**', 'TEXTO', true, false, false, '{}'),
    (v_form, 2, '**El Subcta. cuenta con los planos y EETT de la especialidad, en papel y escala adecuada.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 3, 'Control de materiales según la EETT (certificados a entregar por parte del Subcta). *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 4, '**Control visual del buen estado de los materiales; nuevos, limpios, no asoleados y sin daños.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 5, 'Trazado y replanteo del proyecto de aguas servidas. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 6, 'Se informa en detalle las modificaciones en el trazado a la OT. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 7, '**Chequeo de niveles y compactación del sello de excavación para AS.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 8, 'Chequeo de cama de arena (10 cm compactado). *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 9, 'Rellenos compactados en capas de 15cm (Arena T.max 5mm). *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 10, 'Terminación con relleno bajo radier según mecánica de suelos. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 11, 'Subcta. entrega registro de prueba de hermeticidad ramal con firma de su profesional competente. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 12, 'Subcta. entrega registro de prueba de hermeticidad UD con firma de su profesional competente. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 13, 'Chequeo de Trazo de centros para verticales y ramales en zócalo, asegura llegada y verticalidad, para niveles superiores. *Rev*', 'CHECKBOX', true, false, false, '{}');
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, 13 + row_number() OVER (ORDER BY orden), texto, tipo::"TipoRespuesta", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = 'LCH-AT-01-AS';
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, (SELECT max(orden) + 1 FROM "Pregunta" WHERE "formularioId" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{}';
END $$;
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'UBICACION', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = '**Ubicación**';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-1', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = '**El Subcta. cuenta con los planos y EETT de la especialidad, en papel y escala adecuada.**';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-2', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Control de materiales según la EETT (certificados a entregar por parte del Subcta). *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = '**Control visual del buen estado de los materiales; nuevos, limpios, no asoleados y sin daños.**';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Trazado y replanteo del proyecto de aguas servidas. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se informa en detalle las modificaciones en el trazado a la OT. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = '**Chequeo de niveles y compactación del sello de excavación para AS.**';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-7', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Chequeo de cama de arena (10 cm compactado). *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-8', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Rellenos compactados en capas de 15cm (Arena T.max 5mm). *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-9', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Terminación con relleno bajo radier según mecánica de suelos. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-10', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Subcta. entrega registro de prueba de hermeticidad ramal con firma de su profesional competente. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-11', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Subcta. entrega registro de prueba de hermeticidad UD con firma de su profesional competente. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'AS-12', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = 'Chequeo de Trazo de centros para verticales y ramales en zócalo, asegura llegada y verticalidad, para niveles superiores. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-01-AS', 'OBSERVACIONES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL AND p.texto = '**Observaciones**';

-- ===== LCH-AT-02: 13 preguntas del Excel; se reemplazan las del sistema [1, 2, 6, 7, 8, 9, 14, 16, 18]
DO $$ DECLARE v_form int; v_n int; BEGIN
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-02' AND "eliminadoEn" IS NULL;
  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario LCH-AT-02'; END IF;
  IF EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form AND texto = '**Ubicación**') THEN
    RAISE NOTICE 'LCH-AT-02: ya adaptado, se mantiene'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "formularioId" = v_form) THEN
    RAISE EXCEPTION 'LCH-AT-02 ya tiene registros: no se pueden rehacer sus preguntas'; END IF;
  SELECT count(*) INTO v_n FROM "Pregunta" WHERE "formularioId" = v_form;
  IF v_n <> (SELECT max(orden) FROM "Pregunta" WHERE "formularioId" = v_form) THEN RAISE EXCEPTION 'LCH-AT-02: orden de preguntas inesperado'; END IF;
  INSERT INTO _orig SELECT 'LCH-AT-02', orden, texto, "tipoRespuesta"::text, obligatoria, "permiteFoto", "fotoObligatoria", opciones
    FROM "Pregunta" WHERE "formularioId" = v_form AND orden NOT IN (1,2,6,7,8,9,14,16,18);
  DELETE FROM "Pregunta" WHERE "formularioId" = v_form;
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
    (v_form, 1, '**Ubicación**', 'TEXTO', true, false, false, '{}'),
    (v_form, 2, '**El Supervisor o Subcta. cuenta con los planos y/o EETT de la especialidad, en papel y escala adecuada.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 3, 'Control de materiales según la EETT o validación de OT. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 4, 'Tabiques finalizados solo con faldon de tina pendiente (faldon, tina y ductos post-imper.) *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 5, 'Superficie plana, sana, seca, limpia, sin insertos metalicos y libre de polvo. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 6, 'Trazado de retornos y traslapos. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 7, 'Aplicación del producto dos manos de impermeabilizante en forma cruzada. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 8, '**Se controla intalacion de polietileno negro en escavacion.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 9, 'Se controla aplicación de cristalizante superficial en 1° junta fria de hormigonado. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 10, 'Se controla aplicación de cristalizante superficial en 2° junta fria de hormigonado (sobrecimiento). *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 11, 'Se controla Imper. muro por exterior (hombro de fundacion y muro 100cm sobre el N.T.N.). *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 12, '**Se controla Imper. muro por interior (hombro de fundacion y muro 50cm sobre el N.O.G.).**', 'CHECKBOX', true, false, false, '{}');
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, 12 + row_number() OVER (ORDER BY orden), texto, tipo::"TipoRespuesta", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = 'LCH-AT-02';
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, (SELECT max(orden) + 1 FROM "Pregunta" WHERE "formularioId" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{}';
END $$;
INSERT INTO _map SELECT 'LCH-AT-02', 'UBICACION', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = '**Ubicación**';
INSERT INTO _map SELECT 'LCH-AT-02', 'PLANOS', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = '**El Supervisor o Subcta. cuenta con los planos y/o EETT de la especialidad, en papel y escala adecuada.**';
INSERT INTO _map SELECT 'LCH-AT-02', 'MATERIALES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Control de materiales según la EETT o validación de OT. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'TYD-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Tabiques finalizados solo con faldon de tina pendiente (faldon, tina y ductos post-imper.) *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'TYD-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Superficie plana, sana, seca, limpia, sin insertos metalicos y libre de polvo. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'TYD-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Trazado de retornos y traslapos. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'TYD-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Aplicación del producto dos manos de impermeabilizante en forma cruzada. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'F-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = '**Se controla intalacion de polietileno negro en escavacion.**';
INSERT INTO _map SELECT 'LCH-AT-02', 'F-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se controla aplicación de cristalizante superficial en 1° junta fria de hormigonado. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'F-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se controla aplicación de cristalizante superficial en 2° junta fria de hormigonado (sobrecimiento). *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'F-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = 'Se controla Imper. muro por exterior (hombro de fundacion y muro 100cm sobre el N.T.N.). *Rev*';
INSERT INTO _map SELECT 'LCH-AT-02', 'F-7', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = '**Se controla Imper. muro por interior (hombro de fundacion y muro 50cm sobre el N.O.G.).**';
INSERT INTO _map SELECT 'LCH-AT-02', 'OBSERVACIONES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL AND p.texto = '**Observaciones**';

-- ===== LCH-AT-03: 9 preguntas del Excel; se reemplazan las del sistema [1, 2, 4, 5, 7, 8, 13]
DO $$ DECLARE v_form int; v_n int; BEGIN
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-03' AND "eliminadoEn" IS NULL;
  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario LCH-AT-03'; END IF;
  IF EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form AND texto = '**Ubicación**') THEN
    RAISE NOTICE 'LCH-AT-03: ya adaptado, se mantiene'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "formularioId" = v_form) THEN
    RAISE EXCEPTION 'LCH-AT-03 ya tiene registros: no se pueden rehacer sus preguntas'; END IF;
  SELECT count(*) INTO v_n FROM "Pregunta" WHERE "formularioId" = v_form;
  IF v_n <> (SELECT max(orden) FROM "Pregunta" WHERE "formularioId" = v_form) THEN RAISE EXCEPTION 'LCH-AT-03: orden de preguntas inesperado'; END IF;
  INSERT INTO _orig SELECT 'LCH-AT-03', orden, texto, "tipoRespuesta"::text, obligatoria, "permiteFoto", "fotoObligatoria", opciones
    FROM "Pregunta" WHERE "formularioId" = v_form AND orden NOT IN (1,2,4,5,7,8,13);
  DELETE FROM "Pregunta" WHERE "formularioId" = v_form;
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
    (v_form, 1, '**Ubicación**', 'TEXTO', true, false, false, '{}'),
    (v_form, 2, 'Control de materiales según la EETT o validacion de OT, ficha del material entregada. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 3, 'El Supervisor o Subcta. cuenta con la ficha tecnica del producto a utilizar *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 4, 'Superficie sana, firme, libre de lechada o cualquier tipo de contaminantes. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 5, 'Limpieza química de la superficie y el respectivo enjuague. (o escarificado y aspiración) *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 6, 'Chequeo de niveletas *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 7, 'Seguimiento de curado 3 dias *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 8, '**Chequeo de tolerancias 3mm en 3m**', 'CHECKBOX', true, false, false, '{}');
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, 8 + row_number() OVER (ORDER BY orden), texto, tipo::"TipoRespuesta", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = 'LCH-AT-03';
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, (SELECT max(orden) + 1 FROM "Pregunta" WHERE "formularioId" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{}';
END $$;
INSERT INTO _map SELECT 'LCH-AT-03', 'UBICACION', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = '**Ubicación**';
INSERT INTO _map SELECT 'LCH-AT-03', '03-1', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'Control de materiales según la EETT o validacion de OT, ficha del material entregada. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-2', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'El Supervisor o Subcta. cuenta con la ficha tecnica del producto a utilizar *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'Superficie sana, firme, libre de lechada o cualquier tipo de contaminantes. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'Limpieza química de la superficie y el respectivo enjuague. (o escarificado y aspiración) *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'Chequeo de niveletas *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = 'Seguimiento de curado 3 dias *Rev*';
INSERT INTO _map SELECT 'LCH-AT-03', '03-7', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = '**Chequeo de tolerancias 3mm en 3m**';
INSERT INTO _map SELECT 'LCH-AT-03', 'OBSERVACIONES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL AND p.texto = '**Observaciones**';

-- ===== LCH-AT-04: 10 preguntas del Excel; se reemplazan las del sistema [1, 2, 3, 4, 9, 10, 11]
DO $$ DECLARE v_form int; v_n int; BEGIN
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-04' AND "eliminadoEn" IS NULL;
  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario LCH-AT-04'; END IF;
  IF EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form AND texto = '**Ubicación**') THEN
    RAISE NOTICE 'LCH-AT-04: ya adaptado, se mantiene'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "formularioId" = v_form) THEN
    RAISE EXCEPTION 'LCH-AT-04 ya tiene registros: no se pueden rehacer sus preguntas'; END IF;
  SELECT count(*) INTO v_n FROM "Pregunta" WHERE "formularioId" = v_form;
  IF v_n <> (SELECT max(orden) FROM "Pregunta" WHERE "formularioId" = v_form) THEN RAISE EXCEPTION 'LCH-AT-04: orden de preguntas inesperado'; END IF;
  INSERT INTO _orig SELECT 'LCH-AT-04', orden, texto, "tipoRespuesta"::text, obligatoria, "permiteFoto", "fotoObligatoria", opciones
    FROM "Pregunta" WHERE "formularioId" = v_form AND orden NOT IN (1,2,3,4,9,10,11);
  DELETE FROM "Pregunta" WHERE "formularioId" = v_form;
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
    (v_form, 1, '**Ubicación**', 'TEXTO', true, false, false, '{}'),
    (v_form, 2, 'Control de materiales según la EETT o validación de OT, ficha del material entregada a terreno. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 3, 'El Supervisor o Subcta. cuenta con la ficha técnica del producto a utilizar. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 4, 'Superficie firme, seca y nivelada. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 5, 'Instalación de juntas de dilatación bajo eje de puerta de acceso a cada recinto. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 6, 'Correcta dilatación a muros laterales mínimo 10mm, si se instaló junquillo, retire totalmente y revise. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 7, '**Todos los traslapes son de 20 cm.**', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 8, 'Todos los ajustes longitudinales son de al menos 1/3 de la palmeta. *Rev*', 'CHECKBOX', true, false, false, '{}'),
    (v_form, 9, 'Huella y contrahuella pegada con adhesivo de poliuretano, correcta instalación de narices de grada. *Rev*', 'CHECKBOX', true, false, false, '{}');
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, 9 + row_number() OVER (ORDER BY orden), texto, tipo::"TipoRespuesta", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = 'LCH-AT-04';
  INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones)
    SELECT v_form, (SELECT max(orden) + 1 FROM "Pregunta" WHERE "formularioId" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{}';
END $$;
INSERT INTO _map SELECT 'LCH-AT-04', 'UBICACION', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = '**Ubicación**';
INSERT INTO _map SELECT 'LCH-AT-04', '04-1', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Control de materiales según la EETT o validación de OT, ficha del material entregada a terreno. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-2', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'El Supervisor o Subcta. cuenta con la ficha técnica del producto a utilizar. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-3', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Superficie firme, seca y nivelada. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-4', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Instalación de juntas de dilatación bajo eje de puerta de acceso a cada recinto. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-5', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Correcta dilatación a muros laterales mínimo 10mm, si se instaló junquillo, retire totalmente y revise. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-6', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = '**Todos los traslapes son de 20 cm.**';
INSERT INTO _map SELECT 'LCH-AT-04', '04-7', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Todos los ajustes longitudinales son de al menos 1/3 de la palmeta. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', '04-8', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = 'Huella y contrahuella pegada con adhesivo de poliuretano, correcta instalación de narices de grada. *Rev*';
INSERT INTO _map SELECT 'LCH-AT-04', 'OBSERVACIONES', p.id FROM "Pregunta" p JOIN "Formulario" fo ON fo.id = p."formularioId" WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL AND p.texto = '**Observaciones**';

-- ===== Registros importados
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-02T00:00:00Z'::timestamptz, ('2026-09-02 12:05:03'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 21 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Ejecución de UD en proceso.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#2') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:06:07'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#2'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#2 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 94 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#3') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:07:43'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#3'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#3 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 95 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#4') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:08:29'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#4'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#4 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 96 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#5') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:08:56'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#5'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#5 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 96 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#6') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:09:22'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#6'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#6 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 97 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#7') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:10:06'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#7'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#7 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 99 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#8') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:10:46'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#8'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#8 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 100 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#9') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:11:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#9'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#9 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 101 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#10') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:11:44'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#10'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#10 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 102 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#11') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:12:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#11'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#11 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 102 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#12') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:12:50'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#12'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#12 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 103 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#13') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:13:17'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#13'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#13 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 104 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#14') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:13:43'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#14'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#14 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 105 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#15') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:14:08'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#15'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#15 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 106 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#16') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:14:34'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#16'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#16 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 107 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#17') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:15:03'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#17'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#17 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 108 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#18') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:15:40'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#18'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#18 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 109 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#19') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:16:17'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#19'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#19 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 110 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#20') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:16:55'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#20'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#20 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Lote 111 (Ch III)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#21') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:42:03'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#21'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#21 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 1 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#22') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:43:21'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#22'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#22 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 2 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#23') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:44:31'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#23'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#23 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 3 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#24') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:45:00'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#24'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#24 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 4 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#25') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:45:31'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#25'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#25 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 5 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#26') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:46:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#26'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#26 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 6 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#27') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:46:42'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#27'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#27 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 7 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#28') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:47:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#28'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#28 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 8 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#29') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:47:44'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#29'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#29 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 9 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#30') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:48:12'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#30'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#30 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 10 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#31') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:48:56'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#31'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#31 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 11 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#32') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:49:30'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#32'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#32 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 12 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#33') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:49:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#33'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#33 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 13 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#34') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:50:28'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#34'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#34 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 14 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#35') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:51:00'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#35'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#35 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 15 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#36') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:51:47'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#36'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#36 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 16 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#37') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:52:24'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#37'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#37 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 17 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#38') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:52:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#38'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#38 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 18 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#39') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:53:31'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#39'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#39 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 18 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#40') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:54:31'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#40'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#40 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 19 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#41') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:55:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#41'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#41 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 20 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#42') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:55:43'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#42'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#42 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 21 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#43') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:56:14'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#43'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#43 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 22 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#44') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:56:47'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#44'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#44 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 23 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#45') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:57:17'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#45'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#45 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 24 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#46') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:57:48'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#46'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#46 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 25 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#47') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:58:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#47'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#47 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 26 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#48') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:58:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#48'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#48 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 27 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#49') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:59:32'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#49'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#49 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 28 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#50') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 20:00:07'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#50'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#50 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 29 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#51') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 20:00:37'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#51'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#51 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 30 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#52') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 20:01:24'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#52'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#52 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 31 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#53') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 20:01:53'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#53'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AP' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUA POTABLE(1-53).xlsx#53 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'UBICACION'), 'Casa 32 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-11'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'AP-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AP' AND clave = 'OBSERVACIONES'), 'Pruebas de presión las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-02T00:00:00Z'::timestamptz, ('2026-09-02 12:44:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 21 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Se realizan pruebas de hermeticidad en el primer piso antes, antes de radier y luego en el segundo.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#2') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:17:25'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#2'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#2 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 94 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#3') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:44:12'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#3'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#3 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 95 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#4') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:44:47'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#4'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#4 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 96 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#5') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:45:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#5'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#5 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 97 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#6') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:45:35'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#6'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#6 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 98 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#7') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:45:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#7'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#7 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 99 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#8') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:46:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#8'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#8 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 100 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#9') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:46:48'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#9'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#9 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 101 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#10') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:47:10'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#10'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#10 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 102 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#11') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:47:33'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#11'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#11 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 103 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#12') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:47:55'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#12'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#12 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 104 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#13') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:48:20'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#13'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#13 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 105 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#14') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:48:41'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#14'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#14 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 106 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#15') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:49:12'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#15'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#15 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 107 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#16') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:49:38'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#16'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#16 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 108 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#17') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:50:05'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#17'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#17 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 109 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#18') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:50:30'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#18'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#18 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 110 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'SOLO APLICA PARA BAJO RADIER', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#19') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:50:55'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#19'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#19 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Lote 111 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'o', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#20') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:31:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#20'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#20 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 1 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Supervisor SC entrega pruebas a supervisor', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#21') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:38:21'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#21'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#21 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 2 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor SC a supervisor empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#22') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:40:37'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#22'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#22 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 1 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#23') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:41:34'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#23'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#23 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 3 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#24') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:43:01'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#24'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#24 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 4 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#25') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:43:34'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#25'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#25 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 5 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#26') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:44:08'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#26'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#26 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 6 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#27') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:44:47'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#27'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#27 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 7 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#28') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:45:26'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#28'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#28 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 8 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#29') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:46:19'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#29'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#29 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 9 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#30') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:47:10'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#30'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#30 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 10 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#31') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 18:47:42'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#31'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#31 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 11 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#32') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:16:22'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#32'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#32 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 12 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#33') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:16:48'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#33'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#33 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 13 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#34') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:17:31'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#34'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#34 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 14 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#35') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:18:17'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#35'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#35 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 15 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#36') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:19:14'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#36'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#36 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 16 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#37') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:19:43'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#37'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#37 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 17 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#38') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:20:13'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#38'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#38 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 18 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#39') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:20:49'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#39'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#39 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 19 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#40') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:21:24'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#40'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#40 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 20 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#41') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:22:26'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#41'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#41 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 21 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#42') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:24:30'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#42'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#42 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 22 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#43') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:35:59'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#43'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#43 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 23 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#44') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:36:34'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#44'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#44 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 24 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#45') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:37:06'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#45'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#45 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 25 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#46') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:37:46'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#46'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#46 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 26 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#47') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:38:19'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#47'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#47 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 27 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#48') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:39:15'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#48'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#48 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 28 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#49') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:39:46'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#49'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#49 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 29 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#50') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:40:17'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#50'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#50 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 30 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#51') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:40:56'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#51'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#51 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 31 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#52') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-28T00:00:00Z'::timestamptz, ('2026-09-28 19:41:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#52'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-01-AS' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-01 AGUAS SERVIDAS (1-52).xlsx#52 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'UBICACION'), 'Casa 32 CO', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-9'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-10'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-11'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'AS-12'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-01-AS' AND clave = 'OBSERVACIONES'), 'Pruebas las entrega supervisor de SC a supervisor de la empresa.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-02 (TyD)_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-1).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:55:02'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-02 (TyD)_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-1).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-02 (TyD)_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-1).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 111 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'TYD-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'TYD-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'TYD-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'TYD-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'OK', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-07T00:00:00Z'::timestamptz, ('2026-09-07 11:26:08'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 111 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'Impermeabilización  exterior  es  1,25  sobre  el nivel del hombro de la fundación, las partidas  de impermeabilización  suceden en  distintas  etapas  dentro de la secuencia', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#2') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:56:02'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#2'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#2 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 111 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#3') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:56:49'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#3'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#3 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 110 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#4') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:57:22'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#4'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#4 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 109 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#5') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:57:47'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#5'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#5 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 108 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#6') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:58:12'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#6'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#6 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 107 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#7') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:58:34'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#7'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#7 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 106 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#8') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:59:03'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#8'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#8 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 105 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#9') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:59:23'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#9'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#9 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 104 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#10') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:59:49'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#10'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#10 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 103 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#11') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:00:11'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#11'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#11 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 102 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#12') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:00:33'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#12'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#12 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 101 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#13') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:01:00'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#13'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#13 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 100 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'O', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#14') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:01:26'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#14'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#14 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 99 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'IMPERMEABILIZACIONES  EXTERIORES  SE APLICAN EN OTRA  ETAPA', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#15') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:02:20'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#15'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#15 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 98 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'OK', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#16') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:03:58'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#16'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#16 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 97 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'IMPERMEABILIZACIONES  EXTERIORES  SE APLICAN EN OTRA  ETAPA', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#17') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:04:50'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#17'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#17 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 96 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'IMPERMEABILIZACIONES  EXTERIORES  SE APLICAN EN OTRA  ETAPA', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#18') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:05:12'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#18'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#18 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 95 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'IMPERMEABILIZACIONES  EXTERIORES  SE APLICAN EN OTRA  ETAPA', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#19') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 14:05:39'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#19'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#19 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Lote 94 (Ch)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'IMPERMEABILIZACIONES  EXTERIORES  SE APLICAN EN OTRA  ETAPA', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#20') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-29T00:00:00Z'::timestamptz, ('2026-09-29 19:39:05'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#20'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#20 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Casa 8 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'Se utilizan productos CAVE y ellos revisaron que se estaban utilizando correctamente.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#21') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-29T00:00:00Z'::timestamptz, ('2026-09-29 19:43:52'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#21'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#21 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Casa 7 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'Se utilizan productos CAVE y ellos revisaron que se estaban utilizando correctamente.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#22') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-29T00:00:00Z'::timestamptz, ('2026-09-29 19:53:45'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#22'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#22 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Casa 1 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'Se utilizan productos CAVE y ellos revisaron que se estaban utilizando correctamente.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#23') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-29T00:00:00Z'::timestamptz, ('2026-09-29 19:54:29'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#23'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-02' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'OLM' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('cqv@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:_LCH-AT-02(F)- Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-23).xlsx#23 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'UBICACION'), 'Casa 2 (CO)', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'PLANOS'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'MATERIALES'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'F-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-02' AND clave = 'OBSERVACIONES'), 'Se utilizan productos CAVE y ellos revisaron que se estaban utilizando correctamente.', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:51:56'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'UBICACION'), 'Lote 111 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'OBSERVACIONES'), 'OK', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#2') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-15T00:00:00Z'::timestamptz, ('2026-09-15 07:14:15'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#2'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#2 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'UBICACION'), 'Lote 100 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'OBSERVACIONES'), 'A', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#3') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-30T00:00:00Z'::timestamptz, ('2026-09-30 12:57:52'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#3'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#3 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'UBICACION'), 'Lote 100 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'OBSERVACIONES'), '0', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#4') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-30T00:00:00Z'::timestamptz, ('2026-09-30 12:59:16'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#4'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#4 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'UBICACION'), 'Lote 101 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-6'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'OBSERVACIONES'), 'aun no pasan  3 dias', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#5') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-30T00:00:00Z'::timestamptz, ('2026-09-30 12:59:50'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#5'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-03' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-03_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-5).xlsx#5 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'UBICACION'), 'Lote 103 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-5'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-6'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = '03-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-03' AND clave = 'OBSERVACIONES'), 'aun no pasan 3  dias', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#1') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-08-31T00:00:00Z'::timestamptz, ('2026-09-02 10:52:48'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#1'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#1 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = 'UBICACION'), 'Lote 111 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-1'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-2'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-4'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-5'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-6'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-8'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = 'OBSERVACIONES'), 'Se verificó instalación de revestimiento SPC en escala icluyendo a ITO; se utiliza adhesivo recomendado por proveedor (MK); jueves 03-sep vendrá visita técnica de proveedor para verificación de instalación', NULL, '{}');
END $$;
DO $$ DECLARE v_reg int; BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaFormulario" WHERE "creadoPor" = 'import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#2') THEN RETURN; END IF;
  INSERT INTO "RespuestaFormulario" ("formularioId", "obraId", "usuarioId", estado, "fechaRevision", "fechaHora", "creadoEn", "creadoPor")
  SELECT fo.id, o.id, u.id, 'CERRADO', '2026-09-09T00:00:00Z'::timestamptz, ('2026-09-09 13:53:32'::timestamp AT TIME ZONE 'America/Santiago'), now(), 'import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#2'
    FROM "Formulario" fo, "Obra" o, "Usuario" u WHERE fo.codigo = 'LCH-AT-04' AND fo."eliminadoEn" IS NULL
    AND o.codigo = 'CH3' AND o."eliminadoEn" IS NULL AND lower(u.email) = lower('caa@alcop.cl') RETURNING id INTO v_reg;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear import-msforms:LCH-AT-04_Control Técnico de Obras ALCOP Constructora e Inmobiliaria ALCOP SpA(1-2).xlsx#2 (formulario/obra/usuario)'; END IF;
  INSERT INTO "RespuestaPregunta" ("respuestaFormularioId", "preguntaId", "valorTexto", "valorCheckbox", "valorSeleccionMultiple") VALUES
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = 'UBICACION'), 'Lote 111 CH', NULL, '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-1'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-2'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-3'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-4'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-5'), NULL, 'NO_CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-6'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-7'), NULL, 'CUMPLE', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = '04-8'), NULL, 'N_A', '{}'),
    (v_reg, (SELECT preguntaid FROM _map WHERE codigo = 'LCH-AT-04' AND clave = 'OBSERVACIONES'), 'EL PISO  NO SE PEGA  EN SU INSTALACION SOLO EN ESCALERAS,  DILATACIONES  SEGUN VISTO CON PROVEEDOR  CORRESPONDE  AL ANCHO  DE UNA PALMETA  DE SPC', NULL, '{}');
END $$;

COMMIT;
