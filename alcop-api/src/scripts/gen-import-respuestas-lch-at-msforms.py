"""Genera el SQL idempotente que adapta los formularios LCH-AT a los Excel de MS Forms
e importa sus respuestas como registros técnicos cerrados.

Reglas (Christian, 23-11-2026):
  - Pregunta del Excel sin equivalente en el sistema -> se agrega en negrita (**texto**).
  - Pregunta del Excel similar a una del sistema -> queda el texto del Excel + ' *Rev*'
    (la(s) pregunta(s) del sistema que reemplaza se quitan).
  - Preguntas del sistema sin equivalente -> se conservan; sus respuestas quedan en blanco.
Uso: python gen_sql.py <carpeta_xlsx> <salida.sql>
"""
import os, re, sys, unicodedata, openpyxl

SRC, OUT = sys.argv[1], sys.argv[2]

def limpio(s):
    s = re.sub(r'\s+', ' ', str(s).replace('\xa0', ' ')).strip()
    return s[:1].upper() + s[1:]

# columnas fijas del export de MS Forms
C_ID, C_INICIO, C_OBRA, C_FECHA, C_UBIC = 0, 1, 6, 7, 8
OBRAS = {'Casas Olmo': 'OLM', 'Chamisero III': 'CH3'}
USUARIOS = {'Cristian Aravena': 'caa@alcop.cl', 'Cristian Quezada': 'cqv@alcop.cl', 'Maximiliano Olivos': 'moo@alcop.cl'}
VALORES = {'Cumple': 'CUMPLE', 'No Cumple': 'NO_CUMPLE', 'N/A': 'N_A'}

# Mapeo por Excel: preguntas del checklist (1-based, en orden del Excel) -> preguntas del sistema
# (orden) que reemplaza. [] = no existe en el sistema (negrita).
EXCELS = [
    ('LCH-AT-01 AGUA POTABLE', 'LCH-AT-01-AP', 'AP',
     {1: [], 2: [10], 3: [], 4: [], 5: [8], 6: [1], 7: [2], 8: [1, 3], 9: [3], 10: [], 11: [8], 12: [4]}),
    ('LCH-AT-01  AGUAS SERVIDAS', 'LCH-AT-01-AS', 'AS',
     {1: [], 2: [1], 3: [], 4: [1, 2], 5: [10], 6: [], 7: [7], 8: [7], 9: [7], 10: [9], 11: [9], 12: [3, 4]}),
    # LCH-AT-02: dos Forms (TyD y F) sobre un solo formulario; planos (1) y materiales (2) se comparten.
    ('LCH-AT-02 (TyD)', 'LCH-AT-02', 'TYD',
     {1: 'PLANOS', 2: 'MATERIALES', 3: [1], 4: [2], 5: [7, 8], 6: [6]}),
    ('_LCH-AT-02(F)', 'LCH-AT-02', 'F',
     {1: 'PLANOS', 2: 'MATERIALES', 3: [], 4: [14, 16], 5: [16], 6: [9], 7: []}),
    ('LCH-AT-03', 'LCH-AT-03', '03',
     {1: [7], 2: [7], 3: [1, 2], 4: [4, 5], 5: [8], 6: [13], 7: []}),
    ('LCH-AT-04', 'LCH-AT-04', '04',
     {1: [2], 2: [9], 3: [1], 4: [4], 5: [10], 6: [], 7: [3], 8: [11]}),
]
COMPARTIDAS = {  # LCH-AT-02: texto único para las preguntas comunes de TyD y F
    'PLANOS': ('El Supervisor o Subcta. cuenta con los planos y/o EETT de la especialidad, en papel y escala adecuada.', []),
    'MATERIALES': ('Control de materiales según la EETT o validación de OT.', [18]),
}

def q(s):
    return "'" + s.replace("'", "''") + "'"

def marcar(texto, reemplaza):
    return f'{texto} *Rev*' if reemplaza else f'**{texto}**'

# ---- leer Excel ----
archivos = sorted(os.listdir(SRC))
formularios = {}   # codigo -> {'nuevas': [(clave, texto, tipo, obligatoria)], 'consumidas': set()}
registros = []     # (codigo, archivo, fila)
for prefijo, codigo, tag, mapa in EXCELS:
    norm = lambda a: re.sub(r'\s+', ' ', unicodedata.normalize('NFC', a).replace('\xa0', ' '))
    archivo = next(a for a in archivos if norm(a).startswith(norm(prefijo)) and a.endswith('.xlsx'))
    nombre = norm(archivo)
    ws = openpyxl.load_workbook(os.path.join(SRC, archivo), data_only=True).worksheets[0]
    filas = list(ws.iter_rows(values_only=True))
    hdr = filas[0]
    assert limpio(hdr[-2]) == 'Observaciones' and limpio(hdr[-1]) == 'Completado por', nombre
    preg_cols = list(range(9, len(hdr) - 2))
    assert len(preg_cols) == len(mapa), (nombre, len(preg_cols), len(mapa))
    f = formularios.setdefault(codigo, {'nuevas': [('UBICACION', '**Ubicación**', 'TEXTO', True)], 'consumidas': set()})
    claves = {}
    for i, col in enumerate(preg_cols, 1):
        m = mapa[i]
        if isinstance(m, str):  # compartida
            clave = m
            texto, reemplaza = COMPARTIDAS[m]
        else:
            clave = f'{tag}-{i}'
            texto, reemplaza = limpio(hdr[col]), m
        f['consumidas'].update(reemplaza)
        if clave not in [n[0] for n in f['nuevas']]:
            f['nuevas'].append((clave, marcar(texto, reemplaza), 'CHECKBOX', True))
        claves[col] = clave
    for fila in filas[1:]:
        if fila[C_ID] is None:
            continue
        registros.append((codigo, nombre, fila, claves, len(hdr)))

# ---- SQL ----
L = []
w = L.append
w('-- Adaptación de formularios LCH-AT a los MS Forms reales + importación de sus respuestas.')
w('-- Generado por gen-import-respuestas-lch-at-msforms.py desde los Excel de MS Forms (no editar a mano). Re-ejecutable:')
w('--   * las preguntas se rehacen solo si el formulario aún no tiene respuestas;')
w("--   * cada registro importado se marca con creadoPor = 'import-msforms:<archivo>#<ID>' y no se duplica.")
w('-- Marcas en Pregunta.texto: **texto** = pregunta nueva (negrita), sufijo *Rev* = similar, por revisar (rojo).')
w('BEGIN;')
w('CREATE TEMP TABLE _orig (codigo text, orden int, texto text, tipo text, oblig bool, pfoto bool, ofoto bool, opciones text[]) ON COMMIT DROP;')
w('CREATE TEMP TABLE _map (codigo text, clave text, preguntaid int) ON COMMIT DROP;')

# usuarios sin credencial (no autentican hasta que un admin les asigne acceso)
usados = {limpio(r[2][r[4] - 1]) for r in registros}
for nom, mail in USUARIOS.items():
    if nom not in usados:
        continue
    w(f"INSERT INTO \"Usuario\" (id, nombre, email, activo, \"esAdmin\", \"creadoEn\", \"creadoPor\") "
      f"SELECT 'imp_' || md5({q(mail)}), {q(nom)}, {q(mail)}, true, false, now(), 'import-msforms' "
      f"WHERE NOT EXISTS (SELECT 1 FROM \"Usuario\" WHERE lower(email) = lower({q(mail)}));")

for codigo, f in formularios.items():
    nuevas = f['nuevas'] + [('OBSERVACIONES', '**Observaciones**', 'TEXTO_LARGO', False)]
    w(f'\n-- ===== {codigo}: {len(nuevas)} preguntas del Excel; se reemplazan las del sistema {sorted(f["consumidas"])}')
    w('DO $$ DECLARE v_form int; v_n int; BEGIN')
    w(f"  SELECT id INTO v_form FROM \"Formulario\" WHERE codigo = {q(codigo)} AND \"eliminadoEn\" IS NULL;")
    w(f"  IF v_form IS NULL THEN RAISE EXCEPTION 'No existe el formulario {codigo}'; END IF;")
    w("  IF EXISTS (SELECT 1 FROM \"Pregunta\" WHERE \"formularioId\" = v_form AND texto = '**Ubicación**') THEN")
    w(f"    RAISE NOTICE '{codigo}: ya adaptado, se mantiene'; RETURN; END IF;")
    w("  IF EXISTS (SELECT 1 FROM \"RespuestaFormulario\" WHERE \"formularioId\" = v_form) THEN")
    w(f"    RAISE EXCEPTION '{codigo} ya tiene registros: no se pueden rehacer sus preguntas'; END IF;")
    w("  SELECT count(*) INTO v_n FROM \"Pregunta\" WHERE \"formularioId\" = v_form;")
    w(f"  IF v_n <> (SELECT max(orden) FROM \"Pregunta\" WHERE \"formularioId\" = v_form) THEN RAISE EXCEPTION '{codigo}: orden de preguntas inesperado'; END IF;")
    # conservar las del sistema no consumidas
    w(f"  INSERT INTO _orig SELECT {q(codigo)}, orden, texto, \"tipoRespuesta\"::text, obligatoria, \"permiteFoto\", \"fotoObligatoria\", opciones")
    w(f"    FROM \"Pregunta\" WHERE \"formularioId\" = v_form AND orden NOT IN ({','.join(map(str, sorted(f['consumidas']))) or '0'});")
    w("  DELETE FROM \"Pregunta\" WHERE \"formularioId\" = v_form;")
    w("  INSERT INTO \"Pregunta\" (\"formularioId\", orden, texto, \"tipoRespuesta\", obligatoria, \"permiteFoto\", \"fotoObligatoria\", opciones) VALUES")
    filas = [f"    (v_form, {i}, {q(t)}, '{tp}', {str(ob).lower()}, false, false, '{{}}')"
             for i, (_, t, tp, ob) in enumerate(nuevas[:-1], 1)]
    w(',\n'.join(filas) + ';')
    base = len(nuevas) - 1
    w(f"  INSERT INTO \"Pregunta\" (\"formularioId\", orden, texto, \"tipoRespuesta\", obligatoria, \"permiteFoto\", \"fotoObligatoria\", opciones)")
    w(f"    SELECT v_form, {base} + row_number() OVER (ORDER BY orden), texto, tipo::\"TipoRespuesta\", oblig, pfoto, ofoto, opciones FROM _orig WHERE codigo = {q(codigo)};")
    w(f"  INSERT INTO \"Pregunta\" (\"formularioId\", orden, texto, \"tipoRespuesta\", obligatoria, \"permiteFoto\", \"fotoObligatoria\", opciones)")
    w(f"    SELECT v_form, (SELECT max(orden) + 1 FROM \"Pregunta\" WHERE \"formularioId\" = v_form), '**Observaciones**', 'TEXTO_LARGO', false, false, false, '{{}}';")
    w('END $$;')
    # mapa clave -> preguntaId (por texto, que es único dentro del formulario)
    for clave, t, _, _ in nuevas:
        w(f"INSERT INTO _map SELECT {q(codigo)}, {q(clave)}, p.id FROM \"Pregunta\" p JOIN \"Formulario\" fo ON fo.id = p.\"formularioId\" "
          f"WHERE fo.codigo = {q(codigo)} AND fo.\"eliminadoEn\" IS NULL AND p.texto = {q(t)};")

w('\n-- ===== Registros importados')
for codigo, nombre, fila, claves, ncols in registros:
    tag = f'import-msforms:{nombre}#{fila[C_ID]}'
    obra = OBRAS[limpio(fila[C_OBRA])]
    mail = USUARIOS[limpio(fila[ncols - 1])]
    inicio = fila[C_INICIO].strftime('%Y-%m-%d %H:%M:%S')
    dia = fila[C_FECHA].strftime('%Y-%m-%d')
    resp = [('UBICACION', 'valorTexto', limpio(fila[C_UBIC]))]
    for col, clave in claves.items():
        v = fila[col]
        if v is not None:
            resp.append((clave, 'valorCheckbox', VALORES[limpio(v)]))
    obs = fila[ncols - 2]
    if obs is not None and str(obs).strip():
        resp.append(('OBSERVACIONES', 'valorTexto', str(obs).strip()))
    w('DO $$ DECLARE v_reg int; BEGIN')
    w(f"  IF EXISTS (SELECT 1 FROM \"RespuestaFormulario\" WHERE \"creadoPor\" = {q(tag)}) THEN RETURN; END IF;")
    w(f"  INSERT INTO \"RespuestaFormulario\" (\"formularioId\", \"obraId\", \"usuarioId\", estado, \"fechaRevision\", \"fechaHora\", \"creadoEn\", \"creadoPor\")")
    w(f"  SELECT fo.id, o.id, u.id, 'CERRADO', '{dia}T00:00:00Z'::timestamptz, ('{inicio}'::timestamp AT TIME ZONE 'America/Santiago'), now(), {q(tag)}")
    w(f"    FROM \"Formulario\" fo, \"Obra\" o, \"Usuario\" u WHERE fo.codigo = {q(codigo)} AND fo.\"eliminadoEn\" IS NULL")
    w(f"    AND o.codigo = '{obra}' AND o.\"eliminadoEn\" IS NULL AND lower(u.email) = lower({q(mail)}) RETURNING id INTO v_reg;")
    w(f"  IF v_reg IS NULL THEN RAISE EXCEPTION 'No se pudo crear {tag} (formulario/obra/usuario)'; END IF;")
    w(f"  INSERT INTO \"RespuestaPregunta\" (\"respuestaFormularioId\", \"preguntaId\", \"valorTexto\", \"valorCheckbox\", \"valorSeleccionMultiple\") VALUES")
    vals = []
    for clave, campo, v in resp:
        pid = f"(SELECT preguntaid FROM _map WHERE codigo = {q(codigo)} AND clave = {q(clave)})"
        vt = q(v) if campo == 'valorTexto' else 'NULL'
        vc = q(v) if campo == 'valorCheckbox' else 'NULL'
        vals.append(f"    (v_reg, {pid}, {vt}, {vc}, '{{}}')")
    w(',\n'.join(vals) + ';')
    w('END $$;')

w('\nCOMMIT;')
open(OUT, 'w').write('\n'.join(L) + '\n')
print(f'{len(formularios)} formularios, {len(registros)} registros -> {OUT}')
for codigo, f in formularios.items():
    print(' ', codigo, 'excel:', len(f['nuevas']) + 1, 'reemplazadas del sistema:', sorted(f['consumidas']))
