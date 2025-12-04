# ============================================================================
# Dockerfile pour le Frontend React (Vite)
# DashboardSIG - AgroTrace-MS
# ============================================================================

# Stage 1: Builder - Construction de l'application
FROM node:20-alpine AS builder

WORKDIR /app

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_URL=http://localhost:8006/api
ENV VITE_API_URL=${VITE_API_URL}

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation de toutes les dépendances (y compris dev)
RUN npm install

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Stage 2: Production - Serveur Nginx
FROM nginx:alpine

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers buildés depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposition du port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]

