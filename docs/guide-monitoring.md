# Guide de monitoring VoxProof
### A relire avant toute intervention sur le serveur

---

## Vérification rapide de l'état du système

```bash
pm2 status
```

Tu dois voir 3 process **online** :
- `voxproof-backend` (port 4000)
- `voxproof-frontend` (port 5174)
- `voxproof-processor` (port 5000)

Si un process est `stopped` ou `errored` → le redémarrer :
```bash
pm2 restart voxproof-backend
pm2 restart voxproof-frontend
pm2 restart voxproof-processor
```

---

## Alertes automatiques

### Ce qui se passe en cas de crash
1. Le cron tourne toutes les 5 minutes et vérifie que les 3 process sont `online`
2. Si l'un est arrêté → email à **ptriem@gmail.com** + WhatsApp **+33678808527**
3. Si le **serveur entier tombe** → UptimeRobot envoie une alerte email

### Script de monitoring
Fichier : `/home/phil/voxproof/scripts/pm2-alert.sh`
Cron : `crontab -l` pour voir la config

---

## Logs

```bash
# Logs en temps réel
pm2 logs

# Logs d'un service spécifique
pm2 logs voxproof-backend --lines 50
pm2 logs voxproof-processor --lines 50
pm2 logs voxproof-frontend --lines 50

# Logs sans suivre (snapshot)
pm2 logs voxproof-backend --lines 50 --nostream
```

Fichiers de logs : `~/.pm2/logs/`

---

## Redémarrage après modification du code

### Frontend (React)
```bash
cd /home/phil/voxproof/frontend
npm run build
pm2 restart voxproof-frontend
```

### Backend (Node.js)
```bash
cd /home/phil/voxproof/backend
# Si modification du schema Prisma :
DATABASE_URL="postgresql://voxproof:password@localhost:5432/voxproof" npx prisma generate --schema=src/prisma/schema.prisma
npm run build
pm2 restart voxproof-backend --update-env
```

### Processor (Python)
```bash
pm2 restart voxproof-processor
```

---

## Blog Ghost

### Vérifier l'état
```bash
cd /var/www/ghost && ghost status
```

### Redémarrer
```bash
cd /var/www/ghost && ghost restart
# ou
sudo systemctl restart ghost_blog-voxproof-com
```

### Logs Ghost
```bash
sudo journalctl -u ghost_blog-voxproof-com -n 50
```

### Back-office
URL : https://blog.voxproof.com/ghost/
Compte admin : ptriem@gmail.com

---

## Base de données PostgreSQL

```bash
# Se connecter
psql "postgresql://voxproof:password@localhost:5432/voxproof"

# Vérifier les sessions récentes
psql "postgresql://voxproof:password@localhost:5432/voxproof" -c \
  "SELECT id, status, \"createdAt\" FROM voice_sessions ORDER BY \"createdAt\" DESC LIMIT 10;"

# Vérifier les utilisateurs
psql "postgresql://voxproof:password@localhost:5432/voxproof" -c \
  "SELECT id, email, \"kycStatus\", \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 10;"
```

---

## Nginx

```bash
# Vérifier la config
sudo nginx -t

# Recharger après modification
sudo nginx -s reload

# Configs des sites
ls /etc/nginx/sites-enabled/
```

---

## Commandes utiles en cas d'urgence

```bash
# Redémarrer tous les services VoxProof
pm2 restart all

# Voir la consommation mémoire/CPU
pm2 monit

# Vérifier l'espace disque
df -h

# Vérifier la RAM
free -h
```

---

## URLs importantes

| Service | URL |
|---------|-----|
| Application | https://voxproof.com |
| Blog | https://blog.voxproof.com |
| Back-office Ghost | https://blog.voxproof.com/ghost/ |
| Admin VoxProof | https://voxproof.com/admin |
| Snowtrace (transactions) | https://snowtrace.io |
| UptimeRobot | https://uptimerobot.com |
| Stripe | https://dashboard.stripe.com |
| Brevo | https://app.brevo.com |
| Pinata | https://app.pinata.cloud |

---

*Guide créé le 07/03/2026*
