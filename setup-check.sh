#!/bin/bash
# ============================================================
# ALCOP — Script de verificación de entorno
# Ejecutar desde: /Users/christiandroguett/sites/ALCOP
# ============================================================

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
BLUE="\033[34m"
RESET="\033[0m"

PASS=0
WARN=0
FAIL=0

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; ((PASS++)); }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; ((WARN++)); }
fail() { echo -e "  ${RED}✗${RESET} $1"; ((FAIL++)); }
info() { echo -e "    ${BLUE}→${RESET} $1"; }
section() { echo -e "\n${BOLD}$1${RESET}"; echo "  $(printf '─%.0s' {1..52})"; }

# ============================================================
section "1 · Herramientas requeridas"
# ============================================================

if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_MAJOR" -ge 22 ]; then
    ok "Node.js $NODE_VER"
  else
    warn "Node.js $NODE_VER — se requiere v22 LTS"
    info "Actualizar: nvm install 22 && nvm use 22"
  fi
else
  fail "Node.js no encontrado"
  info "Instalar: brew install node@22  o  https://nodejs.org"
fi

if command -v npm &>/dev/null; then
  ok "npm $(npm -v)"
else
  fail "npm no encontrado"
fi

if command -v git &>/dev/null; then
  GIT_VER=$(git --version | awk '{print $3}')
  ok "git $GIT_VER"
  GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
  GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
  if [ -n "$GIT_USER" ]; then
    ok "git identity: $GIT_USER <$GIT_EMAIL>"
  else
    warn "git user.name no configurado"
    info "Ejecutar: git config --global user.name 'Tu Nombre'"
    info "Ejecutar: git config --global user.email 'tu@email.cl'"
  fi
else
  fail "git no encontrado"
fi

if command -v docker &>/dev/null; then
  DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
  ok "Docker $DOCKER_VER"
  if docker info &>/dev/null 2>&1; then
    ok "Docker daemon corriendo"
  else
    fail "Docker daemon NO está corriendo — abrir Docker Desktop"
  fi
else
  fail "Docker no encontrado"
  info "Instalar: https://www.docker.com/products/docker-desktop"
fi

if docker compose version &>/dev/null 2>&1; then
  DC_VER=$(docker compose version --short 2>/dev/null || echo "v2")
  ok "Docker Compose $DC_VER"
elif command -v docker-compose &>/dev/null; then
  ok "docker-compose $(docker-compose --version | awk '{print $3}' | tr -d ',')"
else
  fail "Docker Compose no encontrado"
fi

if command -v gh &>/dev/null; then
  ok "GitHub CLI $(gh --version | head -1 | awk '{print $3}')"
  if gh auth status &>/dev/null 2>&1; then
    GH_USER=$(gh api user --jq .login 2>/dev/null || echo "autenticado")
    ok "GitHub autenticado como: $GH_USER"
  else
    warn "GitHub CLI no autenticado"
    info "Ejecutar: gh auth login"
  fi
else
  warn "GitHub CLI no instalado (recomendado)"
  info "Instalar: brew install gh"
fi

# ============================================================
section "2 · Puertos disponibles"
# ============================================================

check_port() {
  local port=$1
  local label=$2
  if lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1; then
    local proc
    proc=$(lsof -iTCP:"$port" -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR==2{print $1}')
    warn "Puerto $port ocupado ($label) — proceso: ${proc:-desconocido}"
    info "Liberar con: lsof -ti:$port | xargs kill -9"
  else
    ok "Puerto $port libre ($label)"
  fi
}

check_port 3010 "alcop-web"
check_port 3011 "alcop-api"
check_port 5434 "PostgreSQL"
check_port 6380 "Redis"
check_port 5051 "pgAdmin"
check_port 8082 "Redis Commander"

# ============================================================
section "3 · Archivos de configuración (.env)"
# ============================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

API_ENV="$PROJECT_DIR/alcop-api/.env"
if [ -f "$API_ENV" ]; then
  ok "alcop-api/.env existe"
  REQUIRED_API_VARS=(
    "NODE_ENV" "PORT" "DATABASE_URL" "REDIS_URL"
    "BETTER_AUTH_SECRET" "BETTER_AUTH_URL" "CORS_ORIGIN"
  )
  for var in "${REQUIRED_API_VARS[@]}"; do
    if grep -q "^${var}=" "$API_ENV" 2>/dev/null; then
      VAL=$(grep "^${var}=" "$API_ENV" | cut -d'=' -f2-)
      if [ -n "$VAL" ]; then
        if [[ "$var" == *"SECRET"* || "$var" == *"PASSWORD"* || "$var" == *"KEY"* ]]; then
          ok "  $var=***"
        else
          ok "  $var=$VAL"
        fi
      else
        warn "  $var está vacío"
      fi
    else
      fail "  $var no definido en alcop-api/.env"
    fi
  done
else
  warn "alcop-api/.env no existe aún"
  info "Se creará al hacer el scaffold del backend (ver ALCOP-SCAFFOLD-PROMPT.md)"
fi

WEB_ENV="$PROJECT_DIR/alcop-web/.env.local"
if [ -f "$WEB_ENV" ]; then
  ok "alcop-web/.env.local existe"
  if grep -q "^NEXT_PUBLIC_API_URL=" "$WEB_ENV"; then
    API_URL=$(grep "^NEXT_PUBLIC_API_URL=" "$WEB_ENV" | cut -d'=' -f2-)
    ok "  NEXT_PUBLIC_API_URL=$API_URL"
  else
    fail "  NEXT_PUBLIC_API_URL no definido en alcop-web/.env.local"
  fi
else
  warn "alcop-web/.env.local no existe aún"
  info "Se creará al hacer el scaffold del frontend (ver ALCOP-SCAFFOLD-PROMPT.md)"
fi

# ============================================================
section "4 · Conectividad a servicios Docker"
# ============================================================

if docker info &>/dev/null 2>&1; then
  PG_RUNNING=$(docker ps --filter "name=alcop_postgres" --filter "status=running" -q 2>/dev/null)
  REDIS_RUNNING=$(docker ps --filter "name=alcop_redis" --filter "status=running" -q 2>/dev/null)

  if [ -n "$PG_RUNNING" ]; then
    if docker exec alcop_postgres pg_isready -U alcop_user -d alcop_db &>/dev/null 2>&1; then
      ok "PostgreSQL accesible (alcop_db)"
    else
      fail "PostgreSQL contenedor activo pero no responde"
    fi
  else
    warn "Contenedor alcop_postgres no está corriendo"
    info "Levantar con: make up"
  fi

  if [ -n "$REDIS_RUNNING" ]; then
    if docker exec alcop_redis redis-cli -a alcop_redis_pass ping 2>/dev/null | grep -q "PONG"; then
      ok "Redis accesible (PONG)"
    else
      fail "Redis contenedor activo pero no responde"
    fi
  else
    warn "Contenedor alcop_redis no está corriendo"
    info "Levantar con: make up"
  fi
else
  warn "Docker no disponible — saltando verificación de servicios"
fi

# ============================================================
section "5 · Estructura del proyecto"
# ============================================================

[ -f "$PROJECT_DIR/CLAUDE.md" ] && ok "CLAUDE.md presente" || fail "CLAUDE.md no encontrado — contexto del proyecto faltante"
[ -f "$PROJECT_DIR/docker-compose.yml" ] && ok "docker-compose.yml presente" || fail "docker-compose.yml no encontrado"
[ -f "$PROJECT_DIR/Makefile" ] && ok "Makefile presente" || warn "Makefile no encontrado"
[ -d "$PROJECT_DIR/alcop-api" ] && ok "alcop-api/ existe" || warn "alcop-api/ no existe aún — pendiente scaffold (ver ALCOP-SCAFFOLD-PROMPT.md)"
[ -d "$PROJECT_DIR/alcop-web" ] && ok "alcop-web/ existe" || warn "alcop-web/ no existe aún — pendiente scaffold (ver ALCOP-SCAFFOLD-PROMPT.md)"

# ============================================================
section "Resumen"
# ============================================================
echo ""
TOTAL=$((PASS + WARN + FAIL))
echo -e "  Total verificaciones: $TOTAL"
echo -e "  ${GREEN}✓ OK:${RESET}        $PASS"
echo -e "  ${YELLOW}⚠  Advertencias:${RESET} $WARN"
echo -e "  ${RED}✗ Errores:${RESET}    $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Hay $FAIL error(es) crítico(s) que deben resolverse antes de continuar.${RESET}"
  echo ""
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "  ${YELLOW}${BOLD}Entorno listo con $WARN advertencia(s) — revisar antes del siguiente paso.${RESET}"
  echo ""
  exit 0
else
  echo -e "  ${GREEN}${BOLD}Entorno 100% listo. ¡A construir!${RESET}"
  echo ""
  exit 0
fi
