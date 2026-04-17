# Sentry Error Monitoring

Sentry está configurado para capturar automáticamente errores en producción y ayudarte a identificar problemas antes de que afecten a muchos usuarios.

## 📊 Dashboard

**URL:** https://primebuy.sentry.io/issues/

Aquí verás todos los errores que ocurren en producción en tiempo real.

---

## 🚀 Configuración Actual

### Local (Development)
- ✅ Sentry habilitado con `SENTRY_ENABLED=1` en `.env.local`
- ✅ Sample rates al 100% (captura todos los errores para testing)
- ✅ Rutas de test disponibles en `/api/sentry-test/*`

### Producción (Render)
- ✅ Sentry habilitado automáticamente en `NODE_ENV=production`
- ✅ Sample rates al 10% (captura 1 de cada 10 requests para performance)
- ❌ Rutas de test NO disponibles (protegidas)
- ✅ Release tracking con Git commit (`RENDER_GIT_COMMIT`)

---

## 🎯 ¿Qué Captura Sentry Automáticamente?

### ✅ Errores No Manejados
Cualquier error que no captures con `try/catch`:
```javascript
app.get('/users', async (req, res) => {
  const user = await User.findById(req.params.id); // Si falla → Sentry lo captura
  res.json(user);
});
```

### ✅ Rechazos de Promesas
```javascript
Promise.reject(new Error('Something failed')); // → Sentry lo captura
```

### ✅ Errores 500 en Express
Cualquier endpoint que retorne error 500 se registra automáticamente.

---

## 📝 Captura Manual de Errores

A veces quieres enviar información adicional a Sentry:

```javascript
const Sentry = require('../instrument');

// Capturar excepción con contexto
try {
  await processPayment(orderId);
} catch (error) {
  Sentry.captureException(error, {
    user: { id: userId, email: userEmail },
    tags: { feature: 'payments', critical: true },
    extra: { orderId, amount, currency }
  });
  
  // Manejar el error
  res.status(500).json({ error: 'Payment failed' });
}

// Capturar mensaje/warning (no es error)
Sentry.captureMessage('Payment processed with warning: low inventory', 'warning');
```

---

## 🔍 ¿Qué Información Incluye Cada Error?

Cuando ocurre un error, Sentry captura:

1. **Stack Trace** - Línea exacta donde ocurrió el error
2. **Request Context** - URL, método HTTP, headers, body
3. **User Info** - Si hay sesión activa (user ID, email)
4. **Environment** - development, production, staging
5. **Release** - Git commit para saber en qué versión ocurrió
6. **Breadcrumbs** - Acciones previas del usuario (últimas 100)
7. **Performance** - Duración de la request, queries de DB

---

## 🚨 ¿Cuándo Deberías Revisar Sentry?

### ⚠️ Siempre:
- Después de cada deploy a producción (primeros 10-15 min)
- Si usuarios reportan problemas

### 📧 Configura Alertas:
Puedes configurar notificaciones por email/Slack cuando:
- Un error nuevo aparece por primera vez
- Un error afecta a más de X usuarios
- La tasa de errores aumenta repentinamente

**Configurar:** Settings > Alerts > Create Alert Rule

---

## 🧪 Testing en Local

Las rutas de test están disponibles solo en development:

```bash
# Error no manejado (500)
curl http://localhost:3000/api/sentry-test/error

# Captura manual con contexto
curl http://localhost:3000/api/sentry-test/capture-exception

# Mensaje/warning
curl http://localhost:3000/api/sentry-test/capture-message

# Error asíncrono
curl http://localhost:3000/api/sentry-test/async-error
```

Luego verifica que aparecen en: https://primebuy.sentry.io/issues/

---

## 📋 Variables de Entorno

### Producción (Render)
```env
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1      # 10% de requests
SENTRY_PROFILES_SAMPLE_RATE=0.1    # 10% de profiling
```

### Local Testing
```env
# .env.local
SENTRY_ENABLED=1                   # Forzar activación
SENTRY_TRACES_SAMPLE_RATE=1.0      # 100% para testing
SENTRY_PROFILES_SAMPLE_RATE=1.0    # 100% para testing
```

---

## 🎓 Aprende Más

### Conceptos Básicos:
- **Issue** - Grupo de errores similares (mismo stack trace)
- **Event** - Una ocurrencia individual de un error
- **Environment** - development, production, staging
- **Release** - Versión del código (Git commit)
- **Breadcrumbs** - Historial de acciones del usuario

### Secciones del Dashboard:
- **Issues** - Lista de errores agrupados
- **Performance** - Endpoints lentos, queries pesadas
- **Releases** - Errores por versión de código
- **Alerts** - Configurar notificaciones

### Recursos:
- Docs: https://docs.sentry.io/platforms/javascript/guides/express/
- Video intro: https://www.youtube.com/watch?v=_SU6E63p5Ok (10 min)

---

## ⚡ Tips Pro

1. **Ignora errores conocidos:**
   - Settings > Inbound Filters
   - Ejemplo: Bots, crawlers, errores de extensiones de navegador

2. **Asigna owners a issues:**
   - Cada issue puede tener un responsable
   - Útil en equipos grandes

3. **Crea filtros personalizados:**
   - Por endpoint: `/api/payments/*`
   - Por severidad: `error`, `warning`, `info`
   - Por usuario: `user.email:carlos@example.com`

4. **Integra con GitHub:**
   - Settings > Integrations > GitHub
   - Crea issues automáticamente desde Sentry

---

## 🔥 Producción Lista

✅ **Sentry configurado y funcionando**
- Captura automática de errores
- Performance monitoring habilitado
- Release tracking con Git commits
- Rutas de test protegidas en producción

**Próximo deploy:** Los errores aparecerán automáticamente en el dashboard. 🎯
