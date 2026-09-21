FROM node:18-alpine AS builder
WORKDIR /app/apps/api
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api ./
COPY packages/database ../../packages/database
WORKDIR /app/packages/database
RUN npx prisma generate
WORKDIR /app/apps/api
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
