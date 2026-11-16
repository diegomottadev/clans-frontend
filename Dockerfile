# ---- Build ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# URL del backend (se inyecta en el build; tiene prioridad sobre .env.production)
ARG REACT_APP_BASE_URL=http://localhost:8080
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
RUN npm run build

# ---- Serve ----
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
