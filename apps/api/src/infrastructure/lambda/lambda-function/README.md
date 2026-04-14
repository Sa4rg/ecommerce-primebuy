# 🔧 Configuración de Lambda para Alertas WhatsApp

## 📋 Variables de entorno requeridas en AWS Lambda

Debes configurar estas variables en tu función Lambda en AWS:

### 1. Ve a AWS Lambda Console
- Abre tu función: `inventoryLowStockAlert`
- Ve a la pestaña "**Configuration**"
- Selecciona "**Environment variables**"
- Click en "**Edit**"

### 2. Agrega las siguientes variables:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=whatsapp:+[código país][tu número]
```

**Ejemplo:**
```
ADMIN_WHATSAPP_NUMBER=whatsapp:+351960123456
```

⚠️ **IMPORTANTE:** 
- Los números deben incluir el prefijo `whatsapp:`
- El formato es: `whatsapp:+[código país][número]`
- No incluyas espacios ni guiones en los números

---

## 📦 Actualizar el código de la Lambda

### Opción A: Desde la consola de AWS (más rápido)

1. Ve a tu función Lambda: `inventoryLowStockAlert`
2. En la pestaña "**Code**", elimina el código actual
3. Copia el contenido del archivo `index.mjs` de este directorio
4. Pega el código en el editor de AWS
5. Click en "**Deploy**"
6. Espera a que diga "Successfully deployed"

### Opción B: Subir archivo ZIP

1. Comprime el archivo `index.mjs` en un `.zip`
2. Ve a tu función Lambda
3. Click en "**Upload from**" → ".zip file"
4. Selecciona el archivo comprimido
5. Click en "**Save**"

---

## 🧪 Probar la función Lambda

### Desde AWS Console:

1. Ve a la pestaña "**Test**"
2. Crea un nuevo evento de prueba con este JSON:

```json
{
  "productName": "Smartwatch Serie Y13",
  "stock": 1
}
```

3. Click en "**Test**"
4. Verifica en los logs que aparezca:
   - ✅ "WhatsApp enviado exitosamente"
   - Un `twilioMessageSid` en la respuesta

5. **Revisa tu WhatsApp** → Deberías recibir el mensaje de alerta

---

## ✅ Verificación final

Cuando ejecutes el test, deberías:
1. ✅ Ver logs exitosos en CloudWatch
2. ✅ Recibir un WhatsApp en tu teléfono
3. ✅ Ver statusCode: 200 en el resultado

---

## 🐛 Troubleshooting

### Error: "Configuración de Twilio incompleta"
- Verifica que agregaste todas las variables de entorno
- Confirma que no hay espacios extras

### Error: "Twilio API error: 401"
- Revisa que el `TWILIO_AUTH_TOKEN` sea correcto
- Verifica el `TWILIO_ACCOUNT_SID`

### Error: "Twilio API error: 403"
- Confirma que el número destino esté unido al Sandbox
- Envía `join ball-plural` nuevamente al +14155238886

### No recibo WhatsApp
- Verifica que `ADMIN_WHATSAPP_NUMBER` incluya el código de país correcto
- Formato debe ser: `whatsapp:+[código país][número completo]`
- Ejemplo: `whatsapp:+351960123456`
- Confirma que tu WhatsApp esté conectado al Sandbox

---

## 📝 Notas

- **Sandbox limitations:** Solo puedes enviar a números que se unieron al sandbox
- **Production:** Para enviar a cualquier número, necesitas actualizar a Twilio de pago
- **Costos:** El Sandbox es gratis, pero tiene limitaciones
- **Rate limits:** Twilio Sandbox tiene límites de mensajes por día

---

## 🔄 Cambiar el número de destino

Si cambias de número WhatsApp para recibir alertas:

1. El nuevo número debe enviar `join ball-plural` a +14155238886
2. Actualiza la variable `ADMIN_WHATSAPP_NUMBER` en Lambda
3. Formato: `whatsapp:+[código país][número]`
