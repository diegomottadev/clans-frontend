# ---- Build ----
FROM node:18.20.8-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# URL del backend (se inyecta en el build; tiene prioridad sobre .env.production)
# Vacío = mismo origen (/api lo reenvía docker/nginx.conf al backend)
ARG REACT_APP_BASE_URL=
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
# No publicar el código fuente (source maps) en producción
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ---- Serve ----
FROM nginx:1.31.1-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
