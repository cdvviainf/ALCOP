-- Importación idempotente de los Check List de Obra (Área Prevención) a Formulario + Pregunta.
-- Fuente: 'Listado de Check List Obra.xls' (Registros Manual de Estándares de Seguridad y Buenas
-- Prácticas Ambientales). Solo se cargan las hojas que son checklists de verificación; se omiten
-- cartas, declaraciones, ART, permisos, registros, tarjetas, inventarios y planillas de datos.
-- 57 formularios · 989 preguntas. Código CHK-PR-<N° del índice>.
-- Categoría: 'Check List Obra' (PREVENCION). Tipo de respuesta: CHECKBOX (Cumple/No cumple/N.A. = SI/NO/N.A).
-- Re-ejecutable sin duplicar (find-or-create por código; preguntas solo si el formulario no tiene).
BEGIN;
DO $$
DECLARE
  v_area int;
  v_cat  int;
  v_form int;
BEGIN
  SELECT id INTO v_area FROM "Area" WHERE codigo = 'PREVENCION' LIMIT 1;
  IF v_area IS NULL THEN RAISE EXCEPTION 'No existe el Área PREVENCION (corre el seed primero).'; END IF;

  SELECT id INTO v_cat FROM "CategoriaFormulario"
    WHERE "areaId" = v_area AND codigo = 'CHECK_LIST_OBRA' AND "eliminadoEn" IS NULL LIMIT 1;
  IF v_cat IS NULL THEN
    INSERT INTO "CategoriaFormulario" ("areaId", codigo, nombre, activo, "creadoEn", "creadoPor")
    VALUES (v_area, 'CHECK_LIST_OBRA', 'Check List Obra', true, now(), 'import-checklists')
    RETURNING id INTO v_cat;
  END IF;

  -- CHK-PR-08 · 15 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-08';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-08', 'Check List Baños y Duchas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Baños — ¿Existe cantidad de baños suficientes conforme a dotación de trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Baños — ¿Acceso a baños es expedito y libre de obstrucciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Baños — ¿Se mantiene los baños limpios y desinfectados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Baños — ¿Se cuenta con papeleros en cada baño?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Baños — ¿Los excusados cuentan con separaciones y puertas en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Baños — ¿Existen baños independientes para hombres y mujeres?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Baños — ¿La empresa que desarrolla limpieza de baños químicos cuenta con Res. Sanitaria?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Baños — ¿Existe cantidad suficiente de lavamanos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Duchas — ¿Existe número suficiente de duchas conforme a dotación de trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Duchas — ¿Cuentan las duchas con agua fría y caliente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Duchas — ¿Se ubica el calefont fuera del recinto de duchas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Duchas — ¿Piso de duchas es antideslizante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Duchas — ¿Se conducen las aguas servidas al alcantarillado o planta de tratamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Duchas — ¿Se proporcionan artículos suficientes para la limpieza de baños y duchas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Duchas — ¿Existe un encargado para la limpieza de baños y duchas?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-09 · 21 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-09';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-09', 'Check List Comedores y Vestidores', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Vestidores — ¿Se cuenta con casilleros suficientes para cada trabajador?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Vestidores — ¿Existe casillero adicional para el trabajador que manipule sustancias tóxicas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Vestidores — ¿Se prohíbe el uso de vestidores como comedores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Vestidores — ¿Los vestidores cuentan con una ventilación adecuada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Vestidores — ¿Se prohíbe el uso de vestidor para almacenar materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Vestidores — ¿Se mantienen libres de acumulación de agua?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Comedores — ¿Se cuenta con bancas y mesas suficientes para los trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Comedores — ¿Cuentan con superficies lavables para bancas, sillas y mesas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Comedores — ¿El piso es sólido y de fácil limpieza?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Comedores — ¿Se realiza desratización, desinsectación y sanitización programada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Comedores — ¿Se cuenta con lavaplatos con agua potable?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Comedores — ¿Se cuenta con artefacto de refrigeración para los alimentos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Comedores — ¿Se cuenta con cocinilla con quemadores en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Comedores — ¿Las cañerías de la instalación de gas son de cobre?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Comedores — ¿Existe iluminación adecuada y red eléctrica?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Comedores — ¿Se provee de contenedores suficientes para la disposición de residuos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Comedores — ¿Existe señalética con prohibición de fumar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Comedores — ¿Se cuenta con extintor operativo en comedor?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Comedores — ¿Se conducen las aguas servidas al alcantarillado o planta de tratamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Comedores — ¿Se proporcionan artículos suficientes para la limpieza del comedor?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Comedores — ¿Existe un encargado para la limpieza de comedor?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-10 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-10';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-10', 'Check List Oficinas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe iluminación adecuada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se mantiene en buen estado el piso y paredes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Existe cantidad suficiente de escritorios y en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Las sillas se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existe señalética con prohibición de furmar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existen papeleros suficientes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe cantidad suficiente de enchufes para evitar la sobrecarga con extensiones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe extintor operativo y debidamente ubicado con su señalética?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Existen vías de evacuación debidamente señalizadas?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-13 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-13';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-13', 'Check List de Iluminación', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe un plano referencial del sistema de distribución de luminarias en la obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Las luminarias son de capacidad suficiente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Las vías para el tránsito se encuentran bien iluminadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Las áreas de trabajo se encuentran bien iluminadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existe buena iluminación en las oficinas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe buena iluminación en los comedores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe buena iluminación en los guardarropias?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe buena iluminación en los baños y duchas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Existe buena iluminación en las bodegas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe la capacidad suficiente de luminarias en las áreas de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿La ilminación ha sido medida y evaluada por algún organismo competente?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-14 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-14';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-14', 'Check List Tableros Eléctricos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Tableros eléctricos cuentan con interruptores diferenciales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existen separadores de fase en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se ha implementado acrílico de protección para el conexionado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se identifican las fases y neutro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los cables de conexionado están ordenados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe conexión a tierra al interior de tablero?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe conexionado de línea a tierra en exterior?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿La línea de tierra está identificada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Existen tomas de corriente embutidos y en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Tablero cuenta con protección contra la humedad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Cuenta con sistema de soporte o fijación adecuada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se cuenta con candado que impida su apertura por trabajadores no autorizados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Tablero eléctrico cuenta con señalética?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-16 · 14 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-16';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-16', 'Check List Vehículos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El vehiculo se encuentra con sus documentos al día?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿El vehiculo tiene un programa de mantención?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿El sistema de dirección del vehiculo se encuentra en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El sistema de frenos se encuentra en buenas condiciones de operación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El sistema de luces se encuentra en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los neumaticos se encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿El vehiculo tiene neumatico de repuesto?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los limpia parabrisas se encuentran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los parabrisas y vidrios se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿La bocina del vehiculo se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Los cinturones de seguridad se encuentran buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Los espejos se encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El vehiculo cuenta con extintor, triangulos, gata y llave de rueda en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿El vehiculo cuenta con cuñas?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-17 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-17';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-17', 'Check List Bodega de Combustibles', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Los combustibles se almacenan en una bodega exclusiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los combustibles se encuentran identificadas de acuerdo a la norma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La bodega de combustibles se encuentra separada de las otras bodegas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La bodega de combustibles se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La bodega de sustancias peligrosas, esta construida de acuerdo al estandar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe un encargado de la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe extintor en la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe un inventario de la bodega de combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Existe un medio de trasvije para los combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Los depositos de combustibles se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Existe medio para contener derrames de combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se encuentran disponibles las hojas de seguridad de cada uno de los combustibles almacenados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El acceso a bodega se encuentra despejado?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-18 · 17 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-18';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-18', 'Check List Bodega de Gases', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Los gases comprimidos se almacenan en una bodega exclusiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los gases comprimidos se encuentran identificadas de acuerdo a la norma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La bodega de gases comprimidos se encuentra separada de las otras bodegas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La bodega de gases comprimidos se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La bodega de gases comprimidos, esta construida de acuerdo al estandar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿El acceso a bodega se encuentra despejado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los gases comprimidos se encuentran almacenados en forma vertical?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿El almacenamiento de cilindros de gases comprimidos separa cilindros llenos de vacios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los cilindros de gases comprimidos llenos y vacios se encuentran con sus válvulas cerradas en todo momento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿En el almacenamiento los cilindros de gases comprimidos se encuentran atados con cadenas o correas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿La bodega cuenta con un listado actualizado de números de contacto y emergencia y estos estan en un lugar visible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Existe un encargado de la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Existe extintor en la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Existe un inventario de la bodega de gases comprimidos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿Los cilindros de gases comprimidos se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Se encuentran disponibles las hojas de seguridad de cada uno de los cilindros de gases?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿comprimidos almacenados?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-19 · 18 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-19';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-19', 'Check List Bodega de Sustancias Peligrosas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Las sustancias peligrosas se almacenan en una bodega de sustancias peligrosas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Las sustancias peligrosas se encuentran identificadas de acuerdo a la norma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La bodega de sustancias peligrosas se encuentra separada de las otras bodegas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La bodega de sustancias peligrosas se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La bodega de sustancias peligrosas, esta construida de acuerdo al estandar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿La bodega cuenta con un equipo de extinción de incendios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe un encargado de la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe un medio de trasvasije para las sustancias peligrosas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los depositos de sustancias peligrosas se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿La instalación eléctrica e iluminación de bodega se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿El acceso a bodega se encuentra despejado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿El área circundante a la bodega tiene vías de tránsito despejadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Existe ducha de emergencia y lavaojos fuera de bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Existe medio para contener derrames de sustancias peligrosas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿Se encuentran disponibles las hojas de seguridad de cada una de las sustancias peligrosas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿almacenadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿La bodega cuenta con un registro actualizado y en un lugar visible de las sustancias peligrosas almacenadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, '¿La bodega cuenta con un listado actualizado de números de contacto y emergencia y estos estan en un lugar visible?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-22 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-22';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-22', 'Check List Control de Polvo', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se humedecen o cubren las fuentes de generación de polvo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se humedecen las zonas de acopio, para evitar la polución cuando existan fuertes vientos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se lavan las ruedas de los camiones al salir de la obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existen mallas de retención de polvo en los perimetros?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se controla la velocidad de los vehiculos en la obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿La tolva de los camiones sale desde la obra encarpada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los residuos solidos y escombros se manjan por conductos plasticos desde distintos niveles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se humedecen las areas de trabajo durante la limpieza?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿En las areas exteriores, las veredas y calzadas se encuentran limpias?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-23 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-23';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-23', 'Check List Control de Ruido', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se han realizado mediciones de ruido en las areas de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se controla periodicamente las fuentes emisoras de ruido?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los trabajadores cuentan con protección auditiva adecuada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Los niveles de presión sonora se encuentran de acuerdo a la norma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los equipos cuentan con carcaza de aislamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los vehiculos y equipos cuentan con silenciadores en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se realizan trabajos ruidosos en lugares confinados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se encuentran señalizadas las areas de trabajo con exposición a ruido?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se ha capacitado a los trabajadores sobre la protección auditiva?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-24 · 8 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-24';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-24', 'Check List Dispensador de Agua Potable', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Letrero con leyenda Agua Potable', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Llave exterior para evitar contaminación', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Vasos desechables para un solo uso', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Basurero para botar vasos usados', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Mantención diaria de dispensadores', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Ubicación adecuada del dispensador', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Persona responsable del dispensador', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Plano de ubicación y distribución', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-25 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-25';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-25', 'Control de Distribución de Combustible', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe una persona encargada de la distribución de combustible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existe un área designada para el trasvasije de combustible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿El área de trasvasije de combustible se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existen fuentes de ignición en el área de trasvasije?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El vehiculo de distribución de combustible cuentan con autorización del SEC?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe extintor en el área de distribución de combustible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe un control de entrega de combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe un medio de trasvije (bomba manual) para los combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los depositos de combustibles se encuentran en buen estado e identificados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe medio para contener derrames de combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se encuentran disponibles las hojas de seguridad de cada uno de los combustibles?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-26 · 115 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-26';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-26', 'Check List Equipos Mayores', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Estructura Chassis y Carrocería, ( pernos sueltos, golpeada, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Calcomanías Corporativas y de Seguridad (inexistentes, dañadas o poco legibles)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Estado de Motor o Motores (ruidos, pérdida de aceite)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Sistema Eléctrico ( funcionamiento, aislaciones en buen estado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Sistema Hidráulico (pérdidas de aceite por cilindros, flexibles, uniones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Sistema de Suspensión (resortes quebrados, gomas gastadas, amortiguadores filtraciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Sistema de Alimentación (estanque, filtraciones, roturas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Sistema de Refrigeración (roturas, nivel refrigerante, T°)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Sistema de Dirección (juegos, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Sistema de Frenos (funcionamiento, desgaste balatas, regulación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Estado de batería, cables y terminales (conexiones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Alternador, amperímetro y luz de carga (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Motor de Arranque (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Turboalimentador (funcionamiento, ruidos,roturas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Tubo de escape (soltura, roturas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Cabina (cinturón de seguridad, bocina, chapas de puertas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Instrumentación del tablero (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Embrague (funcionamiento, regulación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Espejos en General (estado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Escalas de Acceso (sueltas, roturas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Estabilizadores o Patas de Apoyo (funcionamiento, filtraciones cilindros hidráulicos)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Neumáticos (verificar si se encuentran impactados, cortes y desgaste excesivo en banda de rodadura)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Neumático de Repuesto (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Parabrisas (fisuras, golpes) y Limpiaparabrisas (funcionamiento y gomas en buen estado, pasadores)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Seguro de Cardán', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Comandos ( Joystick, Palancas, Etc ) Funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Calefacción (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Caja de Herramientas ( existencia y estado )', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Horómetro y/o cuenta kilómetros (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Limitadores (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Correas (tensión y desgaste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 32, 'Estanque de Combustible (sin filtraciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 33, 'Estanque Hidráulico (sin filtraciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 34, 'Poleas y Seguros (posibles desgastes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 35, 'Asiento (estado cubierta, roturas, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 36, 'Alarma de Giro (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 37, 'Toma Fuerza (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 38, 'Piso, Escaleras y Pasarelas (sueltas, deformadas, etc.)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 39, 'Acumulador de Aire (estanqueidad, golpes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 40, 'Bloqueo de Sistema Hidráulico (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 41, 'Barra de Tiro (estado, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 42, 'Piola de Aceleración (regulación, desgaste, contaminación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 43, 'Seguridad — Documentación (permiso circulación , seguro, revisión técnica)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 44, 'Seguridad — Extintor (verificar fecha de vigencia de carga)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 45, 'Seguridad — Botiquin (con elementos mínmos para primeros auxilios)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 46, 'Seguridad — Conos (estado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 47, 'Seguridad — Gata (estado y sin filtraciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 48, 'Seguridad — Llave de Rueda (estado, sin golpes o deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 49, 'Seguridad — Reflectantes (existencia, estado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 50, 'Seguridad — Triángulos (existencia, estado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 51, 'Seguridad — Balizas (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 52, 'Seguridad — Alarma Retroceso (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 53, 'Seguridad — Cuñas (existencia)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 54, 'Seguridad — Pertiga (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 55, 'Otros accesorios — Balde (quebraduras, deformaciones, ajuste pasadores)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 56, 'Otros accesorios — Horquilla (deformaciones, ajuste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 57, 'Otros accesorios — Jaula (deformaciones, quebraduras)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 58, 'Otros accesorios — Capacho (deformaciones, roturas, quebraduras)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 59, 'Otros accesorios — Yugo (deformaciones, roturasm quebraduras)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 60, 'Equipos de hormigon — Agitadores (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 61, 'Equipos de hormigon — Bomba de Hormigón(funcionamiento, filtarciones, golpes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 62, 'Equipos de hormigon — Cooper (limpieza)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 63, 'Equipos de hormigon — Motor Vibrador (funcionamiento, conexiones aisladas)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 64, 'Equipos de hormigon — Parrilla (soportación y desgaste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 65, 'Equipos de hormigon — Tubos (desgaste, soltura)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 66, 'Equipos de hormigon — Sensores de Carrera (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 67, 'Equipos de izaje — Alineación y Estado General Pluma (desgaste, daño estructural)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 68, 'Equipos de izaje — Cable Huinche Auxiliar (alambres cortados, deformación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 69, 'Equipos de izaje — Cable Huinche Principal (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 70, 'Equipos de izaje — Cable de Amantillo (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 71, 'Equipos de izaje — Cable de Elevación (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 72, 'Equipos de izaje — Cable de Carro (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 73, 'Equipos de izaje — Cable de Montaje (idem anterior)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 74, 'Equipos de izaje — Limitadores de Carro (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 75, 'Equipos de izaje — Limitadores de carga máxima (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 76, 'Equipos de izaje — Limitadores de Subida y Bajada de Gancho (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 77, 'Equipos de izaje — Limitador de Traslación (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 78, 'Equipos de izaje — Corona, Piñones y Rodillos de Tornamesa (soltura de pernos, lubricación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 79, 'Equipos de izaje — Freno y Seguro de tornamesa (regulación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 80, 'Equipos de izaje — Contrapesos (alineación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 81, 'Equipos de izaje — Descansos (desgaste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 82, 'Equipos de izaje — Destorcedor de Pluma (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 83, 'Equipos de izaje — Elemento de Torre (apriete pernos, ajuste, deslizamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 84, 'Equipos de izaje — Contrapluma (estructura, fijación pasadores)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 85, 'Equipos de izaje — Sistema de Giro (funcionamiento, consumo de motores)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 86, 'Equipos de izaje — Sistema de Elevación (regulación freno, deslizamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 87, 'Equipos de izaje — Sistema de Distribución de Pluma (polines, poleas, alineamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 88, 'Equipos de izaje — Sistema de Traslación (consumos motores, aprietes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 89, 'Equipos de izaje — Polines, Pernos y Pasadores (solturas, aprietes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 90, 'Equipos de izaje — Ganchos (seguros, fisuras, destorcedor)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 91, 'Equipos de izaje — Guías de Cable (desgastes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 92, 'Equipos de izaje — Catalinas (desgaste, funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 93, 'Equipos de izaje — Pendantes y Separadores (golpes, cortaduras)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 94, 'Equipos de izaje — Trinquete (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 95, 'Equipos de izaje — Jib y Pasadores (deformaciones, golpes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 96, 'Equipos de izaje — Sistema PAT (carrete, cables, funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 97, 'Equipos de izaje — Seguros de Ganchos (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 98, 'Equipos de izaje — Comandos Superiores (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 99, 'Equipos de transporte de carga — Cadenas (desgastes)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 100, 'Equipos de transporte de carga — Estado de Piñas (desgastes, fijación)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 101, 'Equipos de transporte de carga — Estado de Tablones o Plataforma (quebraduras, deformaciones, etc.)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 102, 'Equipos de transporte de carga — Quinta Rueda (impactados, cortes y desgaste excesivo en banda de rodadura)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 103, 'Equipos de transporte de carga — Estado de Tolva (quebraduras, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 104, 'Equipos de transporte de carga — Puente Auxiliar (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 105, 'Equipos de transporte de carga — Gancho y Pasador de Tiro (deformaciones, desgaste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 106, 'Equipos de transporte de carga — Contrapesos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 107, 'Equipos de transporte de carga — Eslingas con Chicharras (desgaste)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 108, 'Equipos estacionarios — Chicagos y/o Acoples', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 109, 'Equipos estacionarios — Llaves de Bola (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 110, 'Equipos estacionarios — Unidad Compresora (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 111, 'Equipos estacionarios — Unidad Generadora (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 112, 'Equipos estacionarios — Vávula de Alivio (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 113, 'Equipos estacionarios — Piolas de Levante (alambres coratdos, deformaciones)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 114, 'Equipos estacionarios — Focos y Ampolletas (funcionamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 115, 'Equipos estacionarios — Amortiguadores de puertas (funcionamiento)', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-27 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-27';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-27', 'Check List Movimiento de Tierra', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe un control de las maquinarias y camiones en forma diaria?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Todas las maquinarias cumplen con la documentación legal?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los choferes tienen su licencia de conducir al día?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existe un área definida para el lavado de los ruedas de camiones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Las maquinarias se encuentran en buenas condiciones de funcionamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los camiones se encuentran en buenas condiciones de funcionamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los operadores de maquinarias se encuentran capacitados en base al procedimiento de operación de esta?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existen señaleros para la circulación segura de los camiones y maquinarias?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿El área del movimiento de tierra se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Los camiones tienen carpas en buenas condiciones para proteger la carga al salir de la obra?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-28 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-28';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-28', 'Check List Señalética', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe señalética indicativa de E.P.P al ingresar a la Obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se señalizan adecuadamente extintores y equipos de emergencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se señalizan correctamente los tableros eléctricos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existen letreros de advertencia para trabajos en altura y caída de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se advierte la capacidad máxima de andamios y plataformas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se señalizan las excavaciones existentes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe letrero indicativo con la velocidad máxima al interior de la Obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe señalización para indicar el ingreso y salida de camiones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se mantiene en buen estado y bien afianzada la señalética de la Obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se identifican los peligros con su correspondiente letrero de advertencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se mantiene en lugar visible la señalética en todas las áreas de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Existe señalización de las vías de evacuación y puntos de reuniones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Existe panel informativo con información actualizada de SSOMA?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-30 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-30';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-30', 'Check List Arnés de Seguridad', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Las fibras del tejido o correa están exentas de roturas, grietas o desgaste excesivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Las costuras se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Las partes metálicas del arnés están libres de corrosión?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El arnés de seguridad está libre de quemaduras y de sustancias químicas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El mosquetón cuenta con doble seguro y éste cierra sin trabamientos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los ganchos, hebillas y mosquetones están libres de deformaciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿La línea de sujeción (estrobo o cola de seguridad) está bien trenzada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿La línea de sujeción (estrobo o cola de seguridad) es flexible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿La línea de sujeción (estrobo o cola de seguridad) sin cortes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se identifican los arneses que han soportado alguna caída de trabajador?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-33 · 7 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-33';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-33', 'Check List Reconocimiento y Motivación', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe plan con parámetros de premiación para la Obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se publican los requisitos para participar en la premiación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se mantiene registro de trabajadores premiados y amonestados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se da cumplimiento a la premiación cuando se cumplen las metas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Participa el Administrador en las ceremonias de premiación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Participa el Comité Paritario en la definición de los candidatos para la premiación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se difunde lista de acciones causantes de amonestación?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-35 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-35';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-35', 'Check List Excavaciones', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se señalizan y protegen las excavaciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los taludes se realizan conforme a mecánicas de suelos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se acopia el material a 0,5 m como mínimo del borde de la excavación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La circulación de maquinarias o equipos con vibración se mantiene a una distancia de 1,5 veces la profundidad de la excavación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existen escalas de ingreso y evacuación a no más de 15 m entre ellas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existen pasarelas para el tránsito de trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe estudio de mecánica de suelos con calicatas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe entibación de zanjas con profundiad superior a 1,2 m? (cuando no existe estudio de mecánica de suelos que indique lo contrario)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se colocan rodapiés o similares para evitar la caída de objetos al interior de la excavación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se mantine una iluminación adecuada al interior y proximidad de las excavaciones?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-36 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-36';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-36', 'Check List Estación de Emergencia', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El area de trabajo cuenta con una estación de emergencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existe un cuadrilla de emergencia entrenada en el area de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los extintores se encuentran en buanas condiciones y certificados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La camilla de rescate se encuentra en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existen frazadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe un medio sonoro de alarma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se encuentra identificado el punto de encuentro, despejado y seguro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe un listado con personal de la obra capacitadas en primeros auxilios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se encuentra identificado al encargado de la estación de emergencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿La estación de emergencia se encuentra obstaculizada?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-37 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-37';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-37', 'Check List Código de Colores', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se implementa el código de colores en bombas y compresores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se implementa el código de colores en sistemas de alarmas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se implementa el código de colores en herramientas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se implementa el código de colores en elementos auxiliares para el manejo de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se implementa el código de colores en elementos de izaje?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe bandera u otro medio de publicación en bodega y lugares visibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se retira el color del mes anterior? (doble marca)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿El distintivo de revisión se implementa conforme a calendario preestablecido?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Conocen los trabajadores el significado del procedimiento de mantención del código de colores?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-38 · 16 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-38';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-38', 'Check List Herramientas Manuales', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Los mangos se encuentran firmes, sin trizaduras y sin astillas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Cabezas de martillos, macetas y combos sin rebabas ni cabeza roma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Alicates, tenazas o caimanes sin mandíbulas gastadas o sueltas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Alicates, tenazas o caimanes sin filo o mellado en la parte cortante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La hoja de sierras y serrucho se encuentran bien colocadas y sin torceduras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los dientes de hoja de sierras y serrucho se encuentran bien afilados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Las bocas de llaves y dados se encuentran libres de deformaciones y grietas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Las hojas de destornilladores están sin melladuras o torcidas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los vástagos de destornilladores están bien templados y sin torceduras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Los puntos y cinceles presentan cabezas sin saltaduras o rebordes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Los mangos de puntos y cinceles son suficientemente largos? (minimo 15cm)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Las limas y escofinas cuentan con mangos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Las puntas de las limas se encuentran libres de trizaduras o con grasa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Las hojas de llanas y espátulas se encuenttran sin curvaturas, agrietadas o rotas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿Las hojas de cuchillos están bien afiladas y sin melladuras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Cuchilos cuentan con vainas de protección?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-39 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-39';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-39', 'Check List Herramientas Eléctricas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El enchufe es tipo industrializado y se encuentra en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los interruptores se encuentran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los diferenciales y automaticos se encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Los cables se encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Las conexiones se encuentran bien hechas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los conductores poseen cable con protección a tierra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿La carcaza de la herramienta se encuentra en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿La herramienta cuenta con mango de sujeción?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿La herramienta cuenta con el codigo de color del mes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se ha realizado mantención a la herramienta?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-40 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-40';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-40', 'Check List Orden y Aseo', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El sistema de iluminación permanece limpio y en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los equipos de extinción están accesibles y debidamente identificados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los pasillos permanecen limpios y despejados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existen áreas de tránsito definidas al interior de la Obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los pisos permanecen libres de obstáculos o sustancias deslizantes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe número adecuado de contenedores para residuos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Las herramientas son guardadas en forma ordenada y protegidas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe un lugar definido para el estacionamiento de máquinas y equipos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se controla los despuntes con clavos doblados o libres de éstos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Las extensiones eléctricas se mantienen por vía aérea?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Existen sectores definidos para el acopio de diferentes materiales?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-41 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-41';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-41', 'Check List Sierra Circular', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El cable y enchufe de alimentación está en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Herramienta cuenta con código de color del mes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿El protector de la hoja está operativo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La hoja de la sierra está en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '(Sin dientes saltados o quebrados, sin savia de resinas pegada)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿El botón de encendido está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe mesón de trabajo estable?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Lugar de trabajo libre de obstáculos y de sustancias deslizantes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Trabajador autorizado para operar la herramienta?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-42 · 16 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-42';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-42', 'Check List Esmeril Angular', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El esmeril cuenta con una cubierta o casquete de protección del disco, encontrándose bien ajustado y en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿La parte expuesta del disco presenta un ángulo máximo de abertura de 180° (grados)?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se mantiene una adecuada presión sobre la herramienta, evitando golpes y torsiones laterales sobre el disco?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La velocidad máxima indicada en el disco en r.p.m es igual o superior al esmeril angular?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se evita el almacenamiento del esmeril angular en lugares donde no quede expuesto a golpes producidos por otras herramientas o por golpear sus caras laterales contra otros objetos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se guarda en la bodega en un lugar limpio y seco?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿El tipo de disco es el apropiado conforme a un trabajo de corte o desbaste?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿El montaje del disco es correcto para evitar trizaduras y destrucciones bruscas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los flanges son adecuados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se ajusta adecuadamente el disco, evitando trizaduras, mal ajuste al eje y roces con el casquete protector del disco?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿El operador utiliza el disco de desbaste por su periferia (cara esmeriladora)?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿El esmeril posee aislación a tierra de fábrica?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El cable de alimentación se mantiene en buenas condiciones y cuenta con enchufe industrial?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿El operador usa ropa ajustada y adecuada, evitando el empleo de mangas largas, ropa suelta u otros elementos que impidan la sujeción firme y manipulación segura del equipo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El operador del esmeril utiliza todos sus elementos de protección personal? (Protector facial, anteojos de seguridad, protector auditivo, casco de seguridad, guantes, coleto, polainas y zapatos de seguridad)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Herramienta cuenta con el código del color del mes?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-43 · 9 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-43';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-43', 'Check List Cilindro de Gases Comprimidos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Los cilindros se encuentran con la identificación del producto en forma visible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se encuentran separados los cilindros llenos de los que estan vacios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se encuentran separados los cilindros de gas combustible de los de oxigeno?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Los cilindros de gases comprimidos se encuentran expuestos a fuentes de ignición?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los cilindros de gases comprimidos se encuentran ubicados en posición vertical?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los cilindros de gases comprimidos son transportados sobre un carro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los cilindros de gases comprimidos se encuentran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los cilindros de gases comprimidos se encuentran con casquete protector?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Las valvulas de los cilindros se encuentran cerradas?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-45 · 7 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-45';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-45', 'Check List Sustancias Peligrosas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Trabajador esta capacitado para manipular adecuadamente la sustancia peligrosa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Trabajador conoce la hoja de seguridad de la sustancia peligrosa que utilizará?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La sustancia peligrosa se encuentra identificada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El area de trabajo donde se aplicara la sustancia peligrosa se encuentra libre de fuentes de ignición?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Trabajador cuenta con un medio para combatir una emergencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Trabajador cuenta con un envase adecuado para el traslado de la sustancia peligrosa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Trabajador posee un medio seguro para el trasvasije de la sustancia peligrosa?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-46 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-46';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-46', 'Check List Manejo Manual de Materiales', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El trabajador ha recibido capacitación y entrenamiento en técnicas en manejo manual de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Trabajador utiliza guantes apropiados para el traslado de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Las vías para el tránsito de materiales están expeditas y bien iluminadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El peso del material es menor a 25 kg?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existe coordinación para trasladar material entre 2 o más trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se protege el traslado de materiales contra caídas a pisos inferiores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se evita el traslado de materiales al subir por escala?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los elementos auxiliares se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se evita la sobrecarga de los elementos auxiliares?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿El traslado con elementos auxiliares se realiza con una distribución estable?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-47 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-47';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-47', 'Check List Manejo de Moldajes', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se realiza la secuencia correcta tanto al retirar como al colocar el moldaje?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se aisla e identifica la zona de descimbre?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se resguarda que no existan trabajadores bajo la zona de caída del moldaje cuando se quita el apuntalamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se ulilizan los aparejos adecuados para el traslado de moldaje con grúa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se utilizan guía (vientos) para dirigir el moldaje durante su traslado con grúa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe la colocación suficiente de alzaprimas conforme a indicaciones del plano?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se prohíbe el uso de la grúa para liberar moldajes anclados total o parcialmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se evita el derrame del desmoldante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿El moldaje se acopia en sectores previamente definidos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Los accesorios del moldaje permanecen en canastillos o en recipientes adecuados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se evita el uso de fierro de construcción como pasador en el alzaprimado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se evita el almacenamiento vertical de alzaprimas (riesgo de caída?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Se controla que el moldaje no quede apoyado sobre muro sin afianzarse?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-48 · 14 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-48';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-48', 'Check List Enfierradura', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existen equipos de izaje para la descarga de enfierradura en la obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existen elementos de izaje certificados para realizar maniobras de enfierradura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se conoce el peso de los paquetes de enfierradura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existe un área para el acopio de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los trabajadores estan capacitados en técnicas de enfierraduras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los trabajadores emplean técnicas de levantamiento correcto?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Trabajador utiliza guantes apropiados para el traslado de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Las vías para el tránsito de materiales están expeditas y bien iluminadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se traslada manualmente enfierraduras con peso menor a 50 kg.?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe coordinación para trasladar material entre 2 o más trabajadores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se protege los extremos sobresalientes de las estacas de fierro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Los equipos de corte de enfierradura se encuentran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Los trabajadores que realizan corte de fierro con esmeril angular utilizan la careta facial?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Existe un deposito para el acopio de despuntes de enfierradura?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-49 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-49';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-49', 'Check List Hormigonado', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Los trabajadores estan capacitados respecto al hormigonado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Los trabajadores cuentan con EPP apropiados para la tarea?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Las vías para el tránsito se encuentran están expeditas y bien iluminadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Los equipos se encuentran en buenas condiciones de funcionamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existe coordinación para el vaciado del hormigón?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se protegen las áreas adyacentes o niveles inferiores contra la caídas de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los andamios o plataformas de trabajos se encuentran aprobados para su utilización?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los accesos se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Existen lineas eléctricas identificadas en las áreas de maniobras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Las carreras se encuentran libres de hormigón?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Existe un acopio de residuos de hormigón en el area de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Las mallas de enfierradura se encuentran protegidas con placas para realizar el?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿hormigonado de losa?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-50 · 8 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-50';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-50', 'Check List Trabajos en Caliente', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe un permiso de trabajo para realizar la tarea?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se han identificado los peligros del área de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se ha instruido a los trabajadores acerca de los riesgos de la tarea?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se encuentra identificada el área de trabajo en caliente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El área de trabajo se encuentra libre de fuentes de ignición?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Existe un extintor en el área de trabajo en caliente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existe un vigia para realizar el trabajo en caliente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los equipos adyacentes al área de trabajo se encuentran protegidos?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-52 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-52';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-52', 'Check List Escalas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Escala cuenta con inclinación de apoyo adecuada? (Entre 70 y 75°)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿El ángulo de abertura de la escala de tijera es el correcto? (Hasta 30° como máximo)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿El apoyo es estable, prohibiendo su ubicación sobre superficies improvisadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Escala sobresale por lo menos 1 m más arriba del apoyo superior?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Escala cuenta con afianzamiento en su parte superior e inferior?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se mantienen peldaños en buen estado y libres de sustancias deslizantes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿El espaciamiento de los peldaños es el adecuado? (No mayor de 30 y menos de 25 cm)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Pelaños encajados o reforzados evitando sólo clavarlos en los largueros?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se prohíbe el uso de pino en la construcción de escalas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se evita pintar las escalas de madera para descubrir las grietas? (Uso sólo de barníz transparente)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se prohíbe el uso de escalas metálicas cerca de circuitos o líneas eléctricas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Las escalas de acero o alumnio están libres de cantos filudos en las zonas de uniones por soldadura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Las bases de la escala cuentan con una superficie antideslizante?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-53 · 23 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-53';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-53', 'Check List Andamios', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe memoria de cálculo por parte del proveedor para los andamios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Cuenta con señalética de caída de materiales y de su capacidad máxima de carga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Andamios cuentan tarjeta verde o roja conforme a su esta de operación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se instalan lejos de tendidos eléctricos? (3 m para líneas de tensión de hasta 5.000 V)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El piso de sustentación del andamio es sólido, parejo y absolutamente estable?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Cuenta con arriostramiento o apuntalamiento suficiente para evitar su caída?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los pie derecho cuentan con base firme o placa base para su sustentación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los andamios se encuentran bien nivelados y aplomados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se retiran objetos o elementos inestables de los andamios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se conoce la resistencia del andamio y se evita su sobrecarga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Cuentan con barandas y rodapiés?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se prohíbe el uso de andamios tipo catre sobre los 2 cuerpos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿Se prohíbe el uso de tablones de pino?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Diagonales cuentan con chavetas y no con clavos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿Se cubre totalmente la superficie con los tablones o bandejas suficientes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Andamio cuenta con accesos interiores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿La superficie del andamio es antideslizante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, '¿Los elementos metálicos cuentan con protección contra la corrosión? (Pintura anti-óxido o galvanizado)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, '¿Se señaliza el primer cuerpo del andamio en aquellos casos que se ubiquen próximos a vías de circulación de vehículos o maquinaria?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, '¿Andamios móviles cuentan con ruedas con frenos operativos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, '¿Se prohíbe el armado de andamios móviles cuando excede 3 veces la altura del primer catre?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, '¿Los andamios colgantes cuentan con cuerda de vida independiente de la plataforma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, '¿Los andamios colgantes móviles cuentan con dispositivos de freno automático?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-55 · 12 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-55';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-55', 'Check List Trabajos en Altura', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se utiliza arnés de seguridad con anclaje sólido en trabajos por sobre 1,8 m?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se emplea un absorbedor de impacto (shock absorver) en trabajos por sobre los 5 m?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se utilizan 2 colas de seguridad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se controla que los trabajos en altura sean desarrollados por más de 1 trabajador para que en caso de accidente se dé aviso en forma inmediata?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se asegura que tanto herramientas manuales como materiales no caigan a niveles inferiores?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se emplea el barbiquejo en todo trabajo en altura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se instalan delimitaciones y señales de advertencia en las áreas donde pueda caer herramientas o materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se instalan líneas de vida de cable acerado de 1/2" de diámetro con sus extremos fijos a la instalación existente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se instalan debidamente las grapas crosby en las líneas de vida?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se prohíbe el uso de cordeles de ifbra u otros elementos de sujeción para reemplazar cables de acero?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿La distancia máxima de la línea de vida es de 15 m?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Las líneas de vida son usadas por 2 trabajadores como máximo, entre soportes?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-56 · 8 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-56';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-56', 'Check List Pantallas de Protección', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se instalan las pantallas a una distancia no mayor a 7 m desde la losa de avance?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Se prohíbe su elaboración con fierro de construcción?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Se instalan con una inclinación a la horizontal, entre 30° y 45°?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se implementa el sistema de suspensión con cable acerado y no alambre y fibras sintéticas o naturales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se installan 3 grapas crosby en los cables de sujeción en la posición correcta?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se realiza la limpieza periódica de las pantallas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se detiene la operación en niveles superiores e inferiores cuando se suben las pantallas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se encuentran libres de óxido, desgaste, deformaciones, daños o deterioros que afecten la resistencia de la pantalla?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-57 · 8 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-57';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-57', 'Check List Eslingas de Cadenas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se retira la suciedad, aceite, grasa o similares que puedan ocultar imperfecciones, antes de la inspección?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Eslabones se encuentran libres de mellas, estrías, muescas transversales agudas, abolladuras, marcas y superficies pulidas que pueden debilitar los eslabones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Eslabones se encuentran sin fracturas o fisuras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Las cadenas que no se están usando se mantienen en soportes colgadas y en orden?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los grilletes y acoplamientos son los adecuados a la eslinga de cadena?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Las cadenas están libres de corrosión severa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se identifican las eslingas de cadena que no están operativas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se mide el largo de los ramales de la eslinga par verificar elonganciones?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-58 · 12 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-58';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-58', 'Check List Cables de Acero, Eslingas/Estrobos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Están libres de cocas y distorsión de alambres y torones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Sin estiramiento o alargamiento del cable?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Corte inferior a 3 hebras por lay o 5 en total en diferentes torones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Libres de cocas o jaulas de pájaro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Exentos de corrosión?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Lubricación adecuada, evitando la sequedad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Libres de torcimiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Condición adecuada del alma o soporte central?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Medición normal del diámetro del cable?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Alambres sin desgaste?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Ausencia de abuso mecánico?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Existe lugar definido de almacenamiento?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-59 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-59';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-59', 'Check List Ganchos y Grilletes', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Cuenta con seguro del gancho operativo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Ausencia de desgaste o deformación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Ausencia de grietas y fisuras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Ausenica de torcedura en ojal y plano del gancho?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Abertura de la garganta sin distorsión excesiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Pasador sin desgaste, centrado y con asentamiento normal?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Abertura de la boca normal?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Ausencia de torceduras o dobladuras?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Puntos de resistencia sin deficiencias?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe lugar de almacenamiento definido?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-60 · 15 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-60';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-60', 'Check List Compresor', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿La estructura del compresor se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿El compresor tiene sistema de minimización acustica en su estructura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Las puetras del compresor tienen chapa y/o candado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El motor del compresor se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Las mangueras del compresor se encuentarn en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Las uniones chicago se encuentran protegidas con cadenas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Los neumaticos del compresor se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Las correas de transmición se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿El radiador se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Las valvulas de los cilindros se encuentran cerradas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Los indicadores de Tº se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Los manometros se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El compresor tiene fugas de aceite?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Existe un programa de manetención del compresor?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El compresor tiene señaletica de advertencia de peligros?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-66 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-66';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-66', 'Check List Soldadura y Oxicorte', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El equipo de oxicorte se encuentra en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿El equipo de oxicorte cuenta con valvula anti retroceso de las llamas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los cilindros de gas se encuentran asegurados con cadenas sobre un carro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Las valvulas sen encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Los manometros se encuentran en buen estado de funcionamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Las uniones de las mangueras son de bronce y se encuentran aseguradas con abrazaderas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿El operario se encuentra con todo sus EPP adecuados y libres de combustibles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿El área de trabajo se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿El área de trabajo se encuentra libre de combustibles inflamables en todos los niveles?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿En espacios confinados se realiza una medición de gases explosivos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿El operario cuenta con un extintor disponible en el lugar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Existen en el área de trabajo biombos o pantallas de protección?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El equipo de soldadura y oxicorte se revisa de acuerdo al codigo de color?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-70 · 50 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-70';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-70', 'Check List Uso de Canastillo', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Canastillo con grua — ¿Canastillo ha sido diseñado por ingeniero estructural?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Canastillo con grua — ¿Diseño considera factor de seguridad 5?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Canastillo con grua — ¿Soldadura ha sido diseñada con factor de seguridad 5?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Canastillo con grua — ¿Soldaduras han sido realizadas por personal calificado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Canastillo con grua — ¿Argolla y grilletes de suspensión al gancho minimizan balanceo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Canastillo con grua — ¿Superficie de trabajo interior cuenta con 1.2 m como mínimo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Canastillo con grua — ¿La protección perimetral es sólida?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Canastillo con grua — ¿Aberturas de la protección perimetral no mayores a 1.5 cm?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Canastillo con grua — ¿Puerta abre hacia adentro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Canastillo con grua — ¿Puerta tiene cerradura positiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Canastillo con grua — ¿Pasamanos internos a 1 m de altura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Canastillo con grua — ¿Canastillo cuenta con techo de protección?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Canastillo con grua — ¿Superficies internas son lisas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Canastillo con grua — ¿Cuenta con letrero indicando tara y N° trabajadores y la capacidad máxima de carga del canastillo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Canastillo con grua — ¿Canastillo está pintado para mayor visibilidad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Canastillo con grua — ¿Canastillo cuenta con conexiones para vientos guías?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Accesorios de levante — ¿Se han seleccionado los accesorios de levante considerando un factor de seguridad 5?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Accesorios de levante — ¿Accesorios de levante están en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Accesorios de levante — ¿Gancho de grúa cuenta con cierre de seguridad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Accesorios de levante — ¿Se cuenta con cable de seguridad adicional enlazado por sobre el gancho de la grúa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Accesorios de levante — ¿Existe certificación de calidad en todos los accesorios de levante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Condiciones de seguridad de la grua — ¿Grúa cuenta con inclinómetro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Condiciones de seguridad de la grua — ¿Existe limitador automático de carrera del gancho?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Condiciones de seguridad de la grua — ¿Existe indicador de la extensión de la pluma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Condiciones de seguridad de la grua — ¿Cuenta con caída libre del gancho bloqueada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Condiciones de seguridad de la grua — ¿Los frenos, trinquetes y prensas están en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Condiciones de seguridad de la grua — ¿Cuenta con indicador de momento de carga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Condiciones de seguridad de la grua — ¿Existe controlador de velocidad manual (máx 30 m/min)?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Condiciones de seguridad de la grua — ¿Existe tabla de carga en español?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Condiciones de seguridad de la grua — ¿Existe señalética en español?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Condiciones de seguridad de la grua — ¿Cuenta con control de izamiento de la pluma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 32, 'Posicionamiento de la grua — ¿La grúa esta nivelada (No más de 1% de su nivel total?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 33, 'Posicionamiento de la grua — ¿El terreno está compactado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 34, 'Posicionamiento de la grua — ¿Se extienden completamente los gatos hidráulicos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 35, 'Posicionamiento de la grua — ¿Se usan bases bajo los gatos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 36, 'Prueba de carga — ¿El peso a usar en la prueba está certificado (200% del peso que se pretende levantar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 37, 'Prueba de carga — ¿Se inspecciona la grúa después de la prueba?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 38, 'Prueba de carga — ¿Se inspeccionan los accesorios de levante después de la prueba?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 39, 'Prueba de carga — ¿La prueba de carga es realizada satisfactoriamente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 40, 'Prueba de carga — ¿Se inspecciona el canastillo después de la prueba?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 41, 'Prueba de carga — ¿Se inspecciona el terreno después de la prueba?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 42, 'Coordinacion de la maniobra — ¿Se realizó un ART estableciendo las responsabilidades de todos los involucrados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 43, 'Coordinacion de la maniobra — ¿Se definieron los ayudantes a cargo de los vientos guías?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 44, 'Coordinacion de la maniobra — ¿Existen métodos y puntos de anclaje de protección contra caídas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 45, 'Coordinacion de la maniobra — ¿Existen métodos y medios de acceso y egreso del canastillo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 46, 'Coordinacion de la maniobra — ¿Existen puntos de aseguramiento del canastillo a la estructura sólida más próxima?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 47, 'Condiciones de operación — ¿Todos los trabajadores cuentan con arneses de seguridad en el canastillo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 48, 'Condiciones de operación — ¿Se cuenta con radios de comunicación en perfectas condiciones de operación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 49, 'Condiciones de operación — ¿Existe visibilidad entre rigger y operador?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 50, 'Condiciones de operación — ¿La velocidad del viento es inferior a 35 km. por hora?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-71 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-71';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-71', 'Check List Protección a Radiación UV', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Se evidencia la capacitación en los riesgos de la radiación UV y sus medidas de control?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existe letrero indicativo de niveles de radiación ultravioleta?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Trabajadores conocen significado de letrero indicador de niveles de radiación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Existe dispensador de bloqueador solar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se mantiene en Bodega la resolución de bloqueador del Instituto de Salud Pública?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Trabajadores expuestos utilizan adecuadamente el bloqueador solar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se registra la entrega inicial del bloqueador solar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Talleres cuentan con protección contra la radiación UV? (Toldos, mallas, techos, etc)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se evita el uso de manga corta en trabajadores expuestos a la radiación UV?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se mantiene número suficiente de dispensadores de agua y están protegidos del sol?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se utilizan biombos o pantallas en los trabajos con soldadura?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-72 · 17 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-72';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-72', 'Check List Bodega de Residuos Peligrosos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Las paredes de la bodega son de malla metálica?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿La base de la bodega es un radier de hormigon inpermeable con pretil de contención de derrames?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La bodega de residuos peligrosos se encuentra separada de las otras bodegas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La bodega de residuos peligrosos se encuentra señalizada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Existe un encargado de la bodega?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿La bodega cuenta con un equipo de extinción de incendios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Existen medios para contener derrames de residuos peligrosos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Los depositos y recipientes de sustancias peligrosas se encuentran en buen estado y son adecuados para las características de cada residuo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Los contenedores de residuos peligrosos se encuentran rotulados de acuerdo a Norma?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe un medio de trasvasije de residuos peligrosos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Los recipientes y depositos de residuos peligrosos se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se encuentran disponibles las hojas de seguridad de cada uno de los residuos peligrosos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿almacenados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿El acceso a bodega se encuentra despejado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El área circundante a la bodega tiene vías de tránsito despejadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿La bodega cuenta con un listado actualizado de números de contacto y emergencia y estos estan en un lugar visible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿La bodega cuenta con plano de distribución de residuos al interior de esta?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-73 · 17 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-73';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-73', 'Check List Bodega', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe un encargado responsable de la bodega (Jefe de Bodega)?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿La bodega cuenta con letrero informativo de "BODEGA"?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La bodega cuenta con un medio informativo de código de color del mes, visible a lo menos 15 mts?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se ha implementado el código de color del mes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La bodega cuenta con vías de tránsito y de evacuación de personal y estas se encuentran despejadas y libre de obstaculos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Las vías de evacuación se encuentran señalizadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿La bodega cuenta con equipos de extinción de incendios?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿La bodega cuenta con estanterias y/o repizas suficientes para el almacenamiento de materiales, equipos y herramientas de obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿La bodega se encuentra limpia y ordenada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Los extintores de obra cuentan con la certificación correspondiente según el DS 369?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Los patios de almacenamiento cuentan con vías de tránsito definidas y despejadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Se cuenta en Bodega con las certificaciones de los EPP?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿La bodega cuenta con un área definida de productos "NO CONFORMES"?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿La bodega de obra cuenta con un Stock minimo de EPP?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El Jefe de Bodega conoce su responsanbilidad en el almacenamiento de las sustancias peligrosas, gases, combustibles y residuos peligros de la obra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Se utilizan medios mecanicos de manipulación y traslado, cuando las cargas son mayores a 25 kg?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿Se encuentran identificados y rotulados todos los productos quimicos de uso en terreno y estos cuentan con sus correspondientes hojas de seguridad?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-78 · 23 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-78';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-78', 'Check List Extintores Portátiles', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El extintor está clasificado para el vehículo u otra aplicación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Tiene el extintor número de identificación interno?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿El extintor está ubicado en el lugar adecuado y en posición correcta?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El extintor se encuentra claramente visible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El extintor se encuentra señalizado adecuadamente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿El soporte del extintor está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se encuentra adecuadamente montado sobre un tablero o al interior de un gabinete de protección?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿El tablero o gabinete se encuentra pintado con franjas diagonales de colores alternados Rojo y Blanco?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿El acceso al extintor se encuentra expedito y libre de obstáculos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Se observan signos o señales de corrosión en el cilindro extintor?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Hay evidencias de daños y averías mecánicas? (signos de golpes, abolladuras, corrosión u otros daños)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿El extintor presenta condiciones de suciedad? (exceso de polvo, manchas aceite, pinturas, etc.)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿La pintura del extintor está descascarada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Ha sido expuesto a condiciones ambientales que pueden interferir en su funcionamiento? (Tª extremas, humos)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El pasador de seguridad de la manija de descarga se encuentra adecuadamente en su lugar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿El conjunto manguera y acoples está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿La boquilla de descarga está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, '¿La manija de descarga está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, '¿El mango de transporte está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, '¿Mantiene visibles y legibles las marcas y etiqueta de identificación y placa de instrucciones? Decreto Nº 369', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, '¿Mantiene visibles y legibles las etiquetas de última revisión del Servicio Técnico/Mantención, según DS Nº369?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, '¿El manómetro de presión (indicador de carga) está en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, '¿La aguja del manómetro se encuentra marcando la zona de color verde? (extintor con carga normal)', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-79 · 10 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-79';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-79', 'Check List Protección Vanos y Shaft', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿Existe iluminación adecuada en las áreas de vanos y shaft?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existe resguardo para los trabajadores para evitar su caida y la de htas. y materiales cuando se instala la protección de vanos y/o shaft?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La protección impide tanto la caída de personas como de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿Se encuenra señalizada con el riesgo de caida por shaft y/o vano?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿Se demarca la zona cada vez que se intervengan los shaft y/o vanos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Se vuelven a proteger los shaft una vez que se realiza el traslado de materiales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Las protecciones se encuentran fijas para evitar su desplazamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Se controla que los shaft y vanos no sean utilizados para arrojar residuos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se evita la acumulación de materiales o de apoyo de trabajadores en las protecciones de shaft y/o vanos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Existe ART para realizar los trabajos de protección o e intervención de Shaft y Vanos?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-81 · 8 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-81';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-81', 'Check List Eslingas Sintéticas', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿La eslinga cuenta con su etiqueta de identificación de carga legible?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿La eslinga presenta quemaduras acidas o carbonizadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿La eslinga presenta agujeros, rasgaduras, cortes o roturas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿La eslinga presenta desgaste abrasivo (por roce) excesivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿La eslinga presenta costuras rotas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿La eslinga presenta algun otro daño visible que ponga en duda su resistencia?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Se cuenta con una funda de protección para cantos vivos o superficies rugosas del elemento a izar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Existe lugar definido de almacenamiento?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-85 · 31 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-85';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-85', 'Check List Grúa Torre (Componentes)', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Sistema traslación — Frenos de carril en vías de desplazamiento', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Sistema traslación — Limitador de Traslación sobre vías', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Sistema traslación — Control de temperatura de trabajo de motores eléctricos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Sistema traslación — Garras de los bogíes (correcta fijación) y otro medio de anclaje', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Sistema traslación — Coronas dentadas de ruedas de los bogíes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Sistema traslación — Coronas de bolas para dispositivo especial de vía curva', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Sistema traslación — Desgaste de las guarniciones de los frenos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Sistema traslación — Verificación de la continuidad del eclipsado eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Sistema traslación — Motor eléctrico de traslación', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Sistema traslación — Relé Diferencial de protección de circuito eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Sistema traslación — Rejillas de protección en aventuras de ventilación del motor eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Sistema elevación — Poleas del gancho de trabajo (agrupamiento, rodamiento)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Sistema elevación — Limitador de Elevación y bajada del gancho', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Sistema elevación — Cable del gancho (picaduras, engrase)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Sistema elevación — Paso del cable de elevación y de distribución', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Sistema elevación — Control de temperatura de trabajo de motores eléctricos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Sistema elevación — Ajustes de los limitadores con carga máxima según fabricante', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Sistema elevación — Desgaste de las guarniciones de los frenos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Sistema elevación — Rejillas de protección en aventuras de ventilación del motor eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Sistema elevación — Motor eléctrico de elevación', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Sistema elevación — Relé Diferencial de protección de circuito eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Sistema elevación — Destorcedor y pasadores del extremo del cable', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Sistema elevación — Poleas deslizantes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Sistema de giro — Control de temperatura de trabajo de motores eléctricos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Sistema de giro — Limitador Orientación (Puesta en veleta)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Sistema de giro — Piñón descubierto de tornamesa (engrase)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Sistema de giro — Corona de tornamesa (engrase)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Sistema de giro — Desgaste de las guarniciones de los frenos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Sistema de giro — Relé Diferencial de protección de circuito eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Sistema de giro — Rejillas de protección en aventuras de ventilación del motor eléctrico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Sistema de giro — Torque de los pernos de corona de giro', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-86 · 48 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-86';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-86', 'Check List Grúa Torre (Operación)', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Estabilidad — ¿La torre se encuentra aplomada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Estabilidad — ¿Los contrapesos basales se encuentran afianzados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Estabilidad — ¿Los contrapesos aéreos se encuentran bien afianzados?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Estabilidad — ¿Esta protegidas de golpes de otros equipos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Estabilidad — ¿Las vías se encuentran libres de obstaculos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Instalaciones electricas — ¿Su instalaciones eléctricas se encuentran normalizadas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Instalaciones electricas — ¿Cuenta con conexión a tierra?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Instalaciones electricas — ¿Cuenta con interruptor automatico?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Instalaciones electricas — ¿La botonera y joystic se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Instalaciones electricas — ¿La caja de comando se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Instalaciones electricas — ¿La grúa cuenta con baliza?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Instalaciones electricas — ¿Los cables eléctricos se encuentran en bues estado y sin picadura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Cabina y medio de acceso — ¿La grúa cuenta con cabina afianzada a al estructura?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Cabina y medio de acceso — ¿La cabina tiene buena visibilidad en todo su perimetro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Cabina y medio de acceso — ¿El operador se encuentra dentro de su cabina?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Cabina y medio de acceso — Las pasarelas de accesos son establesy se encuentra con barandas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Cabina y medio de acceso — ¿La escala de acceso cuenta con descanso y respaldo de seguridad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Cabina y medio de acceso — ¿La grúa cuenta con cuerda de vida vertical?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Cabina y medio de acceso — ¿El operadro cuenta con su equipo anti caídas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Mecanismo de seguridad — ¿El limitador de levante de carga máxima funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Mecanismo de seguridad — ¿El limitador de recorrido funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Mecanismo de seguridad — ¿El limitador de recorrdio del gancho funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Mecanismo de seguridad — ¿El sistema de freno funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Mecanismo de seguridad — ¿El sistema de alarma funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Mecanismo de seguridad — ¿El mecanismo de deteción funciona normalmente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Mecanismo de seguridad — ¿La gúa cuenta con programa de mantención, cual fue la última?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Cables y mecanismos de elevación — ¿Todos los cables se encuentran en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Cables y mecanismos de elevación — ¿El gancho de elevación es de color llamativo y reflectante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Cables y mecanismos de elevación — ¿El gancho de elevación tiene impreso la capacidad nominal de carga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Cables y mecanismos de elevación — ¿Estado de grilletes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Cables y mecanismos de elevación — ¿Estado eslingas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 32, 'Cables y mecanismos de elevación — ¿Estado destrobos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 33, 'Cables y mecanismos de elevación — ¿El gancho cuenta con cierre de seguridad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 34, 'Operador — ¿El operador esta capacitado a través de procedimiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 35, 'Operador — ¿El operador tiene exámen médico vigente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 36, 'Operador — ¿El operador conoce las maniobras prohibidas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 37, 'Operador — ¿El operador conoce las circunstancia para detener la grúa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 38, 'Operador — ¿El operador trabaj máximo 10 horas al día?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 39, 'Operador — ¿El operador cuenta con exámen psicotécnico equivalente a clase Nº 2?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 40, 'Operador — ¿Se encuentra en obra carpeta con los antecedentes del operador?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 41, 'Señalización — ¿La grúa cuenta con letrero de la capacidad de carga a izar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 42, 'Señalización — ¿La cabina cuenta con letrero indicando la carga de capacidad?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 43, 'Señalización — ¿Se encuentra delimitado y señalizado el área y radio0 de trabajo de la grúa?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 44, 'Rigger — ¿El rigger esta capacitado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 45, 'Rigger — ¿Conoces las Señales?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 46, 'Rigger — ¿Utiliza chaleco reflectante y casco con distintivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 47, 'Rigger — ¿Sabe estrobas la carga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 48, 'Rigger — ¿Revisa estrobos, eslingas, grilletes, ect?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-87 · 23 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-87';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-87', 'Check List Camión Pluma (Izaje)', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Los accesorios o elementos de izaje cuenta con código de color', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿Existe Procedimiento de Trabajo Seguro?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'El área está ordenada y limpia (inicio jornada)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Se realiza charla operacional de inicio de trabajo', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Personal cuenta con los EPP adecuados a la actividad', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Se cuenta con las herramientas apropiadas para el trabajo', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿Cuenta por escrito con su capacidad máxima de acuerdo a los ángulos de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Posee hoja de vida? Especifica su largo y ancho?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿Se utilizan soportes adecuados en maniobras de montaje de cañería?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿Hay maniobras de izaje sin su apoyo respectivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿Se daño la eslinga por contacto con objetos cortantes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿Area de trabajo está resguardada o restringida?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿La eslinga tiene o presenta media caña?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿Tiene nudos el estrobo o eslinga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿Existen cables energizados en contacto con áreas húmedas/agua?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Sus gazas tienen algún defeco?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿La cadena se ha elongado su largo original?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, '¿Se observa desgaste del estrobo o cadena?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, '¿Estado de grilletes?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, '¿Estado de Eslinga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, '¿Estado de estrobos?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, '¿Estado de ganchos y seguros?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, '¿Otros defectos o deformación indicar?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-88 · 61 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-88';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-88', 'Check List Camión Pluma (Vehículo)', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Carroceria — Estado asientos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Carroceria — Cinturon de seguridad', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Carroceria — Parabrisas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Carroceria — Limpia parabrisas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Carroceria — Estado plumillas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Carroceria — Estado eyector de agua', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Carroceria — Vidrios', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Carroceria — Puertas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Carroceria — Ventanas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Carroceria — Espejo interior', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Carroceria — Espejos exteriores', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Carroceria — Calefaccion', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Carroceria — Interruptores', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Carroceria — Tablero indicadores', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Carroceria — Radio transmisor', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Carroceria — Bocina servicio', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Carroceria — Alarma retroceso', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Carroceria — Luces altas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Carroceria — Luces bajas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Carroceria — Luces de freno', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Carroceria — Luces intermitentes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Carroceria — Luces retroceso', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Carroceria — Luz interior', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Sistemas hidráulico y mecanico — Nivel de aceite', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Sistemas hidráulico y mecanico — Nivel de combustible', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Sistemas hidráulico y mecanico — Nivel de agua', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Sistemas hidráulico y mecanico — Bateria', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Sistemas hidráulico y mecanico — Estado de freno servicio', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Sistemas hidráulico y mecanico — Estado freno estacionamiento', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Sistemas hidráulico y mecanico — Cilindro hidráulico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Sistemas hidráulico y mecanico — Nivel aceite hidráulico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 32, 'Sistemas hidráulico y mecanico — Estado de mangueras de presión', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 33, 'Sistemas hidráulico y mecanico — Estado de comandos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 34, 'Sistemas hidráulico y mecanico — Fuga de aceite sistemas hidraulico', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 35, 'Neumaticos — Neumaticos 1-2-3-4-5-6', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 36, 'Neumaticos — Neumatico repuesto', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 37, 'Neumaticos — Gata', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 38, 'Neumaticos — Llave de rueda', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 39, 'Neumaticos — Desgaste rodados', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 40, 'Neumaticos — Aros', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 41, 'Neumaticos — Pernos de sujeción', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 42, 'Neumaticos — Suspensión', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 43, 'Accesorios — Cadenas ( 3 c/u) y tensores', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 44, 'Accesorios — Porta pertiga', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 45, 'Accesorios — Extintores portatiles', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 46, 'Accesorios — Estrobo arrastre', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 47, 'Accesorios — Triangulos, conos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 48, 'Accesorios — Baliza', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 49, 'Accesorios — Pala y cuñas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 50, 'Accesorios — Botiquín', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 51, 'Documentacion — Permiso circulacion', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 52, 'Documentacion — Revision tecnica', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 53, 'Documentacion — Autorizado faena 357', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 54, 'Accesorios de levante — Estrobos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 55, 'Accesorios de levante — Eslingas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 56, 'Accesorios de levante — Grilletes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 57, 'Accesorios de levante — Seguro de gancho', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 58, 'Accesorios de levante — Gancho', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 59, 'Accesorios de levante — Bases de sujeción', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 60, 'Accesorios de levante — Pluma', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 61, 'Accesorios de levante — Gatos hidráulicos', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-89 · 29 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-89';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-89', 'Check List Demoliciones', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Demoliciones (maquinaria) — Señalización del perímetro y de instalaciones exist', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Demoliciones (maquinaria) — Taludes de acuerdo a Mecánica de Suelos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Demoliciones (maquinaria) — Circulación y acopio de Materiales distantes del borde (Separación=1,5 veces la altura o a =1,5h)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Demoliciones (maquinaria) — Aislacón conductores de alta tension (si procede)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Demoliciones (maquinaria) — Existencia de personal de apoyo para la maquinaria', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Demoliciones (maquinaria) — Conductor de camión fuera de él cuando se carga', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Demoliciones (maquinaria) — Delimitación radio de giro de la maquinaria', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Demoliciones (maquinaria) — Demoliciones de acuerdo a cálculo', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'DIA — Se cuenta con DIA', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'DIA — Circulación y acopio distante del borde (a=1,5h)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'DIA — Se mantiene perimetralmente cerrado con malla rachel', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'DIA — Existe un SEIA por parte del mandante', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'DIA — Se mantiene humectada la zona de demolición', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'DIA — Uso de: guantes, casco y calzado de seguridad', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'DIA — Trabajo en bordes: uso de Arnes de seguridad', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'DIA — Pasarelas bien construidas y afianzadas', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'DIA — Estan señalizados los bordes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'En la zona de trabajo — Ejecución por personal especializado', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'En la zona de trabajo — Salen encarpados los camiones', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'En la zona de trabajo — Estos van a botadero autorizado según Res. 5081', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'En la zona de trabajo — Existencia de señalización peligro demolicion', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'En la zona de trabajo — Existen señaleticas entrada y salida de camiones', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'En la zona de trabajo — Zona de trabajo iluminada', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'En la zona de trabajo — Uso de guantes', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'En la zona de trabajo — Uso de casco', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'En la zona de trabajo — Uso de antiparras', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'En la zona de trabajo — Uso de mascarillas P 100 o N 3', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'En la zona de trabajo — Se encuentra desenergizado el sector', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'En la zona de trabajo — Uso de protector auditivo', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-90 · 17 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-90';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-90', 'Check List Plataformas Elevadoras', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, '¿El sistema hidraulico presenta alguna fuga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, '¿El equipo cuenta con un programa de mantención vigente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, '¿Los controles se encuentra en buen estado?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, '¿El sistema de frenos se encuentra en buenas condiciones de operación?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, '¿El sistema de alrmas visuales y sonoras se encuentra en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, '¿Los neumáticos se encuentran en buenas condiciones de uso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, '¿El equipo presenta fuga de combustibles u aceites?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, '¿Las conecciones electricas (Enchufes) se encuentran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, '¿La barra de seguridad o puerta de acceso se encuantran en buenas condiciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, '¿El seguro de la puerta de acceso se encuentra operativo y mantiene la puerta cerrada?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, '¿La bocina del equipo se encuentra en funcionamiento?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, '¿El equipo cuenta con argollas interiores para anclaje de cabos de vida?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, '¿El personal se encuentra capacitado para el uso del equipo, cuenta con capacitacion?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, '¿El equipo cuenta con cuñas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, '¿El personal cuenta con examen de altura vigente?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, '¿Se encuentra con señaleticas y/o conos de seguridad para segregar el area de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, '¿El personal conoce la capacidad de carga del equipo?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-91 · 23 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-91';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-91', 'Check List EPP Protocolos', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Ruido — Trabajadores que están expuestos a Ruido ¿Utilizan Protección Auditiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Ruido — ¿Usan tapón auditivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Ruido — ¿Usan fono Auditivo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Ruido — Trabajadores, ¿han recibido Capacitación Teórica-Practica sobre Prot. Auditiva?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Ruido — ¿Se han realizado capacitaciónes sobre Ruido?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Ruido — Trabajador expuesto ¿anda con señaletica en atril?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Sílice — Trabajadores expuestos a polvo, ¿Utilizan Protección Respiratoria?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Sílice — ¿Se evidencia trabajadores con polvo sílice en su rostro y cuerpo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Sílice — ¿Usan respirador medio rostro con filtros P100 para tareas a exposición a Sílice?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Sílice — ¿Usan mascarilla desechable con filtro con tareas a exposición a Sílice?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Sílice — Trabajadores, ¿han recibido Capacitación Teórica-Practica sobre Prot. Respiratoria?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Sílice — ¿Se han realizado capacitaciónes sobre Sílice?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Sílice — Trabajador expuesto, ¿anda con señaletica en atril?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Radiación UV - hidratación — Los trabajadores, utilizan protector solar F50+', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Radiación UV - hidratación — ¿Se ha realizado capacitación de correcto uso de bloqueador solar?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Radiación UV - hidratación — Trabajadores se hidratan de manera adecuada en el Punto de Hidratación', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Radiación UV - hidratación — Punto de Hidratación ¿se encuentra señalizado y de fácil acceso?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Radiación UV - hidratación — Trabajadores ¿utilizan su legionario y ropa manga larga?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Vibración — ¿Trabajadores utilizan guantes anti vibración para actividades con herramientas de vibración? (Cango, martillo demoledor, etc)', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Vibración — ¿Trabajadores realizan pausas dentro de labores de vibración para evitar lesiones musuloesqueleticas?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'Vibración — Trabajador expuesto, ¿Anda con señaletica en atril?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Trabajo en altura — ¿Usan arnés de seguridad y línea de vida en andamios y/o plataformas de trabajo sobre 1.8mts?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Trabajo en altura — Trabajadores, ¿cuentan con capacitación teórica práctica uso de arnés de seguridad?', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- CHK-PR-92 · 19 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'CHK-PR-92';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('CHK-PR-92', 'Check List Plataformas de Trabajo', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Caballetes — Son de material sólido y resistente', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Caballetes — ¿Se utilizan 3 tablones como mínimo como superficie de trabajo?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Caballetes — ¿Se apoyan en un terreno nivelado, libre de escombros?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Bancas o banquillos — ¿Son de material sólido?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Bancas o banquillos — ¿Presentan deformaciones?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Bancas o banquillos — ¿Cuentan con sus patas fijas y con soporte a estructura para dar mayor firmeza?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Bancas o banquillos — La base de las patas ¿se encuentran de manera antideslizante?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Puntales para andamios — ¿Cuentan con sistema de sujeción hacia la estructura del andamio?', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Puntales para andamios — Estan instalados en los segundos cuerpos de los andamios de manera de brindar resistencia y soporte adecuado', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Ruedas de los andamios — Son de caucho y no con camara', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Ruedas de los andamios — Cuentan con sistema de frenado', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Ruedas de los andamios — Estan instaladas en las bases de los andamios y en terreno parejo', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Escaleras de acceso a losas — Las escaleras sobrepasan el borde de las losas a lo menos 1 metro del borde', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Escaleras de acceso a losas — Estan pintadas en la parte alta demarcando su posicionamiento hacia arriba', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Escaleras de acceso a losas — Las escaleras cuentan con pasamanos', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Escaleras de posicionamiento — Las escaleras estan apoyadas en forma nivelada y sobre el terreno', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Escaleras de posicionamiento — La escalera esta en apoyada en un angulo adecuado, no exponiendo a que esta se resbale', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Escaleras de posicionamiento — Las escaleras estan en perfectas condiciones', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Escaleras de posicionamiento — Los apoyos superiores estan apoyados en forma nivelada y no en diagonal', 'CHECKBOX', true, false, false, '{}');
  END IF;

END $$;
COMMIT;
