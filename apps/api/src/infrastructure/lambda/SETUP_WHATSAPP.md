# 🚀 Integración WhatsApp - Guía Completa

## ✅ Estado actual

- [x] Cuenta Twilio creada
- [x] WhatsApp conectado al Sandbox
- [x] Credenciales obtenidas
- [x] Código de Lambda actualizado
- [ ] **Variables de entorno configuradas en AWS**
- [ ] **Código de Lambda desplegado en AWS**
- [ ] **Prueba completa realizada**

---

## 📋 Próximos pasos

### Paso 1: Configurar variables de entorno en AWS Lambda (5 min)

1. Ve a [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Busca tu función: `inventoryLowStockAlert`
3. Click en la función para abrirla
4. Ve a la pestaña "**Configuration**"
5. En el menú lateral, click en "**Environment variables**"
6. Click en "**Edit**"
7. Agrega estas 4 variables (click "Add environment variable" para cada una):

```
Variable name: TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (tu Account SID real)

Variable name: TWILIO_AUTH_TOKEN
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (tu Auth Token real)

Variable name: TWILIO_WHATSAPP_NUMBER
Value: whatsapp:+14155238886

Variable name: ADMIN_WHATSAPP_NUMBER
Value: whatsapp:+[código país][tu número completo]
```

**Ejemplo del número admin:**
```
whatsapp:+351966123456
```

8. Click en "**Save**"

⚠️ **MUY IMPORTANTE:** Los números DEBEN incluir el prefijo `whatsapp:` exactamente como se muestra.

---

### Paso 2: Actualizar el código de Lambda en AWS (5 min)

**Opción A: Copiar y pegar (Recomendado)**

1. Ve a la pestaña "**Code**" de tu función Lambda
2. En el editor, **borra todo el código actual**
3. Abre el archivo: `apps/api/src/infrastructure/lambda/lambda-function/index.mjs`
4. **Copia todo el contenido**
5. **Pégalo en el editor de AWS**
6. Click en "**Deploy**"
7. Espera el mensaje: "Successfully deployed"

**Opción B: Subir archivo**

1. Comprime el archivo `index.mjs` en un `.zip`
2. Ve a tu función Lambda
3. Click en "Upload from" → ".zip file"
4. Selecciona el archivo
5. Click "Save"

---

### Paso 3: Probar desde AWS Console (3 min)

1. En tu función Lambda, ve a la pestaña "**Test**"
2. Click en "**Test**" (si no hay evento, créalo)
3. Usa este JSON de prueba:

```json
{
  "productName": "Producto de Prueba",
  "stock": 1
}
```

4. Click en "**Test**"
5. **Revisa tu WhatsApp** → Deberías recibir un mensaje 📱

**Resultado esperado:**
```json
{
  "statusCode": 200,
  "body": "{\"success\":true,\"message\":\"Alerta de WhatsApp enviada correctamente\",\"twilioMessageSid\":\"SM...\"}"
}
```

---

### Paso 4: Probar desde tu backend local (2 min)

Desde tu terminal en `apps/api`:

```bash
node src/infrastructure/lambda/test-lambda-whatsapp.js
```

**Resultado esperado:**
```
🧪 Iniciando prueba de Lambda + WhatsApp...
📡 Invocando Lambda...
✅ Lambda ejecutada exitosamente
🎉 ¡ÉXITO! Revisa tu WhatsApp, deberías recibir la alerta.
```

**Y deberías recibir otro WhatsApp en tu teléfono.**

---

### Paso 5: Probar flujo completo E2E (5 min)

Ahora vamos a probar que todo funcione cuando un producto llegue a stock bajo:

**Escenario: Producto con stock 2 → compran 1 → queda stock 1 → alerta WhatsApp**

1. Crea un producto con stock bajo (API o base de datos):
```bash
# Usar Postman o similar
POST /api/products
{
  "nameES": "Producto Test WhatsApp",
  "priceUSD": 10,
  "stock": 2,
  "category": "Test"
}
```

2. Simula una compra/orden que reduzca el stock a 1
3. **Revisa tu WhatsApp** → Deberías recibir la alerta automáticamente

---

## 🎉 ¿Todo funcionó?

Si completaste los 5 pasos y recibiste WhatsApp en tu teléfono:

✅ **¡Integración completada exitosamente!**

Tu sistema ahora:
- Detecta cuando el stock llega a ≤ 1
- Invoca Lambda automáticamente
- Lambda envía WhatsApp al admin
- El flujo es resiliente (si falla WhatsApp, no rompe la compra)

---

## 🐛 Problemas comunes

### No recibo WhatsApp

1. **Verifica que las variables de entorno estén correctas en Lambda**
   - Ve a Configuration → Environment variables
   - Confirma que los 4 valores estén exactos

2. **Verifica que tu WhatsApp esté en el Sandbox**
   - Abre WhatsApp
   - Busca el chat con +14155238886
   - Deberías ver el mensaje de confirmación

3. **Revisa los logs de Lambda**
   - Ve a la pestaña "Monitor" en Lambda
   - Click en "View logs in CloudWatch"
   - Busca errores

### Lambda responde con error 500

- Revisa CloudWatch logs
- Verifica que el código se desplegó correctamente
- Confirma que las variables de entorno existen

### Error: "Twilio API error: 401"

- El `TWILIO_AUTH_TOKEN` es incorrecto
- Verifica que copiaste el token completo

### Error: "Twilio API error: 403"

- El número destino no está en el Sandbox
- Envía `join ball-plural` nuevamente

---

## 📱 Formato del mensaje WhatsApp

El mensaje que recibirás es:

```
🚨 *ALERTA DE INVENTARIO*

📦 *Producto:* [Nombre del producto]
📊 *Stock actual:* [Cantidad] unidad(es)

⚠️ *Acción requerida:* Revisar reabastecimiento urgente
```

---

## 🔄 Próximos pasos (Opcional)

### Para producción:
1. Migrar de Sandbox a Twilio de pago (~$20/mes)
2. Configurar múltiples destinatarios
3. Agregar plantillas de mensajes personalizados
4. Implementar WhatsApp para notificaciones a clientes

### Para mejorar:
1. Agregar más tipos de alertas (stock crítico = 0, etc.)
2. Enviar reporte diario de inventario
3. Integrar con sistema de reabastecimiento automático

---

## 📚 Documentación adicional

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [AWS Lambda Environment Variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [Archivo README detallado](./lambda-function/README.md)

---

## ✋ ¿Necesitas ayuda?

Si algo no funciona:
1. Revisa los logs de CloudWatch
2. Verifica las variables de entorno
3. Confirma que tu WhatsApp esté en el Sandbox
4. Lee la sección de Troubleshooting en `lambda-function/README.md`
