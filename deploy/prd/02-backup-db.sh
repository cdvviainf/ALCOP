#!/usr/bin/env bash
# 02-backup-db.sh — pg_dump (formato custom) de un contenedor Postgres.
# Uso:
#   QA (origen, compose):   bash 02-backup-db.sh alcop_qa_postgres
#   PRD (recurso Coolify):  bash 02-backup-db.sh $(docker ps --format '{{.Names}}' | grep <UUID-DB>)
# En PRD el backup recurrente lo hace Coolify (Scheduled Backups del recurso db);
# este script es para dumps manuales (antes de un cambio grande, migración, etc.).
# Las credenciales se leen del propio contenedor.
set -euo pipefail
CONTAINER="${1:?Falta nombre del contenedor postgres (docker ps)}"
OUT_DIR="${OUT_DIR:-/root/backups/alcop}"
mkdir -p "$OUT_DIR"

docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$" || { echo "❌ No corre $CONTAINER"; exit 1; }
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$OUT_DIR/alcop_${CONTAINER}_${STAMP}.dump"

docker exec "$CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' > "$FILE"
[ -s "$FILE" ] || { echo "❌ Dump vacío"; rm -f "$FILE"; exit 1; }
sha256sum "$FILE" > "$FILE.sha256"
echo "✅ $FILE ($(du -h "$FILE" | cut -f1))"
