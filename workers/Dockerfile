# workers/Dockerfile — one image, different CMD per worker service
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# package manifests first (layer caching)
COPY workers/package*.json ./workers/
COPY prisma/package*.json ./prisma/
COPY shared/package*.json ./shared/

# schema needed before prisma generate
COPY prisma/schema.prisma ./prisma/

# skip postinstall — generate after full source is present
WORKDIR /app/workers
RUN npm install --ignore-scripts

WORKDIR /app/prisma
RUN npm install --ignore-scripts

WORKDIR /app/shared
RUN npm install --ignore-scripts

# api generator output path must exist (schema writes multiple clients)
RUN mkdir -p /app/api/node_modules

WORKDIR /app
COPY workers/ ./workers/
COPY prisma/ ./prisma/
COPY shared/ ./shared/

WORKDIR /app/workers
RUN npx prisma generate --schema=../prisma/schema.prisma

# default; each compose service overrides this
CMD ["node", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "order.worker.ts"]
