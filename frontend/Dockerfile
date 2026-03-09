# ── Stage 1 : build React ───────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Build args → Vite env vars (embedded at build time)
ARG VITE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PRICE_ANNUAL
ARG VITE_STRIPE_PRICE_LIFETIME
ARG VITE_CONTRACT_ADDRESS
ARG VITE_AVALANCHE_CHAIN_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PRICE_ANNUAL=$VITE_STRIPE_PRICE_ANNUAL
ENV VITE_STRIPE_PRICE_LIFETIME=$VITE_STRIPE_PRICE_LIFETIME
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS
ENV VITE_AVALANCHE_CHAIN_ID=$VITE_AVALANCHE_CHAIN_ID

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ── Stage 2 : serve avec nginx ──────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
