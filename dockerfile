# ------------------------------------------
# Base image
# ------------------------------------------
FROM node:22 AS base
WORKDIR /app

# ------------------------------------------
# Install dependencies
# ------------------------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ------------------------------------------
# Build stage
# ------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client in the correct environment
RUN npx prisma generate
# Build NestJS
RUN npm run build

# ------------------------------------------
# Production image
# ------------------------------------------
FROM node:22-slim AS prod
WORKDIR /app

# Better security
USER node

# Copy built app and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

# Expose Nest port
EXPOSE 3000

# Start
CMD ["node", "dist/main.js"]
