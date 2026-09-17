# syntax=docker/dockerfile:1

# ---- Build (TypeScript + Vite -> dist) ----
FROM node:24-alpine AS build
WORKDIR /app

# Vite bakes VITE_* vars into the bundle at build time, so they must be
# provided as build args (see the build jobs in docker.yml / deploy-preview.yml).
# All of these are browser-public values. VITE_API_BASE_URL defaults to /api,
# which matches the Traefik PathPrefix(`/api`) routing in docker-compose.deploy.yml.
ARG VITE_API_BASE_URL=/api
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ] || \
    { echo "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY build args are required"; exit 1; }

COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Runtime (static files served by nginx) ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1/health" > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
