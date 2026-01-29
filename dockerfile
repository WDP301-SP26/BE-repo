# Install dependencies
FROM node:20-alpine AS install
WORKDIR /usr/src/app

# Copy dependency manifests and Prisma schema
COPY package*.json ./

# Install all dependencies and generate Prisma Client
RUN npm install && npx prisma generate

# Build stage
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy node_modules from install stage
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=install /usr/src/app/prisma ./prisma

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Copy package files and Prisma schema
COPY package*.json ./

# Install production dependencies only and generate Prisma Client
RUN npm ci --only=production && npx prisma generate

# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main"]