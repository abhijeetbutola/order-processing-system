# api/Dockerfile
FROM node:20-alpine

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# package manifests first (layer caching)
COPY api/package*.json ./api/
COPY prisma/package*.json ./prisma/
COPY shared/package*.json ./shared/

# schema is needed before any prisma generate
COPY prisma/schema.prisma ./prisma/

# skip postinstall — schema generators need full source + node_modules layout
WORKDIR /app/api
RUN npm install --ignore-scripts

WORKDIR /app/prisma
RUN npm install --ignore-scripts

WORKDIR /app/shared
RUN npm install --ignore-scripts

WORKDIR /app
COPY api/ ./api/
COPY prisma/ ./prisma/
COPY shared/ ./shared/

# generate clients into api/shared/prisma (and workers path stub)
WORKDIR /app/api
RUN npx prisma generate --schema=../prisma/schema.prisma

EXPOSE 3000
CMD ["npm", "run", "dev"]
