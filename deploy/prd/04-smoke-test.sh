#!/usr/bin/env bash
# 04-smoke-test.sh — Verificación post-deploy (corre desde cualquier máquina).
# Uso:  API=https://api.dominio WEB=https://app.dominio bash 04-smoke-test.sh
set -uo pipefail
API="${API:?}"; WEB="${WEB:?}"; FAIL=0
check() { local name="$1" url="$2" expect="$3"
  code=$(curl -s -o /tmp/smoke.out -w '%{http_code}' --max-time 15 "$url")
  if [ "$code" = "$expect" ]; then echo "✅ $name ($code)"; else echo "❌ $name → $code (esperado $expect)"; FAIL=1; fi; }

check "API /health"        "$API/health"  200
grep -q '"ok"' /tmp/smoke.out || { echo "❌ /health no dice ok"; FAIL=1; }
check "WEB /login"         "$WEB/login"   200
# CORS: el preflight desde el WEB debe devolver su origen
acao=$(curl -s -D - -o /dev/null -X OPTIONS "$API/api/auth/get-session" \
  -H "Origin: $WEB" -H 'Access-Control-Request-Method: GET' | grep -i '^access-control-allow-origin' | tr -d '\r')
[[ "$acao" == *"$WEB"* ]] && echo "✅ CORS ($acao)" || { echo "❌ CORS no permite $WEB"; FAIL=1; }
# TLS: días al vencimiento del certificado
for h in "$API" "$WEB"; do
  host=${h#https://}; end=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  echo "🔒 $host vence: ${end:-SIN CERT}"; [ -n "$end" ] || FAIL=1
done
exit $FAIL
