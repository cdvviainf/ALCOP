# Migración ALCOP: QA (Namecheap/Coolify) → PRD (VPS cliente, Namecheap/Coolify)

Mismo patrón que los otros proyectos VIAIN: **recursos separados en Coolify** (no un Compose único).

| Recurso Coolify | Tipo | Origen | Puerto | Dominio |
|---|---|---|---|---|
| `alcop-prd-db` | Database → PostgreSQL 17 | imagen `postgres:17-alpine` | 5432 (interno) | — |
| `alcop-prd-redis` | Database → Redis 7 | imagen `redis:7-alpine` | 6379 (interno) | — |
| `alcop-prd-api` | Application → Dockerfile | repo, base dir `/alcop-api` | 3001 | `api.alcop.cl` |
| `alcop-prd-web` | Application → Dockerfile | repo, base dir `/alcop-web` | 3000 | `app.alcop.cl` |

Los 4 en el **mismo Project/Environment y mismo Destination** (red `coolify`): la API llega a la BD y a Redis por
el hostname interno (UUID del recurso) que muestra Coolify en "Postgres/Redis URL (internal)".

**Datos:** todo vive en Postgres (fotos y PDF en `bytea`). No hay volúmenes de archivos → migrar = `pg_dump`/`pg_restore`.
Redis es cola/caché: no se migra. `docker-compose.qa.yml` se queda solo para QA.

---

## 0. Pre-requisitos
- [ ] Acceso SSH root al VPS PRD con llave.
- [ ] VPS mínimo **2 vCPU / 4 GB RAM / 40 GB** (Coolify + build de Next + Chromium de la API).
- [x] DNS A `app.alcop.cl` → 153.79.251.113
- [ ] **Falta DNS A `api.alcop.cl` → 153.79.251.113** (sin esto Let's Encrypt no emite el cert de la API). Opcional `coolify.alcop.cl`.
- [ ] Repo `cdvviainf/ALCOP` accesible desde el Coolify nuevo (GitHub App).
- [x] Decidido: PRD **lleva los datos de QA**, **sin seed** (`SEED_ON_START=false`).

## 1. Bootstrap del VPS
```bash
scp deploy/prd/01-bootstrap-vps.sh root@153.79.251.113:/root/
ssh root@153.79.251.113 'bash /root/01-bootstrap-vps.sh'
```
Entrar de inmediato a `http://153.79.251.113:8000` y crear la cuenta admin de Coolify.

## 2. Configurar Coolify
- [ ] Instance domain `https://coolify.alcop.cl` → luego `ufw delete allow 8000/tcp`.
- [ ] Sources → GitHub App con acceso a `cdvviainf/ALCOP`.
- [ ] Storage S3 (para backups fuera del VPS) — Settings → S3 Storages.
- [ ] New Project `ALCOP` → environment `production`.

## 3. Crear los recursos (en este orden)

### 3.1 `alcop-prd-db`
- New → Database → **PostgreSQL** → imagen `postgres:17-alpine`.
- Username `alcop_prd` · Initial database `alcop_prd` · Password generada.
- Public: **NO**. Start.
- **Scheduled Backups**: diario 03:30, retención 14 local + S3. (Reemplaza el cron manual.)

### 3.2 `alcop-prd-redis`
- New → Database → **Redis** → `redis:7-alpine`. Public: NO. Start.

### 3.3 `alcop-prd-api`
- New → Application → repo `cdvviainf/ALCOP`, rama `main`, **Build pack: Dockerfile**.
- Base directory `/alcop-api` · Dockerfile `/Dockerfile` · Ports exposes `3001`.
- Domain `https://api.alcop.cl`.
- **Watch paths**: `alcop-api/**` (para que un cambio en web no rebuildee la API).
- Healthcheck: path `/health`, port `3001` (la imagen alpine trae `wget`).
- Env vars: bloque `alcop-prd-api` de `.env.prd.example`. `DATABASE_URL`/`REDIS_URL` = URLs internas de 3.1/3.2.
- Recursos (Advanced): limit memory ~1.5 GB (Chromium).
- **No desplegar todavía**: primero el restore (§5). Si arranca sobre BD vacía, `migrate deploy` crea el esquema vacío y el restore lo pisa igual, pero mejor evitarlo.

### 3.4 `alcop-prd-web`
- New → Application → mismo repo, **Dockerfile**, base dir `/alcop-web`, Dockerfile `/Dockerfile`, port `3000`.
- Domain `https://app.alcop.cl` · Watch paths `alcop-web/**` · Healthcheck `/login` puerto 3000.
- Env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` marcadas como **Build Variable**.

## 4. Primer deploy
- [ ] Deploy API **después del restore** (§5) → logs: `No pending migrations` + `Seed omitido (SEED_ON_START=false)` + server arriba.
- [ ] Deploy WEB.
- [ ] `API=https://api.alcop.cl WEB=https://app.alcop.cl bash deploy/prd/04-smoke-test.sh`

## 5. Datos
### Migración de datos desde QA
Ventana: congelar uso de QA → dump → restore.
```bash
# QA (compose): contenedor alcop_qa_postgres
scp deploy/prd/02-backup-db.sh root@203.161.62.165:/root/
ssh root@203.161.62.165 'bash /root/02-backup-db.sh alcop_qa_postgres'
scp 'root@203.161.62.165:/root/backups/alcop/alcop_alcop_qa_postgres_*' .
# PRD
scp alcop_alcop_qa_postgres_* deploy/prd/03-restore-db.sh root@153.79.251.113:/root/
# Coolify: alcop-prd-api en STOP (db arriba)
ssh -t root@153.79.251.113 'bash /root/03-restore-db.sh <UUID-DB> /root/alcop_alcop_qa_postgres_XXXX.dump'
# Coolify: Deploy alcop-prd-api
```
- [ ] Validar conteos (los imprime el script) y login con un usuario real.
- [ ] Sin seed: usuarios y claves (incluido el admin) quedan **idénticos a QA**. Rotar la clave del admin desde la app si se quiere.

## 6. Backups y acceso a la BD
- [ ] Scheduled Backups del recurso db con destino S3 activo (§3.1). **Probar un restore real** una vez.
- Dump manual puntual: `bash 02-backup-db.sh <UUID-DB>`.
- Acceso pgAdmin/BI: por defecto la BD **no** es pública. Opciones (decidir):
  1. Túnel SSH a la IP del contenedor: `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <UUID-DB>`
     → `ssh -N -L 5434:<IP-contenedor>:5432 deploy@153.79.251.113` (la IP puede cambiar al recrear el contenedor).
  2. Toggle "Make it publicly available" con puerto propio + usuario **solo lectura** (patrón FAS/Excel). Si se hace,
     restringir con `ufw` por IP de origen no sirve (Docker la salta): usar `DOCKER-USER` en iptables o aceptar el riesgo.

## 7. App móvil
- [ ] `alcop-mobile/eas.json` perfil `production`: `EXPO_PUBLIC_API_URL=https://api.alcop.cl/api`.
- [ ] `eas build --profile production`.

## 8. Cierre
- [ ] Smoke test verde · login web y móvil · registro con foto · PDF generado.
- [ ] Comunicar URL nueva. QA vivo 1–2 semanas de respaldo, luego apagar o resetear como QA real.

---
## Seed
`alcop-api/Dockerfile` corre el seed solo si `SEED_ON_START` != `false` (default `true` → QA/dev sin cambios).
PRD usa `SEED_ON_START=false`. Si a futuro se requiere sembrar datos nuevos en PRD, hacerlo con un script
puntual idempotente que solo cree lo faltante — no reactivando el seed completo (pisa catálogos y recrea obras demo).
