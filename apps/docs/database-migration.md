# Database Migration – Architecture & Decisions Log

| Field    | Value                                          |
|----------|------------------------------------------------|
| Project  | ecommerce-backend                              |
| Scope    | Backend (`apps/api`)                           |
| Status   | In progress                                    |
| Audience | Developers, future maintainers, technical reviewers |

---

## 1. Context

The backend of this project initially used **in-memory persistence** (Maps and arrays) for all domain data:

- Products
- Cart
- Checkout
- Payments
- Orders
- Shipping

This approach was **intentional** during early development to:

- Enable fast TDD
- Validate business rules
- Stabilize API contracts
- Avoid premature infrastructure decisions

The project has now reached a stage where **real persistence is required**, as this is:

- A real project (not a demo)
- Intended for a real client
- Expected to grow in complexity and lifespan

> This document records all architectural decisions taken for the database migration.

---

## 2. Migration Objectives (Non-Negotiable)

The database migration must satisfy the following constraints:

### No API contract changes

- Same endpoints
- Same response shapes
- Same error messages
- Same HTTP status codes

### No business logic in the database

- SQL is for persistence only
- All rules remain in services

### TDD remains mandatory

- Existing tests must stay **GREEN**
- No logic without tests

### Incremental migration

- One bounded context at a time
- No big-bang refactor

### Backend remains the source of truth

- Frontend must not duplicate rules

---

## 3. High-Level Strategy

The migration will be executed by **replacing the persistence layer only**, while keeping:

- Routes
- Controllers
- Services
- Business rules
- Tests

**unchanged** from a behavioral perspective.

This is achieved by introducing explicit **persistence seams** via repositories and dependency injection.

---

## 4. Core Architectural Decisions

### 4.1 Database Technology

| Decision | MySQL |
|----------|-------|

**Reasoning:**

- Mature, well-known relational database
- Widely supported by hosting providers
- Good fit for transactional e-commerce data
- Simple mental model for MVP and growth

### 4.2 Database Execution Environment

| Decision | Docker for MySQL |
|----------|------------------|

**Reasoning:**

- Reproducible environments (dev / CI / future prod)
- Avoids "works on my machine" issues
- Easy reset of database state for tests
- Industry standard for real projects

### 4.3 Migrations Tooling

| Decision | Knex (JS tool for migrations + queries) |
|----------|----------------------------------------|

**Reasoning:**

- Handles migration versioning safely
- Supports MySQL natively
- Does not force an ORM
- Keeps SQL explicit when needed
- Avoids premature complexity

**Explicitly not chosen:**

- ❌ No heavy ORM
- ❌ No implicit schema generation
- ❌ No SQL inside services

### 4.4 Persistence Pattern

| Decision | Repository Pattern + Dependency Injection |
|----------|------------------------------------------|

**Description:**

- Services depend on repositories (contracts)
- Repositories hide persistence details
- Multiple implementations per repository:
  - `in-memory` (tests)
  - `MySQL` (production / integration tests)

**Reasoning:**

- Keeps services independent of DB technology
- Preserves unit test speed
- Enables gradual migration
- Improves long-term maintainability

### 4.5 Database Connection Hardening (Production)

| Decision | Optional SSL + Connection Timeouts via Environment Variables |
|----------|-------------------------------------------------------------|

**Problem:**

Production database providers (AWS RDS, Azure Database, DigitalOcean Managed Databases, etc.) commonly require or recommend SSL connections. However:

- Local Docker MySQL does not require SSL
- Unit tests run against in-memory repositories (no DB)
- Integration tests use local MySQL
- Forcing SSL globally breaks development workflows

**Solution:**

SSL support is **opt-in** via environment variables:

- `DB_SSL="1"` → Enables SSL connections
- `DB_SSL_REJECT_UNAUTHORIZED="1"` → Requires valid, trusted certificates (default)
- `DB_SSL_REJECT_UNAUTHORIZED="0"` → Accepts self-signed certificates (staging/dev only)

Connection timeouts (`acquireConnectionTimeout: 10000ms`) are always enabled across all environments to prevent hanging connections in production.

**Reasoning:**

- **Environment parity without enforcement**: Production can enable SSL without forcing it in development
- **Developer ergonomics**: Local Docker MySQL and tests remain simple (no SSL configuration)
- **Security by default in production**: When SSL is enabled, strict certificate validation is the default
- **Fail-fast behavior**: Timeouts prevent hung connections in production environments
- **No silent failures**: Missing SSL in production must be explicit (via env var), not accidental

**Impact:**

- ✅ Unit tests unaffected (no DB connection)
- ✅ Docker local development unaffected (SSL not required)
- ✅ Integration tests unaffected unless explicitly enabled
- ✅ Production deployments can enforce SSL without code changes
- ✅ No breaking changes to existing workflows

**Explicitly rejected:**

- ❌ Auto-detecting SSL requirements → Too implicit, fragile
- ❌ Forcing SSL in all environments → Breaks local development
- ❌ Using different Knex configs per environment → Violates DRY, harder to test

> This approach balances production-readiness with local development simplicity.

---

## 5. Testing Strategy During Migration

### 5.1 Unit Tests

- Continue using **in-memory repositories**
- Fast execution
- Focused on business rules
- Existing tests remain unchanged

### 5.2 Integration Tests

- New tests added for **MySQL repositories**
- Validate SQL + mappings
- Run against Docker MySQL
- Do **not** test business rules

> **Rationale:**  
> Business logic and persistence are tested separately to avoid fragile tests.

---

## 6. Product Domain Specific Decisions

### 6.1 Initial Catalog

| Decision | No hardcoded initial product catalog |
|----------|-------------------------------------|

**Reasoning:**

- Database starts empty
- Tests and seeds create required data
- Avoids hidden state

### 6.2 Product IDs

| Decision | MySQL `AUTO_INCREMENT` IDs, exposed as strings |
|----------|-----------------------------------------------|

**Reasoning:**

- Simple and reliable for MVP
- Matches existing API expectations (`id` as string)
- Avoids unnecessary UUID complexity
- Does not break existing tests/contracts

---

## 7. Migration Order (By Dependency Graph)

The migration will follow this order:

1. **Products**
2. **Cart**
3. **Checkout**
4. **Payments**
5. **Orders**
6. **Shipping**

**Reasoning:**

- Products is a dependency for all other domains
- Reduces cascade failures
- Enables early validation of the persistence approach

---

## 8. Explicitly Rejected Approaches

The following approaches were considered and **intentionally rejected**:

| Rejected Approach | Reason |
|-------------------|--------|
| ❌ Moving validation or rules into SQL | Business logic stays in services |
| ❌ Using an ORM that owns the domain model | Avoids tight coupling |
| ❌ Big-bang migration | Too risky, prefer incremental |
| ❌ Refactoring APIs during migration | Scope creep |
| ❌ Changing existing UUID strategies | Would break contracts |
| ❌ Adding repository methods "just in case" | YAGNI principle |

> These decisions protect the project from premature abstraction and architectural drift.

---

## 9. Known Consequences

- Integration tests will be **slower** than unit tests
- Docker is **required** for full local setup
- Slightly more **boilerplate** due to repositories
- Stronger **discipline** required around DI

> These are accepted trade-offs for long-term correctness and scalability.

---

## 10. Living Document

> ⚠️ **This document is not static.**

It must be updated when:

- New migration phases begin
- Decisions are revised
- New persistence concerns arise

It exists to:

- Preserve architectural intent
- Prevent accidental regressions
- Onboard future contributors
- Justify decisions to stakeholders

---

## 11. Summary

This migration prioritizes:

| Priority | Over |
|----------|------|
| ✅ Correctness | Speed |
| ✅ Clarity | Shortcuts |
| ✅ Learning | Guessing |
| ✅ Architecture | Convenience |

**Every step is incremental, tested, and reversible.**
