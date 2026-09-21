FROM node:18-alpine AS builder
WORKDIR /app/apps/encoder
COPY apps/encoder/package*.json ./
RUN npm install
COPY apps/encoder ./
RUN npm run build

FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=builder /app/apps/encoder/dist ./dist
COPY --from=builder /app/apps/encoder/node_modules ./node_modules
COPY --from=builder /app/apps/encoder/package*.json ./

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3002
CMD ["npm", "run", "start:prod"]
