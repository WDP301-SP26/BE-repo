# Install dependencies
FROM node:20-alpine AS install

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Build the application
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/node_modules ./node_modules

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Prepare the production image
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy the built application
COPY --from=build /usr/src/app/dist ./dist

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]