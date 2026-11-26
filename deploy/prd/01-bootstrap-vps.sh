#!/usr/bin/env bash
# 01-bootstrap-vps.sh — Preparación del VPS PRD (Ubuntu 22.04/24.04) + instalación de Coolify.
# Ejecutar como root en el VPS NUEVO:   bash 01-bootstrap-vps.sh
# Idempotente en lo posible. Revisa la sección SSH antes de cerrar tu sesión actual.
set -euo pipefail

ADMIN_USER="${ADMIN_USER:-deploy}"      # usuario sudo para administración
SWAP_GB="${SWAP_GB:-4}"
TZ_NAME="America/Santiago"

echo "==> Sistema y paquetes base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y
apt-get install -y sudo curl wget git ufw fail2ban python3-systemd unattended-upgrades apt-listchanges ca-certificates jq htop
timedatectl set-timezone "$TZ_NAME"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Swap (${SWAP_GB}G) — Chromium de la API + builds de Next lo agradecen"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l "${SWAP_GB}G" /swapfile && chmod 600 /swapfile
  mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10 && echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo "==> Usuario administrador: $ADMIN_USER"
if ! id "$ADMIN_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$ADMIN_USER"
  usermod -aG sudo "$ADMIN_USER"
  mkdir -p /home/$ADMIN_USER/.ssh
  cp /root/.ssh/authorized_keys /home/$ADMIN_USER/.ssh/ 2>/dev/null || true
  chown -R $ADMIN_USER:$ADMIN_USER /home/$ADMIN_USER/.ssh && chmod 700 /home/$ADMIN_USER/.ssh
fi

echo "==> Firewall (UFW)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp   # UI de Coolify — cerrar cuando tenga dominio propio (ver runbook §2)
ufw --force enable

echo "==> fail2ban (sshd vía journald — Debian 12 no tiene /var/log/auth.log)"
cat > /etc/fail2ban/jail.d/sshd.local <<'JAIL'
[sshd]
enabled  = true
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
JAIL
systemctl enable fail2ban && systemctl restart fail2ban
for i in $(seq 1 15); do fail2ban-client ping &>/dev/null && break; sleep 1; done
fail2ban-client status sshd || { echo "⚠️  fail2ban no respondió:"; systemctl status fail2ban --no-pager | tail -15; }

echo "==> Instalando Coolify (script oficial)"
if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^coolify$'; then
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
fi

cat <<MSG

✅ Bootstrap terminado.
   - Coolify: http://$(curl -s ifconfig.me):8000  → crear la cuenta admin AHORA (el primero que entra la toma).
   - Verifica login con:  ssh ${ADMIN_USER}@<ip>  ANTES de endurecer SSH.
   - Endurecer SSH (cuando lo anterior funcione):
       sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
       sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
       systemctl reload ssh
     (Coolify gestiona el host local vía root+llave; por eso prohibit-password y no "no".)
MSG
