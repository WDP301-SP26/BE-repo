# Install dependencies
FROM node:lts-bookworm AS install

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Build the application
FROM node:lts-bookworm AS build
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Generate Prisma Client (if prisma schema exists)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Build the NestJS application
RUN npm run build

# Prepare the production image
FROM node:lts-bookworm AS production
WORKDIR /usr/src/app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy generated Prisma Client from build stage
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema
COPY --from=build /usr/src/app/prisma ./prisma

# Copy the built application
COPY --from=build /usr/src/app/dist ./dist

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]