FROM node:18-alpine AS builder
WORKDIR /app/apps/bot
COPY apps/bot/package*.json ./
RUN npm install
COPY apps/bot ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/bot/dist ./dist
COPY --from=builder /app/apps/bot/node_modules ./node_modules
COPY --from=builder /app/apps/bot/package*.json ./
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
