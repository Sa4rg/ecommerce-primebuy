# 🗂️ Guía de Base de Datos por Entorno

## 📋 Archivos de Configuración

| Archivo | Contexto | Base de Datos | Commiteado |
|---------|----------|---------------|------------|
| `.env` | **Producción** (Railway deploy) | Railway MySQL | ✅ SÍ |
| `.env.local` | **Desarrollo local** | Docker localhost:3307 | ❌ NO |
| `.env.test` | **Tests** | Docker localhost:3307 (ecommerce_test) | ❌ NO |

---

## 🚀 Comandos por Escenario

### 💻 Desarrollo Local (Docker)

```bash
# Iniciar Docker MySQL
pnpm --filter api db:up

# Correr migraciones (localhost:3307, DB: ecommerce_dev)
pnpm --filter api db:migrate

# Iniciar servidor de desarrollo
pnpm --filter api dev
```

**Usa:** `.env.local` → `localhost:3307` → `ecommerce_dev`

---

### 🧪 Tests (Docker)

```bash
# Asegurar que Docker esté corriendo
pnpm --filter api db:up

# Correr migraciones de test (localhost:3307, DB: ecommerce_test)
pnpm --filter api db:migrate:test

# Ejecutar tests
pnpm --filter api test
pnpm --filter api test:watch
```

**Usa:** `.env.test` → `localhost:3307` → `ecommerce_test`

---

### ⚠️ Producción (Railway) - CUIDADO

```bash
# ⚠️ MIGRAR PRODUCCIÓN (Railway)
pnpm --filter api db:migrate:prod

# ⚠️ ROLLBACK PRODUCCIÓN (Railway)
pnpm --filter api db:rollback:prod

# ⚠️ CREAR ADMIN EN PRODUCCIÓN (Railway)
pnpm --filter api db:seed:admin
```

**Usa:** `.env` → Railway → `railway`

**🛑 IMPORTANTE:** Solo ejecutar cuando despliegues a producción

---

## ⚙️ Cómo Funciona la Carga de Variables

1. `knexfile.js` detecta `NODE_ENV`
2. Si existe `.env.{NODE_ENV}`, lo carga primero
3. Luego carga `.env` como fallback

**Ejemplos:**
- `NODE_ENV=test` → carga `.env.test` + `.env`
- `NODE_ENV=development` → carga `.env.local` + `.env`
- `NODE_ENV=production` → carga solo `.env`

---

## 🧹 Limpiar Base de Datos de Producción

Si necesitas **eliminar TODOS los datos** de Railway:

```sql
-- Conectar a Railway MySQL primero
mysql -h yamabiko.proxy.rlwy.net -P 51130 -u root -p

-- Usar la base de datos
USE railway;

-- Desactivar foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todo
DELETE FROM order_shipping;
DELETE FROM order_tax;
DELETE FROM order_customer;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payments;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM checkouts;
DELETE FROM email_verification_codes;
DELETE FROM password_reset_codes;
DELETE FROM refresh_tokens;
DELETE FROM users;
DELETE FROM products;

-- Reactivar foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
```

Luego vuelve a correr las migraciones y seeds:

```bash
pnpm --filter api db:migrate:prod
pnpm --filter api db:seed:admin
```

---

## ✅ Checklist Antes de Comandos

**Antes de `db:migrate`:**
- ✅ Docker corriendo
- ✅ Estoy en local → OK

**Antes de `db:migrate:prod`:**
- ⚠️ ¿Realmente quiero modificar producción?
- ⚠️ ¿Hice backup?
- ⚠️ ¿Testing local está OK?

**Antes de `test`:**
- ✅ Docker corriendo
- ✅ `db:migrate:test` ejecutado
- ✅ Base de datos `ecommerce_test` limpia
