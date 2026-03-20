# httpOnly Cookies Migration - Access Token Security

## 🎯 Objetivo

Migrar access tokens de localStorage (vulnerable a XSS) a httpOnly cookies (inmune a XSS).

## ✅ Backend - Completado

### 1. Configuración de Cookies

**Access Token Cookie:**
```javascript
{
  httpOnly: true,           // No accesible desde JavaScript
  sameSite: 'strict',      // CSRF protection (dev/test)
  sameSite: 'none',        // Required for cross-origin (production)
  secure: true,            // Solo HTTPS (production)
  path: '/',               // Disponible para toda la API
  maxAge: 15 * 60 * 1000   // 15 minutos
}
```

**Refresh Token Cookie:**
```javascript
{
  httpOnly: true,
  sameSite: 'lax',         // Balance seguridad/usabilidad
  secure: true,            // Solo HTTPS (production)
  path: '/api/auth',       // Solo endpoints de auth
  maxAge: 7 días
}
```

### 2. Cambios en auth.controller.js

**Antes (localStorage):**
```javascript
success(res, { accessToken }, 'Login successful');
```

**Ahora (httpOnly cookie):**
```javascript
res.cookie('accessToken', accessToken, accessTokenCookieOptions);
res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
success(res, {}, 'Login successful'); // Sin tokens en body
```

**Endpoints actualizados:**
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/verify-email`
- ✅ `POST /api/auth/refresh`
- ✅ `GET /api/auth/oauth/google/callback`
- ✅ `POST /api/auth/logout` (clear cookies)
- ✅ `POST /api/auth/logout-all` (clear cookies)

### 3. Cambios en auth.middleware.js

**Antes:**
```javascript
// Solo leía de Authorization: Bearer <token>
const authHeader = req.headers.authorization;
const [scheme, token] = authHeader.split(' ');
```

**Ahora (con fallback):**
```javascript
// Prioridad 1: Cookie (httpOnly - seguro)
let token = req.cookies?.accessToken;

// Prioridad 2: Header (backward compatibility)
if (!token) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, headerToken] = authHeader.split(' ');
    if (scheme === 'Bearer' && headerToken) {
      token = headerToken;
    }
  }
}
```

### 4. Tests Actualizados

- ✅ `auth.http.test.js` - Todos los tests adaptados a cookies
- ✅ Tests verifican que accessToken NO está en response body
- ✅ Tests verifican que accessToken Y refreshToken están en cookies
- ✅ Tests verifican que cookies se limpian en logout

## 🔒 Seguridad

### Protección contra XSS
- **Antes**: `localStorage.getItem('accessToken')` → vulnerable si attacker inyecta JS
- **Ahora**: httpOnly cookie → JavaScript NO puede leer el token

### Protección contra CSRF
- **sameSite='strict'**: Cookies NO se envían en requests cross-site (dev/test)
- **sameSite='none' + secure**: Requerido para production cross-origin, pero con HTTPS obligatorio
- **Path restriction**: refreshToken solo para `/api/auth`

### Comparación

| Ataque | localStorage | httpOnly Cookie |
|--------|--------------|-----------------|
| XSS (inyección JS) | ❌ Vulnerable | ✅ Protegido |
| CSRF | ✅ Protegido (tokens en header) | ✅ Protegido (sameSite) |
| Network sniffing | ⚠️ Depends on HTTPS | ⚠️ Depends on HTTPS |
| Cookie theft (físico) | N/A | ⚠️ Posible (device access) |

## 🚀 Frontend - TODO

### 1. Remover localStorage

**Antes:**
```javascript
// apps/web/src/api/auth.js
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

**Después:**
```javascript
// NO guardar nada - las cookies se manejan automáticamente
// Browser envía cookies en cada request
```

### 2. Configurar fetch con credentials

**Actualizar:**
```javascript
// apps/web/src/api/api.js
const response = await fetch(url, {
  ...options,
  credentials: 'include', // Enviar cookies cross-origin
});
```

### 3. Actualizar AuthContext

**Actualizar:**
```javascript
// apps/web/src/context/AuthContext.jsx

// Remover:
// - localStorage.getItem('accessToken')
// - localStorage.setItem('accessToken', ...)
// - localStorage.removeItem('accessToken')

// Cambiar login response handling:
const login = async (email, password) => {
  const response = await authApi.login(email, password);
  // No extraer accessToken del response (ya está en cookie)
  await loadUser(); // Fetch user data con cookie
};
```

### 4. Actualizar Interceptores

**Actualizar:**
```javascript
// apps/web/src/api/api.js

// Remover token de headers (ya se envía automáticamente en cookie):
// headers: {
//   'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
// }

// Mantener solo:
headers: {
  'Content-Type': 'application/json',
}
```

### 5. Actualizar Refresh Token Flow

**Antes:**
```javascript
// Si 401, hacer refresh manualmente y obtener nuevo accessToken
const refreshResponse = await authApi.refresh();
localStorage.setItem('accessToken', refreshResponse.data.accessToken);
```

**Después:**
```javascript
// Si 401, hacer refresh - la cookie se actualiza automáticamente
await authApi.refresh(); // No guardar nada, cookie se actualiza sola
// Retry original request - nueva cookie se envía automáticamente
```

## 📋 Checklist de Migración

### Backend ✅
- [x] Configurar access token cookie options
- [x] Actualizar login para enviar cookies
- [x] Actualizar verifyEmail para enviar cookies
- [x] Actualizar refresh para enviar cookies
- [x] Actualizar logout para limpiar cookies
- [x] Actualizar googleCallback para enviar cookies
- [x] Modificar auth.middleware para leer de cookie (con fallback a header)
- [x] Actualizar tests de auth.http

### Frontend ⏳
- [ ] Remover localStorage de accessToken y refreshToken
- [ ] Configurar `credentials: 'include'` en fetch
- [ ] Actualizar AuthContext (remover localStorage)
- [ ] Actualizar login/logout flow
- [ ] Actualizar refresh token flow
- [ ] Remover Authorization header manual (cookies automáticas)
- [ ] Actualizar tests frontend

### Testing ⏳
- [ ] Verificar login flow end-to-end
- [ ] Verificar OAuth flow end-to-end
- [ ] Verificar refresh token rotation
- [ ] Verificar logout limpia cookies
- [ ] Verificar que frontend NO puede leer accessToken vía JS

## 🔍 Verificación Manual

### 1. Login Flow
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  -c cookies.txt \
  -v

# Verificar en headers:
# Set-Cookie: accessToken=...; Path=/; HttpOnly; SameSite=Strict
# Set-Cookie: refreshToken=...; Path=/api/auth; HttpOnly; SameSite=Lax

# 2. Request autenticado con cookie
curl http://localhost:3000/api/me \
  -b cookies.txt \
  -v
```

### 2. Verificar en Browser DevTools
1. Chrome DevTools → Application → Cookies
2. Buscar `accessToken`:
   - ✅ HttpOnly: true (no accesible desde JS)
   - ✅ Secure: true (solo HTTPS en prod)
   - ✅ SameSite: Strict o None
   - ✅ Path: /
   - ✅ Expires: ~15 min

3. Console → Intentar leer:
```javascript
document.cookie // accessToken NO debe aparecer (httpOnly)
localStorage.getItem('accessToken') // null
```

## 🎓 Decisiones Arquitectónicas

### ¿Por qué httpOnly cookies?
- **Protección XSS**: Si un attacker inyecta JS malicioso, NO puede robar tokens
- **Industry standard**: OAuth 2.0 BCP recomienda httpOnly cookies para SPAs
- **Zero-trust browser**: Asumimos que JavaScript puede ser comprometido

### ¿Por qué mantener fallback a Authorization header?
- **Backward compatibility**: Tests existentes siguen funcionando
- **Mobile apps**: Apps nativas pueden no soportar cookies
- **Debugging**: Más fácil testear con curl/Postman

### ¿Por qué sameSite='strict' en dev?
- **Mejor seguridad**: Máxima protección CSRF
- **Producción diferente**: 'none' requerido para cross-origin con HTTPS

### ¿Por qué path='/' para accessToken?
- Access token se usa en TODOS los endpoints (`/api/*`)
- RefreshToken solo se usa en `/api/auth/*` (path específico)

## 📚 Referencias
- [OWASP - XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OAuth 2.0 Browser-Based Apps BCP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [MDN - SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
