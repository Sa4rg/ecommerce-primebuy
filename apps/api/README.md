# E-commerce Backend API

Node.js + Express API for the e-commerce platform.

## Tech Stack

- Node.js + Express
- MySQL (via Knex.js)
- Vitest (testing)
- Repository Pattern (InMemory + MySQL)
- Dependency Injection

## Development Workflows

### 1. Unit Tests (Fast, No Docker Required)

Uses in-memory repositories for fast feedback during development.

```bash
pnpm --filter api test
pnpm --filter api test:watch
```

**Characteristics:**
- No database required
- Fast execution
- Tests business logic in isolation

### 2. Integration Tests (With MySQL)

Tests real database interactions using Docker MySQL container.

```bash
# Start MySQL container
pnpm --filter api db:up

# Run integration tests
pnpm --filter api test:db

# Stop MySQL container (optional)
pnpm --filter api db:down
```

**Characteristics:**
- Requires Docker
- Tests real MySQL persistence
- Uses `ecommerce_test` database
- Automatically enabled with `DB_INTEGRATION=1`

### 3. Run API with MySQL (Local Development)

Start the API server using real MySQL persistence.

```bash
# 1. Start MySQL container
pnpm --filter api db:up

# 2. Run migrations
DB_PROVIDER=mysql pnpm --filter api db:migrate

# 3. Start the API
pnpm --filter api dev
```

**Prerequisites:**
- Copy `.env.example` to `.env` (optional, defaults are set)
- Ensure `DB_PROVIDER=mysql` is set in `.env` or as environment variable
- Docker must be running

**Default Configuration:**
- Database: `ecommerce_dev`
- Host: `localhost`
- Port: `3307`
- User: `ecommerce`
- Password: `ecommerce`

## Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `DB_PROVIDER`: Set to `mysql` to use MySQL instead of in-memory repositories
- `DB_HOST`: MySQL host (default: `localhost`)
- `DB_PORT`: MySQL port (default: `3307`)
- `DB_NAME`: Development database name (default: `ecommerce_dev`)
- `DB_NAME_TEST`: Test database name (default: `ecommerce_test`)

## Database Connection (Production)

Some cloud database providers (AWS RDS, Azure Database, etc.) require SSL connections.

SSL support is **optional** and controlled via environment variables:

- `DB_SSL`: Set to `"1"` to enable SSL connections
- `DB_SSL_REJECT_UNAUTHORIZED`: Controls certificate validation (default: `"1"`)
  - `"1"` (default): Requires valid, trusted certificates (production recommended)
  - `"0"`: Accepts self-signed certificates (development/staging only)

**Development & Docker:**
- SSL is **not required** for local MySQL (Docker)
- Leave `DB_SSL` unset for local development

**Production Example:**

```bash
# Production with SSL (valid certificates)
DB_SSL=1
DB_SSL_REJECT_UNAUTHORIZED=1  # Optional, this is the default

# Staging with self-signed certificates
DB_SSL=1
DB_SSL_REJECT_UNAUTHORIZED=0
```

## Database Migrations

```bash
# Run all pending migrations
pnpm --filter api db:migrate

# Rollback last migration
pnpm --filter api db:rollback

# Check migration status
pnpm --filter api db:status
```

## Pasos Tipicos de Deploy

# Install dependency
pnpm install --prod

# Execute migrations
pnpm --filter api db:migrate

# up server
pnpm --filter api start

Las migraciones son parte del deploy, no del runtime.


## Project Structure

```
src/
├── app.js                 # Express app setup
├── server.js              # Server entry point
├── composition/           # Dependency Injection
│   ├── root.js           # Composition root
│   └── factories/        # Repository factories
├── controllers/          # HTTP request handlers
├── services/             # Business logic
├── repositories/         # Data persistence
│   ├── */memory.*        # In-memory implementations
│   └── */mysql.*         # MySQL implementations
├── routes/               # Route definitions
├── middlewares/          # Express middlewares
├── config/               # Configuration
├── db/                   # Database
│   └── migrations/       # Knex migrations
└── utils/                # Shared utilities
```

## Architecture

This project follows **Clean Architecture** principles with the **Repository Pattern**.

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic, orchestrate repositories
- **Repositories**: Abstract data persistence (InMemory or MySQL)
- **Composition Root**: Wires all dependencies in one place

See [AGENTS.md](../../AGENTS.md) for detailed architecture rules and conventions.

## Related Documentation

- [AGENTS.md](../../AGENTS.md) - Architecture rules and AI agent guidelines
- [apps/docs/purchase-flow.md](../docs/purchase-flow.md) - Purchase flow domain documentation
- [apps/docs/database-migration.md](../docs/database-migration.md) - Database migration guide
