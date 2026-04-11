# 🔍 Voiceflow - Order Lookup by Verification

## Endpoint

```
POST /api/voiceflow/orders/lookup-by-verification
```

## Descripción

Permite al chatbot de Voiceflow consultar los pedidos activos de un usuario después de verificar su identidad usando **email + últimos 4 dígitos del teléfono**.

Este método es más seguro que solo pedir el email, ya que:
- Requiere dos factores de verificación (email + phone)
- No expone datos sensibles en la respuesta
- Solo devuelve órdenes activas (no historial completo)

---

## Autenticación

**Header requerido:**
```
X-Voiceflow-API-Key:
```

---

## Request Body

```json
{
  "email": "customer@example.com",
  "phone_last4": "1234"
}
```

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | ✅ | Email del cliente (case-insensitive) |
| `phone_last4` | string | ✅ | Últimos 4 dígitos del teléfono (solo números) |

---

## Respuestas

### ✅ Success - Órdenes encontradas (200)

```json
{
  "success": true,
  "found": true,
  "message": "Tienes 2 pedidos activos",
  "data": {
    "orders": [
      {
        "orderId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "status": "processing",
        "statusES": "En proceso",
        "totalUSD": 150.00,
        "createdAt": "2024-03-15T10:30:00.000Z",
        "itemsCount": 3
      },
      {
        "orderId": "f6e5d4c3-b2a1-0987-6543-210fedcba987",
        "status": "shipped",
        "statusES": "Enviado",
        "totalUSD": 75.50,
        "createdAt": "2024-02-20T14:20:00.000Z",
        "itemsCount": 1
      }
    ]
  }
}
```

### ✅ Success - Sin órdenes activas (200)

```json
{
  "success": true,
  "found": false,
  "message": "No tienes pedidos activos en este momento.",
  "data": {
    "orders": []
  }
}
```

### ❌ Error - Verificación fallida (403)

Cuando el email no existe O los últimos 4 dígitos del teléfono no coinciden:

```json
{
  "success": false,
  "found": false,
  "message": "No pude verificar tu identidad. Por favor verifica tus datos.",
  "errorCode": "VERIFICATION_FAILED"
}
```

### ❌ Error - Validación (400)

```json
{
  "success": false,
  "message": "phone_last4 must be exactly 4 digits"
}
```

### ❌ Error - Auth (401)

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Estados de Orden

Solo se devuelven órdenes con estados **activos**:

| Status API | Traducción ES | ¿Incluido? |
|------------|---------------|------------|
| `pending` | Pendiente | ✅ |
| `paid` | Pagada | ✅ |
| `processing` | En proceso | ✅ |
| `shipped` | Enviado | ✅ |
| `delivered` | Entregado | ❌ |
| `cancelled` | Cancelado | ❌ |

---

## Ejemplos de uso en Voiceflow

### 1. Configuración del API Tool

**En tu API Block de Voiceflow:**

- **Method:** POST
- **URL:** `https://tu-api.com/api/voiceflow/orders/lookup-by-verification`
- **Headers:**
  - `X-Voiceflow-API-Key`: `VF.DM.69ceb8e36fa98681edde7e2a.Vf443jmL3kF0XHW1`
  - `Content-Type`: `application/json`
- **Body:**
  ```json
  {
    "email": "{customer_email}",
    "phone_last4": "{phone_last4}"
  }
  ```

### 2. Flujo del Chatbot

```
Bot: ¡Hola! ¿En qué puedo ayudarte hoy?
User: Quiero saber el estado de mi pedido

Bot: Claro, necesito verificar tu identidad. ¿Cuál es tu email?
User: juan@example.com

Bot: Perfecto. Por seguridad, ¿últimos 4 dígitos de tu teléfono?
User: 5678

[Voiceflow llama a la API]

Bot (si success): Tienes 2 pedidos activos:
     - Orden #a1b2c3d4: En proceso ($150)
     - Orden #f6e5d4c3: Enviado ($75.50)
     ¿Sobre cuál quieres más información?

Bot (si falla): No pude verificar tu identidad. Por favor 
                verifica que tu email y teléfono sean correctos.
```

### 3. Variables en Voiceflow

Necesitas capturar estas variables del usuario:

```
{customer_email}  → Slot type: Email
{phone_last4}     → Slot type: Number (4 digits)
```

---

## Seguridad

### ✅ Lo que se hace bien:

- Requiere autenticación via API Key
- Verifica email + teléfono (dos factores)
- No expone información sensible del cliente
- Búsqueda case-insensitive para emails
- Acepta teléfonos en diferentes formatos
- Rate limiting (ya implementado en el middleware de Voiceflow)

### ⚠️ Consideraciones:

- El teléfono se obtiene de las órdenes previas, no de la tabla users
- Un usuario sin órdenes previas no podrá usar este método
- Si el teléfono cambió entre órdenes, solo se verifica el último usado

---

## Testing

Para probar el endpoint localmente:

```bash
# 1. Levantar Docker containers
docker-compose up -d

# 2. Ejecutar tests
cd apps/api
pnpm test voiceflow.orders-verification.http.test.js

# 3. Test manual con curl
curl -X POST http://localhost:3000/api/voiceflow/orders/lookup-by-verification \
  -H "X-Voiceflow-API-Key: VF.DM.69ceb8e36fa98681edde7e2a.Vf443jmL3kF0XHW1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "phone_last4": "1234"
  }'
```

---

## Arquitectura

### Flujo de datos:

```
Voiceflow → API Key Auth → Request Validation → 
  Controller → Service → OrdersRepository → MySQL
→ Response Formatting → Voiceflow
```

### Archivos modificados/creados:

- ✅ [Test](src/__tests__/voiceflow.orders-verification.http.test.js)
- ✅ [Schema](src/schemas/voiceflow.schemas.js) - `lookupOrderByVerificationBodySchema`
- ✅ [Controller](src/controllers/voiceflow.controller.js) - `lookupOrderByVerification`
- ✅ [Service](src/services/voiceflow.service.js) - `lookupOrdersByVerification`
- ✅ [Routes](src/routes/voiceflow.routes.js) - `POST /orders/lookup-by-verification`
- ✅ [Repository](src/repositories/orders/orders.mysql.repository.js) - `findByCustomerEmail`
- ✅ [Orders Service](src/services/orders.service.js) - `getOrdersByCustomerEmail`

---

## Próximos pasos recomendados

1. **Rate Limiting específico**: Limitar intentos de verificación por IP
2. **Auditoría**: Registrar consultas de órdenes para análisis
3. **Campo phone en users**: Agregar migraciones para guardar teléfono en la tabla users
4. **Código OTP alternativo**: Implementar código temporal de 6 dígitos (más seguro)

---

## Migración futura: Phone en tabla Users

Para mejorar la arquitectura, considera agregar:

```sql
ALTER TABLE users 
ADD COLUMN phone VARCHAR(64) NULL;
```

Esto permitirá:
- Verificación más confiable
- No depender de órdenes previas
- Usuarios nuevos también pueden consultar
