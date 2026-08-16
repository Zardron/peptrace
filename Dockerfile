FROM node:24-alpine AS base

WORKDIR /workspace

COPY package*.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/client-api/package.json apps/client-api/package.json
COPY apps/admin/package.json apps/admin/package.json

RUN npm install

COPY . .
RUN npm run prisma:generate -w @peptrace/api

FROM base AS api-dev
EXPOSE 3000
CMD ["npm", "run", "dev:api"]

FROM base AS client-api-dev
EXPOSE 3001
CMD ["npm", "run", "dev:client-api"]

FROM base AS admin-dev
EXPOSE 5173
CMD ["npm", "run", "dev:admin:docker"]
