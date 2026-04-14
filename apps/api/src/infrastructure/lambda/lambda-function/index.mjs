// Lambda function for sending WhatsApp alerts via Twilio
import https from 'https';

/**
 * Send WhatsApp message using Twilio API
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @param {string} from - Twilio WhatsApp number (format: whatsapp:+14155238886)
 * @param {string} to - Destination WhatsApp number (format: whatsapp:+[country code][number])
 * @param {string} body - Message content
 * @returns {Promise<Object>}
 */
function sendWhatsAppMessage(accountSid, authToken, from, to, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const postData = new URLSearchParams({
      From: from,
      To: to,
      Body: body
    }).toString();

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Twilio API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

export const handler = async (event) => {
  console.log('🚀 Lambda ejecutada con éxito');
  console.log('📦 Datos recibidos:', JSON.stringify(event, null, 2));
  
  // Extraer datos del evento
  const { productName, stock } = event;
  
  // Validar que vengan los datos
  if (!productName) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Falta el nombre del producto'
      })
    };
  }
  
  // Validar variables de entorno
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;
  const adminWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER;
  
  if (!accountSid || !authToken || !twilioWhatsApp || !adminWhatsApp) {
    console.error('❌ Faltan variables de entorno de Twilio');
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Configuración de Twilio incompleta'
      })
    };
  }
  
  // Construir mensaje de alerta
  const alertMessage = `🚨 *ALERTA DE INVENTARIO*\n\n` +
    `📦 *Producto:* ${productName}\n` +
    `📊 *Stock actual:* ${stock !== undefined ? stock : 0} unidad(es)\n\n` +
    `⚠️ *Acción requerida:* Revisar reabastecimiento urgente`;
  
  console.log('📨 Enviando mensaje WhatsApp...');
  
  try {
    // Enviar WhatsApp via Twilio
    const result = await sendWhatsAppMessage(
      accountSid,
      authToken,
      twilioWhatsApp,
      adminWhatsApp,
      alertMessage
    );
    
    console.log('✅ WhatsApp enviado exitosamente:', result.sid);
    
    // Respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Alerta de WhatsApp enviada correctamente',
        twilioMessageSid: result.sid,
        alert: alertMessage
      })
    };
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'No se pudo enviar el WhatsApp',
        details: error.message
      })
    };
  }
};
