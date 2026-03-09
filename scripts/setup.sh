#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# VoxProof — Premier déploiement
# Usage: ./scripts/setup.sh
# Prérequis: .env rempli, DNS pointant sur ce serveur
# ─────────────────────────────────────────────────────────────────────────────
set -e

source .env

echo "======================================================================"
echo " VoxProof — Setup initial"
echo " APP_DOMAIN  : $APP_DOMAIN"
echo " BLOG_DOMAIN : $BLOG_DOMAIN"
echo " GHOST       : $GHOST_ENABLED"
echo "======================================================================"

# ── 1. Docker installé ?
if ! command -v docker &>/dev/null; then
  echo "[1/5] Installation de Docker..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $USER
  echo "      Docker installé. Reconnectez-vous si nécessaire."
else
  echo "[1/5] Docker OK ($(docker --version))"
fi

# ── 2. Configurer nginx templates Ghost
if [ "$GHOST_ENABLED" = "true" ]; then
  echo "[2/5] Ghost activé — template ghost inclus"
else
  echo "[2/5] Ghost désactivé — suppression du template ghost"
  rm -f nginx/templates/ghost.conf.template
fi

# ── 3. Démarrer nginx en HTTP seul pour le challenge certbot
echo "[3/5] Démarrage nginx HTTP (challenge certbot)..."
# Config temporaire HTTP-only pour que certbot puisse valider
cat > /tmp/http-only.conf << EOF
server {
    listen 80;
    server_name $APP_DOMAIN api.$APP_DOMAIN audio.$APP_DOMAIN ${BLOG_DOMAIN:-""};
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / { return 200 'ok'; add_header Content-Type text/plain; }
}
EOF

docker compose up -d postgres
docker run --rm -d --name tmp_nginx \
  -p 80:80 \
  -v /tmp/http-only.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(docker volume inspect voxproof_certbot_webroot -f '{{.Mountpoint}}'):/var/www/certbot \
  nginx:1.27-alpine

# ── 4. Obtenir les certificats SSL
echo "[4/5] Obtention des certificats Let's Encrypt..."

DOMAINS="-d $APP_DOMAIN -d api.$APP_DOMAIN -d audio.$APP_DOMAIN"
if [ "$GHOST_ENABLED" = "true" ] && [ -n "$BLOG_DOMAIN" ]; then
  DOMAINS="$DOMAINS -d $BLOG_DOMAIN"
fi

docker run --rm \
  -v voxproof_certbot_webroot:/var/www/certbot \
  -v voxproof_certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    $DOMAINS \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --non-interactive

docker stop tmp_nginx

# ── 5. Lancer tous les services
echo "[5/5] Lancement de tous les services..."

if [ "$GHOST_ENABLED" = "true" ]; then
  export COMPOSE_PROFILES=ghost
fi

docker compose up -d --build

echo ""
echo "======================================================================"
echo " Déploiement terminé !"
echo " https://$APP_DOMAIN"
echo " https://api.$APP_DOMAIN"
if [ "$GHOST_ENABLED" = "true" ]; then
  echo " https://$BLOG_DOMAIN"
fi
echo "======================================================================"
