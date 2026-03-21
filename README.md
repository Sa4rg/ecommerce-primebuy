# 🛒 PrimeBuy E-Commerce Platform

**PrimeBuy** es una plataforma de e-commerce full-stack moderna, construida para uso real en producción. Actualmente operando en [primebuyinc.com](https://primebuyinc.com), maneja catálogo de productos, carrito de compras, checkout, procesamiento de pagos y gestión administrativa.

Este proyecto representa un sistema e-commerce profesional con arquitectura escalable, siguiendo principios de Clean Architecture y desarrollo orientado a pruebas (TDD).

---

## 📋 Descripción General

PrimeBuy es un monorepo que implementa un sistema completo de comercio electrónico para el mercado venezolano, con soporte multi-moneda (USD/VES) y métodos de pago locales.

**Características principales:**
- Sistema de compras completo: Catálogo → Carrito → Checkout → Pago → Orden
- Autenticación segura con JWT + httpOnly cookies
- Panel administrativo para gestión de pagos y órdenes
- Notificaciones transaccionales por email
- Multi-moneda con integración BCV (USD/VES)
- Sistema de pagos manuales (Zelle, Zinli, Pago Móvil, Transferencia)
- Arquitectura limpia con patrón Repository y Dependency Injection

**Estado actual:**
- ✅ En producción: [primebuyinc.com](https://primebuyinc.com)
- ✅ Proyecto real con cliente real
- ✅ Cobertura de tests: 80%+ (341 tests)

---

## 🛠️ Stack Tecnológico

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express
- **Base de Datos**: MySQL 8.0
- **Query Builder**: Knex.js
- **Autenticación**: JWT + argon2 (password hashing)
- **Testing**: Vitest + Supertest
- **Emails**: Resend
- **OAuth**: Google OAuth 2.0
- **Almacenamiento**: Cloudinary (imágenes)
- **Seguridad**: Helmet, Rate Limiting, CORS
- **Patrón de Arquitectura**: Repository Pattern + DI

### Frontend (React + Vite)
- **UI Library**: React 19
- **Routing**: React Router DOM v7
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Context API (Auth, Cart)
- **Testing**: Vitest + Testing Library

### Infraestructura
- **Backend**: Render
- **Base de Datos**: Railway (MySQL)
- **Frontend**: Vercel
- **Emails**: Resend
- **Imágenes**: Cloudinary
- **Desarrollo Local**: Docker Compose (MySQL)

### Herramientas de Desarrollo
- **Package Manager**: pnpm (workspaces)
- **Linting**: ESLint
- **Version Control**: Git + GitHub
- **CI/CD**: Integración continua con tests automáticos

---

## 📦 Instalación y Ejecución

### Prerrequisitos

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **pnpm** (instalar: `npm install -g pnpm`)
- **Docker Desktop** (opcional, solo para MySQL local)

### Quick Start (Desarrollo Rápido)

El proyecto puede correr completamente **sin Docker** usando repositorios en memoria:

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlitosbenju/ecommerce-backend-carlitos.git
cd ecommerce-backend-carlitos

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Editar apps/api/.env y configurar:
# - JWT_SECRET (cualquier string largo)
# - RESEND_API_KEY (obtener en resend.com)
# Dejar DB_PROVIDER sin configurar para usar in-memory

# 4. Iniciar ambos servicios
pnpm dev
```

**¡Listo!** 
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend: http://localhost:3000

### Setup Completo (Con MySQL)

Para desarrollo con persistencia real:

```bash
# 1-2. Igual que Quick Start (clonar + instalar)

# 3. Iniciar MySQL en Docker
pnpm db:up

# 4. Configurar apps/api/.env:
# DB_PROVIDER=mysql
# DB_HOST=localhost
# DB_PORT=3307
# DB_USER=ecommerce
# DB_PASSWORD=ecommerce
# DB_NAME=ecommerce_dev

# 5. Ejecutar migraciones
pnpm db:migrate

# 6. (Opcional) Crear usuario admin
pnpm --filter api db:seed:admin

# 7. Iniciar servicios
pnpm dev
```

### Comandos Disponibles

#### Workspace completo (raíz)
```bash
pnpm dev              # Iniciar backend + frontend en paralelo
pnpm test             # Ejecutar todos los tests
pnpm db:up            # Iniciar Docker MySQL
pnpm db:down          # Detener Docker MySQL
pnpm db:migrate       # Ejecutar migraciones (development)
pnpm db:rollback      # Revertir última migración
pnpm db:status        # Ver estado de migraciones
```

#### Solo Backend
```bash
pnpm dev:api          # Iniciar solo API (puerto 3000)
pnpm --filter api test             # Tests unitarios (rápidos, sin DB)
pnpm --filter api test:watch       # Tests en modo watch
pnpm --filter api test:db          # Tests de integración (con MySQL)
```

#### Solo Frontend
```bash
pnpm dev:web          # Iniciar solo frontend (puerto 5173)
pnpm --filter web test             # Tests del frontend
pnpm --filter web build            # Build de producción
```

---

## 📂 Estructura del Proyecto

```
ecommerce-backend-carlitos/
├── apps/
│   ├── api/                    # Backend (Node.js + Express)
│   │   ├── src/
│   │   │   ├── controllers/   # Manejadores HTTP
│   │   │   ├── services/      # Lógica de negocio
│   │   │   ├── repositories/  # Capa de persistencia
│   │   │   ├── routes/        # Definición de rutas
│   │   │   ├── middlewares/   # Middlewares Express
│   │   │   ├── composition/   # Inyección de dependencias
│   │   │   ├── db/            # Migraciones y seeds
│   │   │   ├── config/        # Configuración (env vars)
│   │   │   ├── utils/         # Utilidades compartidas
│   │   │   └── __tests__/     # Tests de integración HTTP
│   │   ├── .env.example       # Variables de entorno
│   │   └── README.md          # Docs específicas del backend
│   │
│   ├── web/                    # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── features/      # Módulos por funcionalidad
│   │   │   │   ├── auth/          # Login, registro, JWT
│   │   │   │   ├── product-catalog/
│   │   │   │   ├── shopping-cart/
│   │   │   │   ├── checkout/
│   │   │   │   ├── payment/
│   │   │   │   ├── orders/
│   │   │   │   └── admin/         # Panel administrativo
│   │   │   ├── shared/        # Componentes reutilizables
│   │   │   ├── context/       # Estado global (Auth, Cart)
│   │   │   └── infrastructure/ # API client, config
│   │   ├── .env.example
│   │   └── README.md          # Docs específicas del frontend
│   │
│   └── docs/                   # Documentación técnica
│       ├── purchase-flow.md     # Contrato de dominio del flujo de compra
│       └── database-migration.md # Decisiones arquitectónicas DB
│
├── docker/                     # Configuración Docker
│   └── mysql/init/            # Scripts de inicialización
├── docker-compose.yml          # Docker Compose para MySQL
├── pnpm-workspace.yaml         # Configuración del monorepo
├── package.json                # Scripts globales
├── AGENTS.md                   # Reglas arquitectónicas y de AI
└── README.md                   # Este archivo
```

**Patrón de Organización:**
- **Backend**: Arquitectura en capas (routes → controllers → services → repositories)
- **Frontend**: Feature-driven architecture (organización por funcionalidad)
- **Monorepo**: pnpm workspaces para gestión unificada de dependencias

---

## ✨ Funcionalidades Principales

### Para Clientes
- ✅ **Catálogo de productos**: Exploración de productos disponibles
- ✅ **Búsqueda y filtros**: Filtrado por categorías
- ✅ **Carrito de compras**: Agregar, actualizar y eliminar items
- ✅ **Checkout multi-step**: Proceso de pago guiado
  - Información del cliente
  - Dirección de envío
  - Selección de método de pago
- ✅ **Métodos de pago**: Zelle, Zinli, Pago Móvil, Transferencia Bancaria
- ✅ **Registro de comprobante**: Subida de proof de pago
- ✅ **Tracking de órdenes**: Seguimiento del estado de compras
- ✅ **Autenticación**: Registro, login, Google OAuth
- ✅ **Notificaciones email**: Confirmaciones de pago y actualizaciones de orden

### Para Administradores
- ✅ **Panel de revisión de pagos**: Confirmar/rechazar pagos manualmente
- ✅ **Gestión de órdenes**: Cambio de estados (confirmado → procesando → enviado → completado)
- ✅ **Notificaciones automáticas**: Email cuando un cliente registra un pago
- ✅ **Dashboard administrativo**: Visión general del sistema

### Características Técnicas
- ✅ **Multi-moneda**: Soporte USD/VES con tasa BCV
- ✅ **Seguridad robusta**: 
  - httpOnly cookies (protección XSS)
  - Rate limiting (anti brute-force)
  - CSRF protection
  - Helmet (security headers)
- ✅ **Testing exhaustivo**: 341 tests (80%+ coverage)
- ✅ **Emails transaccionales**: Notificaciones automáticas
- ✅ **Gestión de inventario**: Control de stock en tiempo real

---

## 🧪 Testing

El proyecto sigue **TDD estricto** con cobertura de 80%+:

```bash
# Backend - Tests unitarios (rápidos, sin DB)
pnpm --filter api test

# Backend - Tests de integración (con MySQL)
pnpm --filter api test:db

# Frontend - Tests de componentes
pnpm --filter web test

# Coverage report
pnpm --filter api test:coverage
```

**Resultados actuales:**
- ✅ 47/47 archivos de test (backend)
- ✅ 341/341 tests pasando
- ✅ ~80% coverage en lógica crítica

**Estrategia de testing:**
- **Unit tests**: Servicios con stubs (Vitest)
- **Integration tests**: HTTP endpoints (Supertest)
- **Frontend tests**: Componentes (Testing Library)

---

## 🔐 Configuración de Variables de Entorno

### Backend (`apps/api/.env`)

**Mínimo requerido para desarrollo:**
```bash
# JWT (usar cualquier string largo)
JWT_SECRET=tu_secret_super_secreto_aqui
REFRESH_TOKEN_PEPPER=otro_secret_muy_largo_para_refresh_tokens

# Email (obtener gratis en resend.com)
RESEND_API_KEY=re_tu_api_key_de_resend

# Base de datos (opcional para in-memory)
# DB_PROVIDER=mysql
# DB_HOST=localhost
# DB_PORT=3307
# DB_USER=ecommerce
# DB_PASSWORD=ecommerce
# DB_NAME=ecommerce_dev
```

**Variables de producción adicionales:**
```bash
NODE_ENV=production
FRONTEND_ORIGIN=https://tu-dominio.com
DB_SSL=1
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Ver [apps/api/.env.example](apps/api/.env.example) para la lista completa.

### Frontend (`apps/web/.env`)

```bash
# URL del backend
VITE_API_BASE_URL=http://localhost:3000

# WhatsApp de soporte
VITE_WHATSAPP_SUPPORT=584126216402
```

---

## 🌐 Deploy en Producción

**Infraestructura actual:**
- **Backend API**: Render ([render.com](https://render.com))
- **Base de Datos**: Railway MySQL ([railway.app](https://railway.app))
- **Frontend**: Vercel ([vercel.com](https://vercel.com))

**Deploy del Backend (Render):**
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Build command: `pnpm install --prod`
4. Start command: `pnpm --filter api start`
5. Ejecutar migraciones manualmente:
   ```bash
   pnpm --filter api db:migrate:prod
   pnpm --filter api db:seed:admin
   ```

**Deploy del Frontend (Vercel):**
1. Conectar repositorio de GitHub
2. Root directory: `apps/web`
3. Framework preset: Vite
4. Build command: `pnpm build`
5. Output directory: `dist`

---

## 📚 Documentación Adicional

- **[AGENTS.md](AGENTS.md)**: Reglas arquitectónicas y guías para desarrollo con IA
- **[apps/api/README.md](apps/api/README.md)**: Documentación detallada del backend
- **[apps/web/README.md](apps/web/README.md)**: Documentación detallada del frontend
- **[apps/docs/purchase-flow.md](apps/docs/purchase-flow.md)**: Contrato de dominio del flujo de compra
- **[apps/docs/database-migration.md](apps/docs/database-migration.md)**: Decisiones arquitectónicas de migración a MySQL

---

## 🤝 Guías de Contribución

Todo desarrollo debe:
1. ✅ Seguir las reglas definidas en [AGENTS.md](AGENTS.md)
2. ✅ Escribir tests ANTES de la implementación (TDD)
3. ✅ Mantener consistencia arquitectónica
4. ✅ No romper flujos existentes de compra/checkout
5. ✅ Mantener estándares de producción en código y documentación

**Arquitectura Backend:**
- Routes → Controllers → Services → Repositories
- Servicios contienen la lógica de negocio
- Repositorios abstraen la persistencia
- Inyección de dependencias en `composition/root.js`

**Arquitectura Frontend:**
- Feature-driven (organización por funcionalidad)
- Context API para estado global (Auth, Cart)
- Componentes reutilizables en `shared/`

---

## 📄 Licencia

Proyecto comercial privado.  
Todos los derechos reservados. Prohibida la copia o distribución no autorizada.

---

## 👤 Autor

**Carlos Benjumea**  
Proyecto desarrollado como trabajo de grado / portfolio profesional / proyecto real para cliente.

**Demo en vivo:** [primebuyinc.com](https://primebuyinc.com)

---

## 🚀 Estado del Proyecto

**Versión actual:** 1.0.0 (En producción)  
**Última actualización:** Marzo 2026

**Próximas funcionalidades planificadas:**
- [ ] Optimización de performance del catálogo
- [ ] Skeleton loaders en carga de datos
- [ ] Panel admin completo de gestión de productos
- [ ] Sistema de reviews y rating de productos
- [ ] Dashboard analítico para administradores

---

**¿Problemas durante la instalación?** Revisa la documentación específica de [backend](apps/api/README.md) o [frontend](apps/web/README.md) para troubleshooting detallado.
