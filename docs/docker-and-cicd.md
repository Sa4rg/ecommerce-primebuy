# 🐳 Docker & CI/CD - Guía Completa

## 📚 Índice
1. [Conceptos de Docker](#conceptos-de-docker)
2. [Tu Configuración Actual](#tu-configuración-actual)
3. [GitHub Actions (CI/CD)](#github-actions-cicd)
4. [Comandos Útiles](#comandos-útiles)
5. [Troubleshooting](#troubleshooting)

---

## 🐳 Conceptos de Docker

### ¿Qué problema resuelve Docker?

**Problema clásico:**
```
Desarrollador: "En mi máquina funciona perfectamente"
Servidor: *Error 500*
Desarrollador: "Pero... ¿cómo? Si en local funciona..."
```

**Causas:**
- Versiones diferentes de Node.js
- Dependencias faltantes
- Variables de entorno distintas
- Sistema operativo diferente (Windows vs Linux)

**Solución con Docker:**
```
"Si funciona en tu contenedor, funcionará en producción"
```

---

### 🖼️ Imagen vs 📦 Contenedor

| Concepto | Analogía | Descripción |
|----------|----------|-------------|
| **Imagen** | 🍕 Receta de pizza | Plano/Receta de tu aplicación. Inmutable. |
| **Contenedor** | 🍕 Pizza horneada | Instancia ejecutándose. Efímero. |

**Ejemplo práctico:**
```bash
# Imagen (receta)
docker build -t my-pizza-recipe .

# Contenedor (pizza horneada)
docker run my-pizza-recipe
docker run my-pizza-recipe  # Otra pizza con la misma receta
docker run my-pizza-recipe  # Y otra más
```

---

## 🔧 Tu Configuración Actual

### 📁 Estructura:

```
ecommerce-backend-carlitos/
├── docker-compose.yml              ← Orquestador principal
├── apps/
│   └── api/
│       └── Dockerfile              ← Receta del backend
└── docker/
    └── mysql/
        └── init/
            └── 01-init.sql         ← Script inicial de MySQL
```

---

### 📝 Archivo por Archivo

#### 1️⃣ `docker-compose.yml` - El Director de Orquesta

```yaml
services:
  mysql:  # Servicio 1: Base de datos
```

**¿Qué orquesta?**
- Levanta MySQL en un contenedor
- Lo configura con usuario/contraseña
- Mapea puerto 3306 → 3307
- Persiste datos en un volumen
- Ejecuta scripts de inicialización
- Verifica salud cada 10 segundos

**Comandos principales:**
```bash
# Levantar todos los servicios
docker compose up

# Levantar en background
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Detener todo
docker compose down

# Detener y borrar volúmenes (⚠️ BORRA DATOS)
docker compose down -v
```

---

#### 2️⃣ `apps/api/Dockerfile` - Receta del Backend

```dockerfile
FROM node:22-alpine        # Base: Node.js 22
WORKDIR /app               # Carpeta de trabajo
RUN corepack enable        # Habilitar pnpm
COPY package.json ...      # Copiar archivos de dependencias
RUN pnpm install ...       # Instalar dependencias
COPY apps/api ...          # Copiar código fuente
ENV NODE_ENV=production    # Configurar entorno
EXPOSE 3000                # Puerto expuesto
CMD ["pnpm", "start"]      # Comando de inicio
```

**Optimización por capas:**
```
Capa 1: Node.js base           (raramente cambia)
Capa 2: Dependencias           (cambia poco)
Capa 3: Código fuente          (cambia mucho)
```

Docker **cachea** las capas. Si solo cambias código, no reinstala dependencias.

**Comandos para construir y ejecutar:**
```bash
# Construir la imagen
docker build -t ecommerce-backend -f apps/api/Dockerfile .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3307 \
  ecommerce-backend

# Ver logs del contenedor
docker logs <container-id>

# Entrar al contenedor (debugging)
docker exec -it <container-id> sh
```

---

#### 3️⃣ `docker/mysql/init/01-init.sql` - Inicialización

```sql
CREATE DATABASE IF NOT EXISTS ecommerce_dev;
CREATE DATABASE IF NOT EXISTS ecommerce_test;
GRANT ALL PRIVILEGES ON ecommerce_dev.* TO 'ecommerce'@'%';
GRANT ALL PRIVILEGES ON ecommerce_test.* TO 'ecommerce'@'%';
```

**¿Cuándo se ejecuta?**
- Solo la **primera vez** que se crea el volumen de MySQL
- Si ya existe el volumen, NO se ejecuta de nuevo

**Para re-ejecutar:**
```bash
# Borrar volumen y recrear
docker compose down -v
docker compose up
```

---

## 🤖 GitHub Actions (CI/CD)

### ¿Qué es CI/CD?

**CI (Continuous Integration):**
- Cada vez que haces `push`, se ejecutan **tests automáticamente**
- Si algo falla, te notifica **antes** de mergear
- "Integración continua" = asegurar que el código nuevo no rompa nada

**CD (Continuous Deployment):**
- Si los tests pasan, **deploy automático** a producción
- Sin intervención manual
- "Despliegue continuo" = llevar código a producción rápido y seguro

---

### 🚀 Tu Primer Workflow: `.github/workflows/backend-tests.yml`

**¿Qué hace este archivo?**

1. **Trigger**: Se ejecuta cuando haces `push` o `pull request` a `main`
2. **Setup**: Levanta una máquina virtual Ubuntu con MySQL
3. **Tests**: Ejecuta todos los tests del backend
4. **Resultado**: ✅ Pasa o ❌ Falla

**Flujo visual:**

```
git push origin main
    ↓
GitHub detecta el push
    ↓
GitHub Actions inicia workflow
    ↓
Levanta Ubuntu VM
    ↓
Descarga MySQL 8.0
    ↓
Instala Node.js 22 + pnpm
    ↓
Instala dependencias (con caché)
    ↓
Espera a que MySQL esté listo
    ↓
Ejecuta: pnpm test
    ↓
✅ Tests pasan → Marca commit como ✅
❌ Tests fallan → Notifica por email
```

---

### 🎯 Activar GitHub Actions

**Pasos:**

1. **Commit y Push:**
   ```bash
   git add .github/workflows/backend-tests.yml
   git commit -m "ci: add GitHub Actions workflow for backend tests"
   git push origin main
   ```

2. **Verificar en GitHub:**
   - Ve a tu repositorio en GitHub
   - Click en pestaña **"Actions"**
   - Verás el workflow ejecutándose 🟡
   - Espera 2-5 minutos
   - ✅ Verde = éxito | ❌ Rojo = falló

3. **Ver detalles:**
   - Click en el workflow
   - Verás cada "step" (paso)
   - Logs completos de cada comando
   - Si falla, sabrás exactamente en qué línea

---

### 📊 Badge de Estado (Opcional pero Cool)

Agregar al `README.md`:

```markdown
![Backend Tests](https://github.com/tu-usuario/ecommerce-backend-carlitos/actions/workflows/backend-tests.yml/badge.svg)
```

Esto muestra:
- ✅ Passing (verde) si tests pasan
- ❌ Failing (rojo) si tests fallan

---

## 🛠️ Comandos Útiles

### Docker Compose

```bash
# Levantar servicios
docker compose up                  # Con logs en terminal
docker compose up -d               # En background (detached)

# Ver logs
docker compose logs                # Todos los servicios
docker compose logs mysql          # Solo MySQL
docker compose logs -f             # Follow (tiempo real)

# Detener servicios
docker compose stop                # Detiene pero no borra
docker compose down                # Detiene y borra contenedores
docker compose down -v             # + borra volúmenes (⚠️ BORRA DATOS)

# Reiniciar servicios
docker compose restart
docker compose restart mysql       # Solo MySQL

# Ver estado
docker compose ps                  # Servicios corriendo
docker compose top                 # Procesos en cada contenedor
```

---

### Docker (General)

```bash
# Imágenes
docker images                      # Ver imágenes descargadas
docker rmi <image-id>              # Borrar imagen
docker image prune                 # Limpiar imágenes no usadas

# Contenedores
docker ps                          # Contenedores corriendo
docker ps -a                       # Todos (incluso detenidos)
docker rm <container-id>           # Borrar contenedor
docker container prune             # Limpiar contenedores detenidos

# Logs y debugging
docker logs <container-id>         # Ver logs
docker logs -f <container-id>      # Follow logs
docker exec -it <container-id> sh  # Entrar al contenedor
docker inspect <container-id>      # Ver configuración detallada

# Volúmenes
docker volume ls                   # Ver volúmenes
docker volume rm <volume-name>     # Borrar volumen
docker volume prune                # Limpiar volúmenes no usados

# Limpieza general
docker system prune                # Limpia todo lo no usado
docker system prune -a --volumes   # Limpieza profunda (⚠️)
```

---

### pnpm (En contenedor)

```bash
# Ejecutar comando dentro del contenedor
docker compose exec mysql mysql -u ecommerce -pecommerce ecommerce_dev

# Ver tablas
docker compose exec mysql mysql -u ecommerce -pecommerce -e "SHOW TABLES;" ecommerce_dev

# Backup de DB
docker compose exec mysql mysqldump -u ecommerce -pecommerce ecommerce_dev > backup.sql

# Restaurar DB
docker compose exec -T mysql mysql -u ecommerce -pecommerce ecommerce_dev < backup.sql
```

---

## 🐛 Troubleshooting

### Problema 1: "Port already in use"

```bash
Error: bind: address already in use
```

**Causa:** Ya hay algo corriendo en el puerto (ej: MySQL nativo en 3307)

**Solución:**
```bash
# Opción 1: Cambiar puerto en docker-compose.yml
ports:
  - "3308:3306"  # Cambiar 3307 → 3308

# Opción 2: Detener servicio nativo
# Windows:
services.msc  # Buscar MySQL y detener

# Linux/Mac:
sudo systemctl stop mysql
```

---

### Problema 2: "Cannot connect to MySQL"

**Causa:** MySQL aún está iniciando

**Solución:**
```bash
# Ver logs de MySQL
docker compose logs mysql

# Esperar a ver:
# "ready for connections. Version: '8.0.x'"

# O usar healthcheck:
docker compose ps  # Debería mostrar "healthy"
```

---

### Problema 3: "Permission denied" en volúmenes

**Causa:** Permisos de Docker Desktop o WSL

**Solución (Windows):**
1. Docker Desktop → Settings → Resources → File Sharing
2. Agregar `C:\Users\sa308\projects\ecommerce-backend-carlitos`
3. Apply & Restart

---

### Problema 4: Tests fallan en GitHub Actions pero pasan local

**Causa:** Variables de entorno faltantes en CI

**Solución:**
```yaml
# Agregar en .github/workflows/backend-tests.yml
env:
  NUEVA_VARIABLE: valor
```

---

## 📖 Recursos para Aprender Más

### Docker
- [Docker Docs Oficial](https://docs.docker.com/get-started/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Play with Docker](https://labs.play-with-docker.com/) - Práctica gratis online

### GitHub Actions
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Awesome Actions](https://github.com/sdras/awesome-actions) - Lista de actions útiles

### CI/CD
- [CI/CD Explained (Video)](https://www.youtube.com/watch?v=scEDHsr3APg)
- [GitHub Actions Tutorial](https://www.youtube.com/watch?v=R8_veQiYBjI)

---

## 🎯 Próximos Pasos Recomendados

1. ✅ **Hecho**: Entender Docker conceptualmente
2. ✅ **Hecho**: Activar GitHub Actions
3. 🔄 **Siguiente**: Deploy automático a Render con GitHub Actions
4. 🔄 **Siguiente**: Dockerizar el frontend (React)
5. 🔄 **Siguiente**: Crear un workflow completo (test → build → deploy)

---

**¿Preguntas?** Este documento vive en el repo para que lo consultes cuando necesites.
