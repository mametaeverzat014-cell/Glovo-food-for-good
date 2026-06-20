# Multi-stage build for the FoodSave NestJS API.
# Build context is this directory (apps/api), so it is self-contained.

FROM node:20-slim AS base
WORKDIR /app
# OpenSSL is required by the Prisma query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# --- Build stage: install all deps, generate client, compile TS ---
FROM base AS build
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage: production deps + compiled output ---
FROM base AS runner
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist

EXPOSE 4000
# Sync the schema to the database on boot, then start the server.
CMD ["npm", "run", "start:prod"]
