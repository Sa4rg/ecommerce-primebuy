# PrimeBuy Backend API

Node.js + Express RESTful API for the PrimeBuy e-commerce platform. Production-ready backend with Clean Architecture, Repository Pattern, JWT authentication, transactional emails, and multi-currency support.

🌐 **Production Site**: [primebuyinc.com](https://primebuyinc.com)

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation Options](#-installation-options)
- [Environment Variables](#-environment-variables)
- [Database Commands](#-database-commands)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Testing Strategy](#-testing-strategy)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Email Notifications](#-email-notifications)
- [Multi-Currency Support](#-multi-currency-support)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Related Documentation](#-related-documentation)

---

## 🛠️ Tech Stack

### Core
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MySQL 8.0
- **Query Builder**: Knex.js
- **Testing**: Vitest + Supertest

### Architecture
- **Pattern**: Clean Architecture + Repository Pattern
- **DI**: Manual Composition Root (no frameworks)
- **Validation**: Zod schemas

### Security & Authentication
- **JWT**: JSON Web Tokens (httpOnly cookies)
- **Hashing**: argon2
- **Security**: Helmet, express-rate-limit, CORS

### Integrations
- **Email**: Resend
- **Storage**: Cloudinary
- **OAuth**: Google OAuth 2.0

### Additional Features
- **Multi-currency**: USD / VES
- **Payments**: Zelle, Zinli, Pago Móvil, Bank Transfer
- **Admin Panel**: Role-based access control

---

## 🚀 Quick Start

**Minimum setup (no Docker required):**

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cd apps/api
cp .env.example .env

# 3. Configure mandatory variables in .env
# RESEND_API_KEY=re_xxxxx (required for emails)
# JWT_SECRET=your-secret-here
# ADMIN_NOTIFICATION_EMAIL=admin@example.com

# 4. Run in-memory mode
pnpm --filter api dev
```

✅ API running at: `http://localhost:3001/health`

---

## 💻 Installation Options

### Option 1: In-Memory Mode (Fastest)

No database required. Uses in-memory repositories for development.

```bash
# Run API
pnpm --filter api dev

# Run tests
pnpm --filter api test
pnpm --filter api test:watch
```

**Characteristics:**
- ✅ No Docker needed
- ✅ Fast startup
- ✅ Perfect for unit tests
- ❌ Data lost on restart
- ❌ No persistence

---

### Option 2: MySQL with Docker (Complete)

Full setup with MySQL persistence using Docker.

```bash
# 1. Start MySQL container
pnpm --filter api db:up

# 2. Run migrations
DB_PROVIDER=mysql pnpm --filter api db:migrate

# 3. (Optional) Seed admin user
DB_PROVIDER=mysql pnpm --filter api db:seed

# 4. Start API
pnpm --filter api dev
```

**Default Configuration:**
- Database: `ecommerce_dev`
- Host: `localhost`
- Port: `3307`
- User: `ecommerce`
- Password: `ecommerce`

**Characteristics:**
- ✅ Real MySQL persistence
- ✅ Production-like environment
- ✅ Data persists between restarts
- ❌ Requires Docker running

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

### Mandatory Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_xxxxxxxxxxxxx` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secret-key-here` |
| `ADMIN_NOTIFICATION_EMAIL` | Email for admin notifications | `admin@primebuy.com` |

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PROVIDER` | `memory` | `memory` or `mysql` |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3307` | MySQL port |
| `DB_NAME` | `ecommerce_dev` | Development database |
| `DB_NAME_TEST` | `ecommerce_test` | Test database |
| `DB_USER` | `ecommerce` | MySQL user |
| `DB_PASSWORD` | `ecommerce` | MySQL password |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL (CORS) |
| `CLOUDINARY_UPLOAD_PRESET` | - | Cloudinary preset for images |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |

### Production SSL (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SSL` | `0` | Set to `1` to enable SSL |
| `DB_SSL_REJECT_UNAUTHORIZED` | `1` | `1` = verify certs, `0` = allow self-signed |

**Example (Production with SSL):**
```bash
DB_SSL=1
DB_SSL_REJECT_UNAUTHORIZED=1
```

---

## 🗄️ Database Commands

### By Environment

| Command | Development | Test | Production |
|---------|-------------|------|------------|
| **Start MySQL** | `pnpm --filter api db:up` | `pnpm --filter api db:up` | N/A (managed) |
| **Stop MySQL** | `pnpm --filter api db:down` | `pnpm --filter api db:down` | N/A |
| **Run Migrations** | `DB_PROVIDER=mysql pnpm --filter api db:migrate` | `DB_INTEGRATION=1 pnpm --filter api db:migrate` | `pnpm --filter api db:migrate` |
| **Rollback** | `DB_PROVIDER=mysql pnpm --filter api db:rollback` | `DB_INTEGRATION=1 pnpm --filter api db:rollback` | `pnpm --filter api db:rollback` |
| **Seed Data** | `DB_PROVIDER=mysql pnpm --filter api db:seed` | `DB_INTEGRATION=1 pnpm --filter api db:seed` | `pnpm --filter api db:seed` |
| **Check Status** | `DB_PROVIDER=mysql pnpm --filter api db:status` | `DB_INTEGRATION=1 pnpm --filter api db:status` | `pnpm --filter api db:status` |

### Common Workflows

#### Development Setup
```bash
# Full setup from scratch
pnpm --filter api db:up
DB_PROVIDER=mysql pnpm --filter api db:migrate
DB_PROVIDER=mysql pnpm --filter api db:seed
pnpm --filter api dev
```

#### Reset Development Database
```bash
# Drop all tables and re-migrate
DB_PROVIDER=mysql pnpm --filter api db:rollback --all
DB_PROVIDER=mysql pnpm --filter api db:migrate
DB_PROVIDER=mysql pnpm --filter api db:seed
```

#### Integration Tests
```bash
# Automatically runs migrations on test database
pnpm --filter api test:db
```

#### Production Deploy
```bash
# migrations are part of deployment, not runtime
DB_PROVIDER=mysql pnpm --filter api db:migrate
pnpm --filter api start
```

---

## 📂 Project Structure

```
apps/api/
├── src/
│   ├── app.js                      # Express app setup (no listen)
│   ├── server.js                   # Server entry point (runs app.listen)
│   │
│   ├── composition/                # 🏗️ Dependency Injection
│   │   ├── root.js                # Composition root (wires all dependencies)
│   │   └── factories/             # Repository factories (InMemory/MySQL)
│   │
│   ├── controllers/               # 🎮 HTTP Controllers (req/res only)
│   │   ├── health.controller.js
│   │   ├── products.controller.js
│   │   ├── cart.controller.js
│   │   ├── checkout.controller.js
│   │   ├── payments.controller.js
│   │   ├── orders.controller.js
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   │
│   ├── services/                  # 💼 Business Logic
│   │   ├── products.service.js
│   │   ├── cart/
│   │   │   ├── cart.service.js
│   │   │   ├── cart-adding.service.js
│   │   │   ├── cart-editing.service.js
│   │   │   └── cart-locking.service.js
│   │   ├── cart.service.js
│   │   ├── checkout/
│   │   │   ├── checkout.service.js
│   │   │   ├── checkout-creation.service.js
│   │   │   └── checkout-editing.service.js
│   │   ├── payments.service.js
│   │   ├── orders.service.js
│   │   ├── auth.service.js
│   │   └── user.service.js
│   │
│   ├── repositories/              # 💾 Data Persistence Abstraction
│   │   ├── products/
│   │   │   ├── products.memory.repository.js
│   │   │   └── products.mysql.repository.js
│   │   ├── cart/
│   │   │   ├── cart.memory.repository.js
│   │   │   └── cart.mysql.repository.js
│   │   ├── checkout/
│   │   ├── payments/
│   │   ├── orders/
│   │   └── users/
│   │
│   ├── routes/                    # 🛣️ Route Definitions
│   │   ├── index.js              # Route aggregator
│   │   ├── health.routes.js
│   │   ├── products.routes.js
│   │   ├── cart.routes.js
│   │   ├── checkout.routes.js
│   │   ├── payments.routes.js
│   │   ├── orders.routes.js
│   │   └── auth.routes.js
│   │
│   ├── middlewares/               # 🛡️ Express Middlewares
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── admin.middleware.js   # Admin role check
│   │   └── validators.js         # Zod schema validation
│   │
│   ├── schemas/                   # 📋 Zod Validation Schemas
│   │   ├── products.schema.js
│   │   ├── cart.schema.js
│   │   ├── checkout.schema.js
│   │   ├── payments.schema.js
│   │   └── auth.schema.js
│   │
│   ├── db/                        # 🗄️ Database
│   │   ├── knex.js               # Knex configuration
│   │   ├── migrations/           # Schema migrations
│   │   │   ├── 20240101_create_users.js
│   │   │   ├── 20240102_create_products.js
│   │   │   ├── 20240103_create_carts.js
│   │   │   ├── 20240104_create_checkouts.js
│   │   │   ├── 20240105_create_orders.js
│   │   │   └── ...
│   │   └── seeds/                # Initial data
│   │       └── 001_create_admin.js
│   │
│   ├── infrastructure/            # 🔌 External Services
│   │   ├── resend-email.service.js
│   │   └── cloudinary.service.js
│   │
│   ├── constants/                 # 📌 Constants & Enums
│   │   ├── checkoutStatus.js
│   │   ├── orderStatus.js
│   │   ├── paymentMethods.js
│   │   └── paymentStatus.js
│   │
│   ├── utils/                     # 🧰 Utilities
│   │   ├── response.js           # Response formatting
│   │   ├── errors.js             # Custom error classes
│   │   └── validators.js         # Validation helpers
│   │
│   ├── config/                    # ⚙️ Configuration
│   │   └── env.js                # Environment variables loader
│   │
│   └── __tests__/                # 🧪 HTTP Integration Tests
│       ├── health.test.js
│       ├── products.*.test.js
│       ├── cart.*.http.test.js
│       ├── checkout.*.http.test.js
│       ├── payments.*.http.test.js
│       └── orders.*.http.test.js
│
├── .env.example                   # Environment variables template
├── knexfile.js                    # Knex configuration
├── vitest.config.js              # Unit tests config
├── vitest.int.config.js          # Integration tests config
├── package.json
└── README.md
```

---

## 🏛️ Architecture

This project follows **Clean Architecture** with **Repository Pattern** and **Manual Dependency Injection**.

### Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   🌐 HTTP Layer                     │
│              (Routes + Controllers)                 │
│  - Receive HTTP requests                            │
│  - Validate input (Zod schemas)                     │
│  - Call services                                    │
│  - Return HTTP responses                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                💼 Business Layer                     │
│                   (Services)                        │
│  - Business rules & domain logic                    │
│  - Orchestrate repositories                         │
│  - No HTTP knowledge                                │
│  - No database knowledge                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                💾 Data Layer                        │
│                 (Repositories)                      │
│  - Abstract data persistence                        │
│  - InMemory / MySQL implementations                 │
│  - No business logic                                │
└─────────────────────────────────────────────────────┘
```

### Repository Pattern

Each repository has **two implementations**:

```javascript
// repositories/products/products.memory.repository.js
class ProductsMemoryRepository {
  constructor() {
    this.products = [];
  }
  
  async getAll() {
    return this.products;
  }
}

// repositories/products/products.mysql.repository.js
class ProductsMySQLRepository {
  constructor(knex) {
    this.knex = knex;
  }
  
  async getAll() {
    return this.knex('products').select('*');
  }
}
```

### Dependency Injection

Dependencies are wired in `composition/root.js`:

```javascript
// composition/root.js
export function createRepositories() {
  const provider = process.env.DB_PROVIDER || 'memory';
  
  if (provider === 'mysql') {
    const knex = createKnexConnection();
    return {
      productsRepo: new ProductsMySQLRepository(knex),
      cartRepo: new CartMySQLRepository(knex),
      // ...
    };
  }
  
  return {
    productsRepo: new ProductsMemoryRepository(),
    cartRepo: new CartMemoryRepository(),
    // ...
  };
}

export function createServices(repositories) {
  return {
    productsService: new ProductsService(repositories.productsRepo),
    cartService: new CartService(repositories.cartRepo),
    // ...
  };
}

export function createControllers(services) {
  return {
    productsController: new ProductsController(services.productsService),
    cartController: new CartController(services.cartService),
    // ...
  };
}
```

### Flow Example: Create Product

```
HTTP POST /api/products
       │
       ▼
[products.routes.js]
       │
       ▼
[validateRequest(productSchema)]  ← Zod validation
       │
       ▼
[auth.middleware.js]  ← JWT verification
       │
       ▼
[admin.middleware.js]  ← Role check
       │
       ▼
[products.controller.js]
   createProduct(req, res, next)
       │
       ▼
[products.service.js]
   createProduct(productData)
   - Business rules
   - Validation
       │
       ▼
[products.mysql.repository.js]
   insert(product)
   - SQL: INSERT INTO products
       │
       ▼
     MySQL
```

### Benefits

✅ **Testability**: Services tested with in-memory repos  
✅ **Flexibility**: Easy to swap MySQL for PostgreSQL  
✅ **Isolation**: Business logic independent of HTTP/DB  
✅ **Maintainability**: Clear separation of concerns  

---

## 🧪 Testing Strategy

### Test Pyramid

```
      ╱╲
     ╱  ╲
    ╱ E2E ╲         ← (Future) Playwright (Frontend)
   ╱────────╲
  ╱          ╲
 ╱ Integration ╲    ← Supertest + MySQL (HTTP tests)
╱──────────────╲
╱              ╲
╱ Unit Tests    ╲   ← Vitest + InMemory (Services)
──────────────────
```

### 1. Unit Tests (Vitest + InMemory)

**Location**: `src/services/**/*.service.test.js`

**Characteristics:**
- ✅ Fast (no I/O)
- ✅ Isolated (in-memory repos)
- ✅ Test business logic only

**Run:**
```bash
pnpm --filter api test
pnpm --filter api test:watch
pnpm --filter api test:coverage
```

**Example:**
```javascript
// src/services/cart/cart.service.test.js
describe('CartService', () => {
  it('should add product to cart', async () => {
    const cartRepo = new CartMemoryRepository();
    const productsRepo = new ProductsMemoryRepository();
    const cartService = new CartService(cartRepo, productsRepo);
    
    const result = await cartService.addItem(cartId, productId, quantity);
    expect(result.items).toHaveLength(1);
  });
});
```

---

### 2. Integration Tests (Supertest + MySQL)

**Location**: `src/__tests__/**/*.http.test.js`

**Characteristics:**
- ✅ Test full HTTP flow
- ✅ Real MySQL database (`ecommerce_test`)
- ✅ Automatic migrations before tests
- ❌ Slower than unit tests

**Run:**
```bash
# Start MySQL
pnpm --filter api db:up

# Run integration tests
pnpm --filter api test:db
```

**Example:**
```javascript
// src/__tests__/products.http.test.js
describe('GET /api/products', () => {
  it('should return product list', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

---

### Test Coverage

Current coverage: **80%+**

**Critical areas with 100% coverage:**
- Cart locking mechanism
- Checkout creation flow
- Payment processing
- Order status transitions

**Run coverage report:**
```bash
pnpm --filter api test:coverage
```

---

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/products` | List products (with pagination) |
| `GET` | `/api/products/:id` | Get product by ID |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `POST` | `/api/auth/logout` | Logout (clears cookie) |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/auth/google` | Google OAuth login |

### Cart (🔐 Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cart` | Create cart |
| `GET` | `/api/cart/me` | Get user's cart |
| `GET` | `/api/cart/:id` | Get cart by ID |
| `POST` | `/api/cart/:id/items` | Add item to cart |
| `PUT` | `/api/cart/:id/items/:itemId` | Update item quantity |
| `DELETE` | `/api/cart/:id/items/:itemId` | Remove item from cart |
| `PATCH` | `/api/cart/:id/metadata` | Update cart metadata |

### Checkout (🔐 Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/checkout` | Create checkout from cart |
| `GET` | `/api/checkout/:id` | Get checkout by ID |
| `PUT` | `/api/checkout/:id/customer` | Update customer info |
| `PUT` | `/api/checkout/:id/shipping` | Update shipping address |
| `POST` | `/api/checkout/:id/cancel` | Cancel checkout |

### Payments (🔐 Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments` | Submit payment proof |
| `PUT` | `/api/payments/:id/cancel` | Cancel payment |

### Orders (🔐 Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | List user's orders |
| `GET` | `/api/orders/:id` | Get order by ID |

### Admin Endpoints (🔐 Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/payments?status=pending` | List all payments (filter by status) |
| `PUT` | `/api/payments/:id/approve` | Approve payment |
| `PUT` | `/api/payments/:id/reject` | Reject payment |
| `PUT` | `/api/orders/:id/shipping` | Update order shipping status |

---

## 🔒 Security Features

### 1. JWT Authentication
- **httpOnly cookies**: Tokens not accessible via JavaScript
- **Secure flag**: HTTPS only in production
- **Expiration**: 7 days
- **Refresh**: No refresh tokens (session-based)

### 2. Password Hashing
- **Algorithm**: argon2 (resistant to GPU attacks)
- **No bcrypt**: argon2 is more secure

### 3. Rate Limiting
```javascript
// 100 requests per 15 minutes per IP
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
```

### 4. CORS
- Whitelist: Only `FRONTEND_URL` allowed
- Credentials: `true` (allows cookies)

### 5. Helmet
- XSS protection
- MIME sniffing prevention
- Clickjacking protection

### 6. Input Validation
- **Zod schemas**: All inputs validated
- **SQL Injection**: Prevented by Knex parameterization
- **XSS**: Prevented by input sanitization

### 7. Role-Based Access Control (RBAC)
```javascript
// middlewares/admin.middleware.js
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## 📧 Email Notifications

Uses **Resend** for transactional emails.

### Email Events

| Event | Recipient | Template |
|-------|-----------|----------|
| **Order Created** | Customer | Order confirmation with details |
| **Order Created** | Admin | New order notification |
| **Payment Approved** | Customer | Payment confirmation |
| **Payment Rejected** | Customer | Payment rejection + instructions |
| **Order Shipped** | Customer | Tracking information |
| **Order Delivered** | Customer | Delivery confirmation |

### Configuration

```bash
# .env
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_NOTIFICATION_EMAIL=admin@primebuy.com
```

### Email Service

```javascript
// infrastructure/resend-email.service.js
class EmailService {
  async sendOrderConfirmation(email, order) { }
  async sendPaymentApproved(email, payment) { }
  async sendPaymentRejected(email, payment, reason) { }
  async sendOrderShipped(email, order, tracking) { }
}
```

---

## 💱 Multi-Currency Support

### Supported Currencies
- **USD** (US Dollar)
- **VES** (Venezuelan Bolívar)

### Exchange Rate
- Stored in `products` table: `price_usd`, `price_ves`
- Updated manually via admin panel
- Prices shown in both currencies

### Frontend Integration
- User selects currency in UI
- All prices converted automatically
- Cart stores currency preference

---

## 🚀 Deployment

### Production Infrastructure

| Component | Service | Details |
|-----------|---------|---------|
| **Backend** | Render | Web Service (Node.js) |
| **Database** | Railway | MySQL 8.0 |
| **Frontend** | Vercel | Static hosting |

### Deployment Steps (Backend)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Render Auto-Deploy**
   - Render detects push
   - Runs: `pnpm install`
   - Runs: `pnpm --filter api db:migrate`
   - Starts: `pnpm --filter api start`

3. **Verify Deployment**
```bash
curl https://api.primebuyinc.com/health
```

### Environment Variables (Production)

Configure in Render dashboard:

```bash
NODE_ENV=production
DB_PROVIDER=mysql
DB_HOST=railway-host.railway.app
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=xxxxx
DB_SSL=1
DB_SSL_REJECT_UNAUTHORIZED=1

JWT_SECRET=production-secret-very-long-and-random
RESEND_API_KEY=re_xxxxx
ADMIN_NOTIFICATION_EMAIL=admin@primebuy.com
FRONTEND_URL=https://primebuyinc.com

CLOUDINARY_UPLOAD_PRESET=primebuy
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Database Migrations

**Important**: Migrations run automatically during deployment on Render.

**Manual migration (if needed):**
```bash
# SSH into Render instance
pnpm --filter api db:migrate
```

---

## 🛠️ Troubleshooting

### Problem: `ECONNREFUSED` when running tests

**Cause**: MySQL container not running

**Solution**:
```bash
pnpm --filter api db:up
```

---

### Problem: `ER_ACCESS_DENIED_ERROR`

**Cause**: Wrong MySQL credentials

**Solution**: Check `.env` file
```bash
DB_USER=ecommerce
DB_PASSWORD=ecommerce
```

---

### Problem: `Table doesn't exist`

**Cause**: Migrations not run

**Solution**:
```bash
DB_PROVIDER=mysql pnpm --filter api db:migrate
```

---

### Problem: API doesn't start (port in use)

**Cause**: Port 3001 already in use

**Solution 1**: Change port in `.env`
```bash
PORT=3002
```

**Solution 2**: Kill process using port
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

---

### Problem: JWT token not working

**Cause**: `JWT_SECRET` not set or changed

**Solution**: Ensure `.env` has consistent secret
```bash
JWT_SECRET=your-secret-here
```

Login again to get new token.

---

### Problem: Emails not sending

**Cause**: `RESEND_API_KEY` not set or invalid

**Solution**:
1. Get API key from [Resend Dashboard](https://resend.com/api-keys)
2. Add to `.env`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

---

## 📚 Related Documentation

### Architecture & Rules
- [AGENTS.md](../../AGENTS.md) - Architecture rules + AI agent guidelines
- [apps/docs/database-migration.md](../docs/database-migration.md) - Database migration architectural decisions

### Domain Documentation
- [apps/docs/purchase-flow.md](../docs/purchase-flow.md) - Purchase flow (Cart → Checkout → Payment → Order)

### Frontend
- [apps/web/README.md](../web/README.md) - Frontend documentation

### Root
- [Root README.md](../../README.md) - Project overview + quick start

---

## 📈 Project Stats

- **Tests**: 341 (80%+ coverage)
- **Endpoints**: 40+
- **Database Tables**: 15+
- **Test Files**: 30+
- **Lines of Code**: 10,000+

---

## 🤝 Contributing

This project follows **TDD** (Test-Driven Development).

### Rules
1. Tests first, implementation second
2. No business logic without unit tests
3. Follow Clean Architecture
4. Respect [AGENTS.md](../../AGENTS.md) rules

---

## 📄 License

Private project - © 2024 PrimeBuy
