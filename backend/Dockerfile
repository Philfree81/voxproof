FROM node:22-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci --prefer-offline

# Code source + schema Prisma
COPY . .

# Générer le client Prisma et compiler TypeScript
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

# Entrypoint : migrations puis démarrage
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/docker-entrypoint.sh"]
