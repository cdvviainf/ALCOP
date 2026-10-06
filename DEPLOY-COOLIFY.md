# Deploy en Coolify — ALCOP (ambiente QA / Demo)

> Replica el patrón ya probado en ENE: **Build strategy = Compose**, un archivo
> `docker-compose.qa.yml` en la raíz del repo, y variables de entorno cargadas
> en la UI de Coolify. Ver `docker-compose.qa.yml` y `.env.qa.example`.

## 1. Crear el recurso en Coolify

1. Nuevo recurso → **Docker Compose** sobre el repo `cdvviainf/ALCOP` (rama `main`).
2. En **General → Build pipeline**:
   - Build strategy: **Compose**
   - Base directory: `/`
   - Docker compose location: `/docker-compose.qa.yml`
3. (Opcional) **Watch paths** si se quiere auto-deploy por carpeta.

## 2. Variables de entorno (UI de Coolify)

Copiar desde `.env.qa.example`. Flujo recomendado:

1. Primera pasada: setear `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `REDIS_PASSWORD`,
   `BETTER_AUTH_SECRET` (≥32 chars). Dejar las URLs con cualquier placeholder.
2. Deploy inicial → Coolify genera los subdominios de `api` y `web`.
3. Segunda pasada: rellenar `API_PUBLIC_URL`, `WEB_PUBLIC_URL` y
   `NEXT_PUBLIC_API_URL` (= `API_PUBLIC_URL` + `/api`) con los subdominios reales.
4. **Redeploy** (el web necesita *rebuild*, no solo restart — ver nota abajo).

## 3. Dominios

En **Domains** de cada servicio asignar el subdominio autogenerado por Coolify
(Q3: subdominio del servidor, sin dominio propio todavía). Coolify arma el SSL
vía Let's Encrypt. El compose usa `expose` (no `ports` de host) a propósito,
para no chocar con ENE (3010/3011) si comparten servidor — Coolify enruta por
dominio al puerto EXPOSE (api 3001, web 3000).

## 4. Migraciones y seed

- **Migraciones:** automáticas. El `CMD` del Dockerfile de `alcop-api` corre
  `npx prisma migrate deploy` antes de arrancar, en cada deploy. Las migraciones
  (`prisma/migrations/`) están commiteadas.
- **Seed (áreas, perfiles, categorías, obras, admin):** corre **automáticamente**
  en cada arranque. El `CMD` del Dockerfile encadena
  `migrate deploy && node dist/scripts/seed.js && server`. El seed es idempotente.
- **Admin (IMPORTANTE — seguridad):** el seed solo crea/rota el administrador si
  la variable **`SEED_ADMIN_PASSWORD`** está definida (no hay contraseña por
  defecto en el repo). Setearla en la UI de Coolify con un valor fuerte (≥8).
  - Cambiar `SEED_ADMIN_PASSWORD` y redeployar **rota** la contraseña del admin
    existente de forma idempotente (no hace falta tocar la BD).
  - `SEED_ADMIN_EMAIL` por defecto es `admin@alcop.cl`.
  - Sin `SEED_ADMIN_PASSWORD`, no se podrá iniciar sesión (no se siembra admin).

## 5. Qué esperar de este primer demo

Es un **esqueleto desplegable**, no la app funcional todavía:

- `api`: responde `/health` y Swagger en `/docs`; BD migrada.
- `web`: renderiza `/login` (placeholder) y el layout con sidebar estático.
- Auth, módulos de negocio y Análisis IA real aún no implementados.

El objetivo de este paso es **validar el pipeline de deploy** (build de ambos
Dockerfiles, red interna, migraciones) antes de construir los módulos.

## 6. Checklist rápido

- [ ] Recurso Compose creado apuntando a `/docker-compose.qa.yml`
- [ ] Env vars cargadas (secretos fuertes en DB/Redis/Auth)
- [ ] Deploy inicial OK → subdominios generados
- [ ] URLs públicas rellenadas + **rebuild** del web
- [ ] `GET https://<api>/health` responde `{ "status": "ok" }`
- [ ] `https://<web>/login` renderiza
