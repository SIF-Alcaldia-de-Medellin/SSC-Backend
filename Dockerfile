# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir la aplicación
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para producción
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar archivos compilados y de configuración desde el stage de build
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/ormconfig.ts ./
COPY --from=builder --chown=nestjs:nodejs /app/ormconfig.json ./

# Establecer variables de entorno
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Bogota

# Cambiar al usuario no root
USER nestjs

# Exponer puerto
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"] 