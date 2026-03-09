# VoxProof — Guide de déploiement

## Deux modes de déploiement

| | PM2 (serveur actuel) | Docker Compose (nouveaux clients) |
|---|---|---|
| **Prérequis** | Node, Python, PostgreSQL installés manuellement | Docker uniquement |
| **Isolation** | Processus partagent l'OS | Chaque service dans son container |
| **Portabilité** | Dépend de l'OS et des versions installées | Identique sur n'importe quel VPS Ubuntu |
| **Multi-instance** | Complexe (conflits de ports) | Simple (un dossier par client) |
| **Mise à jour** | `git pull` + `npm run build` + `pm2 restart` | `./scripts/deploy.sh` |
| **Premier déploiement** | Manuel (installer Node, Python, Postgres…) | `./scripts/setup.sh` |
| **SSL** | Certbot installé sur l'OS | Certbot dans un container |

---

## Mode PM2 — Serveur actuel (57.129.137.157)

### Architecture

```
Internet (80/443)
      │
   Nginx (OS)          ← /etc/nginx/sites-enabled/
      │
  ┌───┴──────────────────────┐
  │  voxproof-frontend :5174 │  PM2 → npm run dev (Vite)
  │  voxproof-backend  :4000 │  PM2 → node dist/index.js
  │  voxproof-processor:5000 │  PM2 → uvicorn main:app
  │  PostgreSQL        :5432 │  Service système
  │  Ghost             :2368 │  Systemd
  └──────────────────────────┘
```

> **Important** : Nginx sert le `frontend/dist/` (build statique).
> Après chaque modification frontend, il faut **rebuilder** :
> ```bash
> cd /home/phil/voxproof/frontend && npm run build
> ```

### Déploiement d'une mise à jour

```bash
# Se connecter
ssh phil@57.129.137.157

# Récupérer les changements
cd /home/phil/voxproof
git pull origin main

# Backend — rebuild + restart
cd backend
npm run build
cd ..
~/.npm-global/bin/pm2 restart voxproof-backend

# Frontend — rebuild (Nginx sert le dist/)
cd frontend
npm run build
cd ..

# Processor Python — restart si changement audio.py
~/.npm-global/bin/pm2 restart voxproof-processor

# Après une migration Prisma
cd backend
DATABASE_URL="postgresql://voxproof:password@localhost:5432/voxproof" \
  npx prisma migrate deploy --schema=src/prisma/schema.prisma
npm run build
~/.npm-global/bin/pm2 restart voxproof-backend
```

### Monitoring PM2

```bash
# Statut de tous les services
~/.npm-global/bin/pm2 status

# Logs en direct (tous les services)
~/.npm-global/bin/pm2 logs

# Logs d'un service spécifique
~/.npm-global/bin/pm2 logs voxproof-backend
~/.npm-global/bin/pm2 logs voxproof-processor

# Dashboard interactif (CPU, RAM, logs)
~/.npm-global/bin/pm2 monit

# Historique des redémarrages
~/.npm-global/bin/pm2 show voxproof-backend
```

### Commandes utiles PM2

```bash
# Redémarrer un service
~/.npm-global/bin/pm2 restart voxproof-backend

# Arrêter / démarrer
~/.npm-global/bin/pm2 stop voxproof-backend
~/.npm-global/bin/pm2 start voxproof-backend

# Sauvegarder la config (survit aux reboots)
~/.npm-global/bin/pm2 save

# Recharger sans downtime (si possible)
~/.npm-global/bin/pm2 reload voxproof-backend
```

### Nginx (PM2)

```bash
# Tester la config
sudo nginx -t

# Recharger sans downtime
sudo nginx -s reload

# Logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL (PM2)

```bash
# Connexion directe
psql -U voxproof -d voxproof -h localhost

# Statut
sudo systemctl status postgresql

# Backup manuel
pg_dump -U voxproof voxproof > backup_$(date +%Y%m%d).sql
```

---

## Mode Docker Compose — Nouveaux clients

### Architecture

```
Internet (80/443)
      │
  [nginx container]       ← reverse proxy + SSL certbot
      │   réseau Docker interne (voxproof_net)
  ┌───┴──────────────────────────────┐
  │  frontend  (nginx:alpine) :80    │
  │  backend   (node:22)      :4000  │
  │  processor (python:3.11)  :5000  │
  │  postgres  (postgres:16)  :5432  │
  │  ghost     (ghost:5) :2368       │  ← optionnel (GHOST_ENABLED=true)
  │  certbot   (certbot)             │  ← renouvellement SSL auto
  └──────────────────────────────────┘
```

Seuls les ports **80 et 443** sont ouverts sur Internet.
PostgreSQL et les services internes ne sont **jamais exposés**.

### Premier déploiement (une seule fois)

```bash
# 1. Cloner le repo
git clone https://github.com/Philfree81/voxproof
cd voxproof

# 2. Configurer l'environnement
cp .env.example .env
nano .env   # Remplir TOUS les champs (domaines, Stripe, Blockchain…)

# 3. Lancer le setup automatique
chmod +x scripts/setup.sh
./scripts/setup.sh
# → installe Docker si absent
# → obtient les certificats SSL Let's Encrypt
# → build et démarre tous les containers
```

#### Variables .env obligatoires pour Docker

```bash
# Domaines
APP_DOMAIN=app.client.com        # → frontend sur ce domaine
                                  # → API sur api.app.client.com
                                  # → Processor sur audio.app.client.com
BLOG_DOMAIN=blog.client.com      # → Ghost (si GHOST_ENABLED=true)
GHOST_ENABLED=false
LETSENCRYPT_EMAIL=admin@client.com

# Base de données
POSTGRES_USER=voxproof
POSTGRES_PASSWORD=motdepassefort
POSTGRES_DB=voxproof

# Backend (pointe vers les services Docker internes)
FRONTEND_URL=https://app.client.com
PROCESSOR_URL=http://processor:5000   # ← nom du container Docker

# Frontend (URLs publiques, embarquées dans le build)
VITE_API_URL=https://api.app.client.com
```

### Mise à jour après un changement de code

```bash
# Sur le serveur client
cd /path/to/voxproof
./scripts/deploy.sh

# Ce que fait deploy.sh :
# 1. git pull origin main
# 2. docker compose build --no-cache frontend backend processor
# 3. docker compose up -d
```

> **Note** : Les migrations Prisma sont **appliquées automatiquement**
> au démarrage du container backend (`docker-entrypoint.sh`).

### Monitoring Docker

```bash
# Statut de tous les containers (équivalent pm2 status)
docker compose ps

# Logs en direct — tous les services (équivalent pm2 logs)
docker compose logs -f

# Logs d'un service spécifique (équivalent pm2 logs voxproof-backend)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f processor
docker compose logs -f nginx

# CPU / RAM en direct (équivalent pm2 monit)
docker stats

# Inspecter un container
docker compose exec backend sh     # ouvrir un shell
docker compose exec postgres psql -U voxproof voxproof  # accès DB
```

### Commandes utiles Docker

```bash
# Redémarrer un service
docker compose restart backend

# Arrêter tout
docker compose down

# Arrêter et supprimer les volumes (⚠ supprime la DB)
docker compose down -v

# Rebuilder un seul service sans toucher aux autres
docker compose build backend
docker compose up -d backend

# Voir les images buildées
docker compose images

# Voir les logs depuis N heures
docker compose logs --since 2h backend

# Renouveler SSL manuellement
docker compose exec certbot certbot renew
docker compose exec nginx nginx -s reload
```

### Activer Ghost après installation

```bash
# Dans .env
GHOST_ENABLED=true
BLOG_DOMAIN=blog.client.com

# Redémarrer avec le profil ghost
COMPOSE_PROFILES=ghost docker compose up -d
```

---

## Tableau comparatif des commandes

| Action | PM2 | Docker Compose |
|---|---|---|
| Voir les services | `pm2 status` | `docker compose ps` |
| Logs tous services | `pm2 logs` | `docker compose logs -f` |
| Logs d'un service | `pm2 logs voxproof-backend` | `docker compose logs -f backend` |
| Dashboard interactif | `pm2 monit` | `docker stats` |
| Redémarrer un service | `pm2 restart voxproof-backend` | `docker compose restart backend` |
| Arrêter un service | `pm2 stop voxproof-backend` | `docker compose stop backend` |
| Shell dans le service | *(directement sur l'OS)* | `docker compose exec backend sh` |
| Accès PostgreSQL | `psql -U voxproof -d voxproof` | `docker compose exec postgres psql -U voxproof voxproof` |
| Recharger nginx | `sudo nginx -s reload` | `docker compose exec nginx nginx -s reload` |
| Mise à jour complète | `git pull` + build + `pm2 restart` | `./scripts/deploy.sh` |

---

## Backup base de données

### PM2 (serveur actuel)

```bash
# Backup
pg_dump -U voxproof voxproof > /home/phil/backups/voxproof_$(date +%Y%m%d_%H%M).sql

# Restore
psql -U voxproof voxproof < backup.sql
```

### Docker

```bash
# Backup
docker compose exec -T postgres \
  pg_dump -U voxproof voxproof > backup_$(date +%Y%m%d_%H%M).sql

# Restore
docker compose exec -T postgres \
  psql -U voxproof voxproof < backup.sql
```

---

## En cas de problème

### Service qui ne démarre pas

```bash
# PM2
pm2 logs voxproof-backend --lines 50

# Docker
docker compose logs --tail=50 backend
```

### Port déjà utilisé (Docker)

```bash
# Voir quel processus utilise le port 80
sudo lsof -i :80
# Arrêter nginx système si conflit
sudo systemctl stop nginx
```

### Certificat SSL expiré (Docker)

```bash
docker compose run --rm certbot certbot renew
docker compose exec nginx nginx -s reload
```

### Réinitialiser complètement (Docker, ⚠ perd la DB)

```bash
docker compose down -v
docker compose up -d --build
```
