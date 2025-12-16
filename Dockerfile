# ==========================================
# ETAPA 1: BASE (Entorno Node + PNPM)
# ==========================================
FROM node:20-alpine AS base
# Activamos pnpm nativo de Node.js
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ==========================================
# ETAPA 2: DEPENDENCIAS (Caché inteligente)
# ==========================================
FROM base AS deps
WORKDIR /app
# Copiamos solo lo necesario para instalar dependencias
COPY package.json pnpm-lock.yaml ./ 
# Instalamos dependencias (usando caché para velocidad)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ==========================================
# ETAPA 3: BUILDER (Compilación Vite)
# ==========================================
FROM base AS builder
WORKDIR /app
COPY . .
# Traemos las dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
# Argumentos de construcción (opcional para env vars)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Construimos la app (genera carpeta /dist)
RUN pnpm run build

# ==========================================
# ETAPA 4: RUNNER (Servidor Nginx Ligero)
# ==========================================
FROM nginx:alpine AS runner

# Copiamos el build final de React al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos una configuración básica de Nginx (opcional, usa la default si no tienes una)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (estándar web)
EXPOSE 80

# Arrancamos Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]