# Stage 1: Build
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/
COPY tsconfig*.json ./

# Construir la aplicación
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar archivos compilados desde el stage de build
COPY --from=builder /app/dist ./dist

# Establecer variables de entorno
ENV NODE_ENV=production

# Exponer puerto dinámico
ENV PORT=3000
EXPOSE ${PORT}

# Comando de inicio
CMD ["node", "dist/main.js"] 