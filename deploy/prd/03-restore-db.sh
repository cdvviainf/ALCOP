#!/usr/bin/env bash
# 03-restore-db.sh — Restaura un dump en el Postgres de PRD (recurso Coolify).
# Uso:  bash 03-restore-db.sh <UUID-DB> /root/alcop_qa_XXXX.dump
#   <UUID-DB>: el UUID del recurso alcop-prd-db (es el nombre del contenedor).
#
# Secuencia (runbook §5):
#   1. Coolify: STOP de alcop-prd-api (si no, migrate/seed corren en paralelo).
#   2. Este script.
#   3. Coolify: Start/Redeploy de alcop-prd-api → migrate deploy + seed + server.
set -euo pipefail
CONTAINER="${1:?Falta UUID/nombre del contenedor postgres}"
DUMP="${2:?Falta ruta al .dump}"
[ -f "$DUMP.sha256" ] && (cd "$(dirname "$DUMP")" && sha256sum -c "$(basename "$DUMP").sha256")
docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$" || { echo "❌ No corre $CONTAINER"; exit 1; }

# La API en Coolify corre con imagen alcop-api; ningún contenedor de esa app debe estar arriba.
if docker ps --format '{{.Names}} {{.Image}}' | grep -qi 'alcop-api\|alcop_api'; then
  echo "⚠️  Parece haber un contenedor de la API corriendo:"; docker ps --format '  {{.Names}} {{.Image}}' | grep -i api
  read -r -p "¿Seguro que la API está detenida? (s/N) " a; [ "$a" = "s" ] || exit 1
fi

read -r -p "⚠️  Esto BORRA el esquema public en $CONTAINER y restaura $DUMP. Escribe RESTAURAR: " OK
[ "$OK" = "RESTAURAR" ] || { echo "Cancelado"; exit 1; }

docker exec -i "$CONTAINER" sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
docker exec -i "$CONTAINER" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl --exit-on-error' < "$DUMP"

echo "==> Verificación"
docker exec -i "$CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;"' | sed 's/^/Migraciones aplicadas: /'
docker exec -i "$CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT relname AS tabla, n_live_tup AS filas FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 15;"'
echo "✅ Restore OK. Ahora: Start/Redeploy de alcop-prd-api en Coolify."
