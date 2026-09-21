# MANYAK TV API Service

NestJS-based REST API for MANYAK TV streaming platform.

## Features

- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Swagger/OpenAPI Documentation
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ PostgreSQL + Prisma ORM
- ✅ Redis Caching (optional)
- ✅ Helmet Security Headers
- ✅ CORS Protection
- ✅ Compression

## Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Development

```bash
# Start in watch mode
npm run start:dev

# Start in debug mode
npm run start:debug
```

## Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

Once running, visit: http://localhost:3000/api/docs

## Project Structure

```
src/
├── auth/           # Authentication & JWT
├── users/          # User management
├── content/        # Movies, series, episodes
├── payments/       # Payment processing
├── admin/          # Admin operations
├── prisma/         # Database service
└── common/         # Shared utilities
```

## Environment Variables

See `.env.example` for required variables.

## License

MIT
