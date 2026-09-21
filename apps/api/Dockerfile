FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../../packages/database/package*.json ../../packages/database/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .
COPY ../../packages/database ../../packages/database

# Generate Prisma Client
RUN cd ../../packages/database && npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
