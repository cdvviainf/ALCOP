-- Importación idempotente de checklists LCH-AT (Área Técnica) a Formulario + Pregunta.
-- Generado desde los 10 .xlsx enviados (una sola vez). Re-ejecutable sin duplicar.
-- Categoría: 'Checklist LCH-AT' (TECNICA). Tipo de respuesta: CHECKBOX (Cumple/No cumple/N.A.).
BEGIN;
DO $$
DECLARE
  v_area int;
  v_cat  int;
  v_form int;
BEGIN
  SELECT id INTO v_area FROM "Area" WHERE codigo = 'TECNICA' LIMIT 1;
  IF v_area IS NULL THEN RAISE EXCEPTION 'No existe el Área TECNICA (corre el seed primero).'; END IF;

  SELECT id INTO v_cat FROM "CategoriaFormulario"
    WHERE "areaId" = v_area AND codigo = 'LCH_AT' AND "eliminadoEn" IS NULL LIMIT 1;
  IF v_cat IS NULL THEN
    INSERT INTO "CategoriaFormulario" ("areaId", codigo, nombre, activo, "creadoEn", "creadoPor")
    VALUES (v_area, 'LCH_AT', 'Checklist LCH-AT', true, now(), 'import-checklists')
    RETURNING id INTO v_cat;
  END IF;

  -- LCH-AT-01-AP · PRO-AT-01 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-01-AP';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-01-AP', 'EJECUCIÓN Y CONTROL DE INSTALACIONES SANITARIAS – AGUA POTABLE', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Proyecto y trazado verificados contra planos vigentes de agua potable.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Diámetros y materialidad de tuberías coinciden con proyecto y EETT.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Replanteo realizado evitando interferencias con otras especialidades y elementos estructurales.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Ubicación de puntos y centros de artefactos verificada en planta y elevación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Tuberías, fittings y uniones instalados conforme a proyecto y recomendaciones del fabricante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Soportes, fijaciones y protección de tuberías verificados.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Pasadas y sellos en elementos constructivos revisados según detalles aprobados.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Pruebas de presión/estanqueidad ejecutadas y registradas según especificación aplicable.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Red limpia y protegida antes de cierres o revestimientos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Modificaciones informadas a Oficina Técnica para actualización de planos As-Built.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Inspección final y respaldo fotográfico/documental completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-01-AS · PRO-AT-01 · 11 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-01-AS';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-01-AS', 'EJECUCIÓN Y CONTROL DE INSTALACIONES SANITARIAS – ALCANTARILLADO Y AGUAS SERVIDAS', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Trazado, diámetros y materialidad coinciden con proyecto vigente.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Replanteo realizado evitando cruces de servicios e intervenciones en elementos estructurales críticos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Ejes y ubicación de centros de artefactos verificados en planta y elevación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Verticalidad de descargas revisada respecto de los ejes proyectados.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Pendientes de ramales colgados y enterrados verificadas según proyecto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Cotas UD y NPT coordinadas con instalación interior para evitar interferencias.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Cama de apoyo, soporte y rellenos de tuberías enterradas ejecutados según detalle de proyecto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Uniones, fittings y cambios de dirección revisados antes de quedar ocultos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Pruebas de funcionamiento/estanqueidad exigidas por proyecto ejecutadas y registradas.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Modificaciones informadas a Oficina Técnica para planos As-Built.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Inspección final, registro fotográfico y cierre del checklist completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-02 · PRO-AT-02 · 19 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-02';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-02', 'IMPERMEABILIZACIONES', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Recinto terminado en tabiquería; paneles a plomo y encuentros sin espacios.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Superficie sana, limpia, seca o acondicionada según sistema; sin polvo, grasa, partes sueltas, grietas ni protuberancias.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Oquedades y defectos reparados con mortero de reparación adecuado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'En duchas y tinas, impermeabilización ejecutada sobre losa estructural en zona indicada por procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Producto cementicio bicomponente flexible preparado mecánicamente a bajas revoluciones, sin grumos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Primera y segunda mano aplicadas en forma cruzada, respetando ficha técnica y secado al tacto entre manos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Retorno de impermeabilización en muros/tabiques de 20 cm sobre NPT verificado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Encuentro con soporte de receptáculo de tina resuelto con traslape de 20 cm.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Fundaciones y sobrecimientos tratados desde hombro de fundación hasta 20 cm sobre nivel terminado exterior.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Cambios de dirección perfilados a 90° y reforzados con tela de poliéster 40–70 g/m², escuadra de 10 cm por lado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Superficie acondicionada a condición SSS sin agua libre antes de aplicación cuando corresponde.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Mortero/chapa de protección aplicado según dosificación y producto especificado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Franja drenante perimetral dispuesta con distancia mínima de 20 cm desde plomo exterior del cimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Junta fría entre fundación y muro limpia y preparada mecánicamente para cristalizante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Fisuras mayores a 0,4 mm tratadas según procedimiento antes de aplicar cristalizante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Cristalizante aplicado en dos manos según ficha técnica y rendimiento indicado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Curado del cristalizante mantenido por al menos 48 horas, con agua por aspersión 3 veces al día.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Productos alternativos cuentan con aprobación previa del Área Técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Registro fotográfico y recepción de la partida completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-03 · PRO-AT-03 · 14 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-03';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-03', 'NIVELACIÓN DE RADIERES Y LOSAS PARA PISOS FLOTANTES', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Superficie de hormigón sana y firme, sin lechadas, material suelto ni deteriorado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Contaminantes (aceites, polvo, pintura, compuestos de curado y eflorescencias) eliminados.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Superficie humedecida y llevada a condición SSS antes de limpieza química, según procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Preparación y aplicación del compuesto de limpieza ejecutadas conforme al procedimiento y controles de seguridad aplicables.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Superficie restregada y enjuagada abundantemente hasta quedar neutra y libre de residuos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Agua de enjuague retirada; superficie en condición requerida para recibir el nivelador.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Dosificación de agua/aditivos verificada con ficha técnica del nivelador especificado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Tacos o referencias de nivel fijados y nivelados antes del vaciado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Espesor de aplicación definido y dentro del rango indicado en el procedimiento (5 a 25 mm).', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Cantidad preparada planificada según tiempo de trabajabilidad de ficha técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Vaciado continuo desde borde o esquina, evitando interrupciones y dejando superficie uniforme.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Rodillo de púas pasado antes del inicio de endurecimiento para eliminar aire.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Curado programado y mantenido por al menos 3 días desde la aplicación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Registro de controles y cierre mediante LCH-AT-03 completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-04 · PRO-AT-04 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-04';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-04', 'INSTALACIÓN DE PISO SPC', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Superficie firme, seca y nivelada; tolerancia máxima indicada de 3 mm en 3 m.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Material SPC corresponde a EETT o alternativa formalmente validada por Oficina Técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Distribución de paños planificada antes de iniciar instalación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Junta de dilatación prevista en acceso de cada recinto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Longitudes mayores a 8 m cuentan con juntas o validación del Área Técnica según ficha técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Ventanas instaladas, limpias y protegidas para impedir ingreso de luz posterior a la instalación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Puertas instaladas y rebajadas antes del inicio de la partida.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Área de trabajo limpia, ordenada y protegida durante la instalación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Instalación ejecutada conforme al sistema de clic y ficha técnica del fabricante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Juntas perimetrales y de dilatación respetadas según procedimiento/ficha técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Encuentros, remates y transiciones revisados visualmente.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Pavimento terminado protegido frente a daños de otras partidas.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Inspección final y registro fotográfico completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-05 · PRO-AT-05 · 15 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-05';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-05', 'PREPARACIÓN DE SUPERFICIE PARA PORCELANATOS Y CERÁMICOS', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Superficie de hormigón sana y firme, sin lechadas, hormigón suelto ni deteriorado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Contaminantes que afecten adherencia eliminados (curadores, aceites, polvo, pintura y eflorescencias).', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Superficie mojada y llevada a condición SSS antes del tratamiento, según procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Compuesto de limpieza preparado según proporción indicada en el procedimiento y con medidas de seguridad.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Superficie restregada durante la reacción y enjuagada con abundante agua limpia.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Residuos del tratamiento y agua de enjuague retirados; superficie neutra y en condición SSS sin brillo.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Si no es posible retirar completamente el agua, se ejecutó alternativa mecánica y aspirado final.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Área libre de polvo en suspensión antes de aplicar adhesivo.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Llana dentada disponible y adhesivo preparado según ficha técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Mano de empaste aplicada con cara lisa de la llana.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Adhesivo peinado con llana dentada a aproximadamente 60°, con estrías rectas en una dirección.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Para revestimientos de lado mayor o igual a 40 cm, adhesivo aplicado en sustrato y contracara en direcciones cruzadas.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Juntas de colocación definidas con indicación del proveedor.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Juntas de movimiento previstas en superficies extensas, con paños regulares según detalle.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Inspección y cierre mediante LCH-AT-05 completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-06 · PRO-AT-06 · 19 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-06';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-06', 'REPARACIÓN Y CONTROL DE NIDOS EN HORMIGÓN ARMADO', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Elemento inspeccionado después del descimbre del moldaje.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Nido identificado con pintura/espray y número correlativo de obra.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Trazado de picado marcado con lados rectos, incluyendo el nido completo y penetración mínima de 5 cm en hormigón sano.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Fotografía inicial tomada con trazado y número visible.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Picado ejecutado siguiendo el trazado; PT revisó presencia y condición de enfierraduras expuestas.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Fotografía posterior al picado tomada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Tipo de reparación definido por PT y marcado como RA o RB según criterio del procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Superficie de hormigón y enfierraduras limpias, sin polvo, grasa ni lechada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Puente adherente Colmafix 32 o similar aplicado según ficha técnica solo sobre hormigón, no sobre enfierraduras.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Para RA: moldaje tipo buzón instalado y relleno con SikaGrout 212 o similar.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Para RB: reparación ejecutada con SikaRep AR o similar, sin buzón cuando corresponda.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Fotografía del relleno/reparación tomada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Una vez fraguado, descimbre y retiro de exceso ejecutados cuando corresponde.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Fotografía final de reparación tomada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Planilla general de nidos actualizada con ubicación, datos y fechas de cada etapa.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Planilla individual incluye las cuatro fotografías del proceso.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Fichas técnicas revisadas y personal instruido antes de ejecutar la reparación.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'No se utilizó mortero tradicional ni yeso en reparaciones estructurales descritas por el procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'Cierre y trazabilidad registrados mediante LCH-AT-06.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-07 · PRO-AT-07 · 13 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-07';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-07', 'DRENAJE EN MUROS DE CONTENCIÓN – DANODREN O SIMILAR', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Cara posterior del muro limpia, sin rebabas, desmoldantes, polvo ni contaminantes.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Imprimación Igol Primer aplicada en mano uniforme.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Barrera impermeable Igol Denso aplicada según procedimiento/ficha técnica.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Lámina drenante con geotextil integrado instalada en trasdós.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Nódulos orientados hacia el muro y geotextil hacia el terreno.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Continuidad de la lámina y encuentros revisados antes del relleno.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Barbacanas ejecutadas atravesando la lámina drenante donde corresponde.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Tuberías de barbacanas instaladas con pendiente de 1% a 2% hacia el exterior.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Boca interior de cada barbacana protegida con geotextil no tejido para evitar taponamiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Tubería principal de drenaje instalada según detalle de proyecto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Continuidad del recorrido de descarga y salida de agua verificada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Elementos de drenaje protegidos frente a daños durante relleno.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Registro fotográfico previo al relleno y recepción de la partida completados.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-08 · PRO-AT-08 · 12 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-08';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-08', 'INSTALACIÓN Y CONTROL DE ANCLAJES – PISO 2', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Validación de cálculo/proyecto y detalles aprobados disponibles en obra.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Anclaje especificado corresponde a perno 3/8” x 2 3/4” o a la solución validada para el proyecto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Broca indicada para perforación disponible (3/8” según procedimiento).', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Perforación ejecutada perpendicularmente y con profundidad mínima de 2”, dejando espacio para placa, golilla y tuerca.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Polvo del fondo soplado, paredes limpiadas con cepillo de alambre y perforación soplada nuevamente.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Golilla instalada y tuerca enroscada al ras de la punta para proteger la rosca durante inserción.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Perno introducido a través de la placa y asentado sin dañar rosca ni componentes.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Tuerca ajustada con herramienta indicada en el procedimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Ubicación, separación y cantidad de anclajes contrastadas con planos/detalle aprobado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Placa y elemento fijado correctamente asentados, sin holguras visibles.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Control visual y registro fotográfico realizados antes de ocultar o continuar la estructura.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Desviaciones informadas a Oficina Técnica y resueltas antes de liberar la partida.', 'CHECKBOX', true, false, false, '{}');
  END IF;

  -- LCH-AT-09 · PRO-AT-09 · 31 preguntas
  SELECT id INTO v_form FROM "Formulario" WHERE codigo = 'LCH-AT-09';
  IF v_form IS NULL THEN
    INSERT INTO "Formulario" (codigo, nombre, "areaId", "categoriaId", "requiereObra", activo, "creadoEn", "creadoPor")
    VALUES ('LCH-AT-09', 'CONTROL DE INSTALACIÓN DE VENTANAS DE PVC Y SELLOS PERIMETRALES', v_area, v_cat, true, true, now(), 'import-checklists')
    RETURNING id INTO v_form;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Pregunta" WHERE "formularioId" = v_form) THEN
    INSERT INTO "Pregunta" ("formularioId", orden, texto, "tipoRespuesta", obligatoria, "permiteFoto", "fotoObligatoria", opciones) VALUES
      (v_form, 1, 'Planos de arquitectura, detalles de ventanas y EETT vigentes disponibles y revisados antes de iniciar.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 2, 'Dimensiones del vano, diagonales y escuadra verificadas conforme a la ventana correspondiente.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 3, 'Sustrato del vano firme, seco, limpio y terminado, sin rebabas ni material suelto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 4, 'Vano y superficies de contacto libres de polvo, grasa, restos de mortero, espuma suelta y otros contaminantes.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 5, 'Marco presentado con cuñas adecuadas, manteniendo una junta perimetral regular.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 6, 'Marco instalado aplomado, nivelado y escuadrado; diagonales verificadas y sin alabeos o deformaciones.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 7, 'Junta perimetral permite ejecutar el sellado y absorber movimientos de expansión y retracción del perfil.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 8, 'Anclajes mecánicos ejecutados según detalle aprobado e instrucciones del fabricante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 9, 'Fijaciones completas y firmes, sin deformar el marco ni bloquear la dilatación del PVC.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 10, 'Perforaciones ejecutadas sin afectar cámaras de drenaje; perforaciones selladas cuando corresponde según detalle del fabricante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 11, 'Apertura y cierre verificados antes del sellado, sin roces y con herrajes funcionando correctamente.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 12, 'Marco aceptado por Supervisión antes de autorizar la ejecución de los sellos perimetrales.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 13, 'Superficies preparadas según las condiciones de limpieza y humedad indicadas por el fabricante del sellante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 14, 'Bordes enmascarados para obtener una terminación limpia y definida.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 15, 'Sello exterior de poliuretano aplicado en forma continua en todo el perímetro entre marco y rasgo/revestimiento.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 16, 'Sello exterior adherido a ambos flancos, sin cortes, poros, vacíos, fisuras ni desprendimientos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 17, 'Dimensiones de la junta y del sellante conformes a ficha técnica y movimiento esperado.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 18, 'Drenajes y elementos de evacuación de agua del marco permanecen libres, sin obstrucciones ni sellante.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 19, 'En juntas con dilatación mayor a 5 mm, cordón de respaldo instalado de forma continua y con diámetro adecuado para quedar comprimido.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 20, 'Cordón de respaldo instalado sin perforaciones, estiramientos ni daños; no reemplazado por mortero ni pastas rígidas.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 21, 'En junta interior, cordón de respaldo dispuesto para controlar la profundidad del sello y evitar adherencia a tres caras.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 22, 'Sello interior de poliuretano aplicado sobre el cordón de respaldo, continuo y uniforme entre marco y rasgo.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 23, 'Sellante interior adherido solamente a los dos flancos de la junta, sin adherencia a tres caras.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 24, 'Sellos alisados dentro del tiempo de trabajo del fabricante; cinta de enmascarar retirada antes de la formación de piel.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 25, 'Sellos ejecutados sin cubrir partes móviles ni interferir con el funcionamiento de la ventana.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 26, 'Inspección final confirma marco firme, aplomado, nivelado, escuadrado y funcionamiento correcto.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 27, 'Sellos exteriores e interiores continuos, uniformes y adheridos, sin poros, vacíos, fisuras ni desprendimientos.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 28, 'Reparaciones, si existen, consideran retiro del material defectuoso, preparación del sustrato y reposición del sello respetando curado y condiciones ambientales.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 29, 'Producto utilizado, lote y fecha de vencimiento registrados para la instalación inspeccionada.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 30, 'Registro fotográfico incluye marco fijado antes del sellado, cordón de respaldo y sellos exterior e interior terminados.', 'CHECKBOX', true, false, false, '{}'),
      (v_form, 31, 'Ubicación de la ventana, fecha, responsable de ejecución y responsable de inspección registrados.', 'CHECKBOX', true, false, false, '{}');
  END IF;
END $$;
COMMIT;
