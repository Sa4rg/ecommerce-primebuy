# 🤖 GitHub Actions - Documentación del Workflow

## 📋 Resumen

Este workflow ejecuta **automáticamente** todos los tests de tu proyecto cada vez que:
- Haces `push` a la rama `main`
- Abres un Pull Request hacia `main`

---

## 🎯 ¿Qué tests ejecuta?

El workflow está dividido en **4 jobs paralelos** que corren al mismo tiempo:

### 1️⃣ Backend Unit Tests
- **Script:** `pnpm --filter api test`
- **Duración:** ~1-2 minutos
- **MySQL:** ❌ No
- **Tests:** 370 tests unitarios
- **Propósito:** Verificar lógica de negocio aislada

### 2️⃣ Backend Integration Tests  
- **Script:** `pnpm --filter api test:db`
- **Duración:** ~2-4 minutos
- **MySQL:** ✅ Sí (contenedor automático)
- **Tests:** ~221 tests de integración HTTP
- **Propósito:** Verificar endpoints completos con base de datos

### 3️⃣ Frontend Tests
- **Script:** `pnpm --filter web test:run`
- **Duración:** ~30-60 segundos
- **MySQL:** ❌ No
- **Tests:** ~50+ tests de React
- **Propósito:** Verificar componentes y lógica del frontend

### 4️⃣ Frontend Build
- **Script:** `pnpm --filter web build`
- **Duración:** ~1-2 minutos
- **MySQL:** ❌ No
- **Tests:** No es test, es compilación
- **Propósito:** Verificar que el código compila sin errores

---

## ⚙️ Flujo de Ejecución

```mermaid
graph TD
    A[git push origin main] --> B[GitHub detecta push]
    B --> C1[Job 1: Backend Unit Tests]
    B --> C2[Job 2: Backend Integration Tests]
    B --> C3[Job 3: Frontend Tests]
    B --> C4[Job 4: Frontend Build]
    
    C2 --> D[Levantar MySQL en contenedor]
    D --> E[Esperar MySQL ready]
    E --> F[Ejecutar tests con DB]
    
    C1 --> G{¿Todos los jobs OK?}
    C2 --> G
    C3 --> G
    C4 --> G
    
    G -->|✅ Sí| H[Commit marcado como ✅]
    G -->|❌ No| I[Commit marcado como ❌]
    I --> J[Email de notificación]
```

**Tiempo total:** ~3-5 minutos (los jobs corren en paralelo)

---

## 🔍 ¿Cómo ver los resultados?

### En GitHub:

1. Ve a tu repositorio en GitHub
2. Click en pestaña **"Actions"**
3. Verás una lista de ejecuciones (runs)
4. Click en cualquier run para ver detalles
5. Cada job muestra:
   - ✅ Verde = Pasó
   - ❌ Rojo = Falló
   - 🟡 Amarillo = Ejecutando

### En tu commit:

- Commit con ✅ = Todos los tests pasaron
- Commit con ❌ = Algún test falló
- Commit con 🟡 = Tests ejecutándose

---

## 🐛 ¿Qué pasa si un test falla?

### Ejemplo: Backend integration test falla

```
❌ Job "Backend Integration Tests" failed

Error: expected 200 to be 201
  at tests/products.http.test.js:45
```

**Acciones:**

1. GitHub te envía **email** con el error
2. El commit queda marcado con ❌
3. Si es un PR, GitHub sugiere **no mergear**
4. Puedes hacer click en el error para ver logs completos
5. Arreglas el bug localmente
6. Haces `git push` de nuevo
7. GitHub re-ejecuta todo automáticamente

---

## 🚀 ¿Cómo MySQL funciona en GitHub Actions?

### Tu Docker local:
```bash
docker compose up -d mysql
# MySQL corriendo en localhost:3307
```

### GitHub Actions:
```yaml
services:
  mysql:
    image: mysql:8.0
    # MySQL corriendo en 127.0.0.1:3306
```

**Es lo mismo**, solo que:
- GitHub levanta el contenedor automáticamente
- Corre en la nube (no en tu PC)
- Se destruye al terminar los tests
- Cada ejecución tiene MySQL **limpio** (no datos viejos)

---

## ⚡ Optimizaciones del Workflow

### 1. Caché de dependencias

```yaml
- name: Setup pnpm cache
  uses: actions/cache@v4
```

**¿Qué hace?**
- La primera vez: Descarga todas las dependencias (~2-3 min)
- Las siguientes veces: Usa caché (~10-20 seg)

**Resultado:** Workflow 10x más rápido

---

### 2. Jobs paralelos

Los 4 jobs corren **al mismo tiempo**, no secuencialmente:

```
Sin paralelismo:  Job1 → Job2 → Job3 → Job4 = 10 minutos
Con paralelismo:  Job1 ↓
                  Job2 ↓ (al mismo tiempo) = 4 minutos
                  Job3 ↓
                  Job4 ↓
```

---

### 3. Healthcheck de MySQL

```yaml
options: >-
  --health-cmd="mysqladmin ping"
  --health-interval=10s
```

**¿Qué hace?**
- GitHub verifica cada 10s si MySQL está listo
- Los tests **esperan** hasta que MySQL responde
- Evita errores de "connection refused"

---

## 🔐 Variables de Entorno Sensibles

### ¿Dónde se configuran?

**GitHub → Settings → Secrets and variables → Actions → Secrets**

Ejemplo:
```
AWS_ACCESS_KEY_ID = AKIAYBTRZLC56JTYK36Z
AWS_SECRET_ACCESS_KEY = Ewq8hw...
```

### ¿Cómo usarlas en el workflow?

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**Nota:** Por ahora no usamos secrets porque los tests no necesitan AWS/Twilio.

---

## 📊 Estadísticas de Tests

| Categoría | Cantidad | Duración | MySQL |
|-----------|----------|----------|-------|
| Backend Unit | 370 | 1-2min | ❌ |
| Backend Integration | ~221 | 2-4min | ✅ |
| Frontend | ~50 | 30-60s | ❌ |
| **TOTAL** | **~641** | **4-6min** | - |

---

## 🎯 Próximos Pasos (Opcional)

### 1. Protección de rama `main`

**GitHub → Settings → Branches → Add rule**

```
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
  ☑️ backend-unit-tests
  ☑️ backend-integration-tests
  ☑️ frontend-tests
  ☑️ frontend-build
```

**Resultado:** Nadie puede hacer push directo a `main` si los tests fallan.

---

### 2. Deploy automático (CD)

Agregar un 5to job que deployee a Render/Vercel **solo si todos los tests pasan**:

```yaml
deploy:
  needs: [backend-unit-tests, backend-integration-tests, frontend-tests, frontend-build]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Render
      # ... código de deploy
```

---

### 3. Badge de estado en README

Agregar al `README.md`:

```markdown
![CI/CD Pipeline](https://github.com/Sa4rq/ecommerce-primebuy/actions/workflows/backend-tests.yml/badge.svg)
```

Muestra: ✅ **Passing** o ❌ **Failing**

---

## 🛠️ Comandos Útiles

### Re-ejecutar workflow fallido
1. GitHub → Actions → Click en el run fallido
2. Botón **"Re-run all jobs"**

### Ver logs en tiempo real
1. GitHub → Actions → Click en run 🟡
2. Click en el job específico
3. Logs aparecen en tiempo real

### Cancelar ejecución
1. GitHub → Actions → Click en run 🟡
2. Botón **"Cancel workflow"**

---

## ❓ FAQ

**P: ¿Cuánto cuesta GitHub Actions?**  
R: 2000 minutos/mes gratis en repos públicos. Tu workflow usa ~4-5 min/push, así que puedes hacer ~400 pushes/mes gratis.

**P: ¿Los tests consumen mi quota de Render/Vercel?**  
R: No, los tests corren en servidores de GitHub, no en Render ni Vercel.

**P: ¿Puedo ejecutar el workflow manualmente?**  
R: Sí, agrega esto al trigger:
```yaml
on:
  workflow_dispatch:  # Permite ejecución manual
```

**P: ¿Qué pasa si un job falla pero otros pasan?**  
R: El commit queda marcado como ❌ (cualquier job fallido marca todo como fallido).

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
