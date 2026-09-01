FROM node:24-alpine AS deps

WORKDIR /workspace

COPY package*.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY api/services/admin-panel/platform-api/package.json api/services/admin-panel/platform-api/package.json
COPY api/services/projects/client-api/package.json api/services/projects/client-api/package.json
COPY admin/package.json admin/package.json

RUN npm ci

FROM deps AS base
COPY . .
RUN npm run prisma:generate -w @peptrace/api

FROM base AS build
RUN npm run build

FROM base AS db-init-prod
WORKDIR /workspace/api/services/admin-panel/platform-api
CMD ["npm", "run", "db:setup"]

FROM node:24-alpine AS service-runtime

WORKDIR /workspace
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY api/services/admin-panel/platform-api/package.json api/services/admin-panel/platform-api/package.json
COPY api/services/projects/client-api/package.json api/services/projects/client-api/package.json
COPY admin/package.json admin/package.json

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /workspace/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /workspace/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /workspace/packages/domain/dist ./packages/domain/dist
COPY --from=build /workspace/packages/api-client/dist ./packages/api-client/dist

FROM service-runtime AS platform-api-prod
WORKDIR /workspace/api/services/admin-panel/platform-api
COPY --from=build /workspace/api/services/admin-panel/platform-api/dist ./dist
COPY --from=build /workspace/api/services/admin-panel/platform-api/prisma ./prisma
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" > /dev/null 2>&1 || exit 1
USER node
CMD ["node", "dist/main.js"]

FROM service-runtime AS client-api-prod
WORKDIR /workspace/api/services/projects/client-api
COPY --from=build /workspace/api/services/projects/client-api/dist ./dist
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${CLIENT_API_PORT:-3001}/client-api/health" > /dev/null 2>&1 || exit 1
USER node
CMD ["node", "dist/main.js"]

FROM nginx:1.27-alpine AS admin-prod
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1/health" > /dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]

FROM base AS api-dev
EXPOSE 3000
CMD ["npm", "run", "dev:api"]

FROM base AS client-api-dev
EXPOSE 3001
CMD ["npm", "run", "dev:client-api"]

FROM base AS admin-dev
EXPOSE 5173
CMD ["npm", "run", "dev:admin:docker"]
