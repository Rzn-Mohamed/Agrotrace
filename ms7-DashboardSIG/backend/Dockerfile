# ============================================================================
# Dockerfile pour le Backend API (Node.js/Express)
# DashboardSIG - AgroTrace-MS
# ============================================================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install --omit=dev

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copie des node_modules depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copie du code source
COPY --chown=nodejs:nodejs . .

# Changement vers l'utilisateur non-root
USER nodejs

# Exposition du port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrage de l'application
CMD ["node", "src/server.js"]
