#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# VoxProof — Mise à jour / redéploiement
# Usage: ./scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

source .env

echo "[deploy] Récupération du code..."
git pull origin main

echo "[deploy] Reconstruction des images..."
docker compose build --no-cache frontend backend processor

echo "[deploy] Redémarrage des services..."
if [ "$GHOST_ENABLED" = "true" ]; then
  COMPOSE_PROFILES=ghost docker compose up -d
else
  docker compose up -d
fi

echo "[deploy] Terminé."
echo ""
echo "  Logs en direct : docker compose logs -f"
echo "  Statut         : docker compose ps"
