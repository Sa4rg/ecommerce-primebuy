/**
 * Notification Service
 * 
 * Sends transactional emails for payment and order status updates.
 * Logs all notifications for auditing purposes.
 */

const { v4: uuidv4 } = require('uuid');

// Notification types
const NOTIFICATION_TYPES = {
  PAYMENT_SUBMITTED: 'payment_submitted',
  ADMIN_PAYMENT_SUBMITTED: 'admin_payment_submitted',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_PROCESSING: 'order_processing',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
};

// Email templates (bilingual: ES primary)
const EMAIL_TEMPLATES = {
  [NOTIFICATION_TYPES.PAYMENT_SUBMITTED]: {
    subject: '🧾 Comprobante recibido - Pedido #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Gracias por tu compra!</h2>
        <p>Hemos recibido tu comprobante de pago para el pedido <strong>#${data.orderId || data.checkoutId}</strong>.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Monto:</strong> $${data.amount} ${data.currency}</p>
          <p style="margin: 8px 0 0;"><strong>Método:</strong> ${data.paymentMethod}</p>
        </div>
        <p>Estamos verificando tu pago. Te notificaremos cuando tu orden sea confirmada.</p>
        <p style="color: #6b7280; font-size: 14px;">Tiempo estimado de verificación: 1-24 horas hábiles.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ADMIN_PAYMENT_SUBMITTED]: {
    subject: '🔔 Nuevo pago pendiente de revisión - PrimeBuy',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">⚠️ Nuevo Pago Registrado</h2>
          <p style="margin: 8px 0 0; opacity: 0.9;">Se ha registrado un nuevo comprobante de pago que requiere revisión</p>
        </div>
        
        <div style="background: #f9fafb; padding: 24px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 16px; color: #1f2937;">📋 Información del Pago</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">ID Pago:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">ID Checkout:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.checkoutId}</td>
            </tr>
            ${data.cartId ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">ID Carrito:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.cartId}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Estado:</td>
              <td style="padding: 8px 0;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-weight: 600;">PENDIENTE</span></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 16px 0 8px; font-weight: bold; color: #1f2937; font-size: 16px;">💰 Detalles Financieros</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Monto:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">${data.amount} ${data.currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Método de Pago:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.paymentMethod}</td>
            </tr>
            ${data.proofReference ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Referencia:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.proofReference}</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="padding: 16px 0 8px; font-weight: bold; color: #1f2937; font-size: 16px;">👤 Información del Cliente</td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Nombre:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.customerName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.customerEmail}</td>
            </tr>
            ${data.customerPhone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Teléfono:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.customerPhone}</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="padding: 16px 0 8px; font-weight: bold; color: #4b5563;">🕐 Fecha y Hora</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Registrado:</td>
              <td style="padding: 8px 0; color: #1f2937;">${data.submittedAt || new Date().toISOString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #dc2626; margin: 0 0 12px;">⚡ Acción Requerida</h3>
          <p style="margin: 0; color: #4b5563;">Por favor, revisa el comprobante de pago y procede a <strong>confirmar</strong> o <strong>rechazar</strong> el pago desde el panel de administración.</p>
          <div style="margin: 20px 0; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">⏱️ <strong>Tiempo de respuesta recomendado:</strong> 1-24 horas hábiles</p>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Este es un correo automático del sistema PrimeBuy</p>
          <p style="margin: 4px 0 0;">🔒 Información confidencial - Solo para uso interno</p>
        </div>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
    subject: '✅ ¡Pedido confirmado! - #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">¡Tu pedido ha sido confirmado!</h2>
        <p>El pago para tu pedido <strong>#${data.orderId}</strong> ha sido verificado exitosamente.</p>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0;"><strong>Estado:</strong> Confirmado</p>
          <p style="margin: 8px 0 0;"><strong>Total:</strong> $${data.total} ${data.currency}</p>
        </div>
        <h3 style="margin-top: 24px;">Resumen de tu pedido:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${data.items?.map((item) => `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.name} x${item.quantity}</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.subtotal}</td>
            </tr>
          `).join('') || ''}
        </table>
        <p style="margin-top: 16px;">Próximo paso: Tu pedido será procesado y preparado para envío.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ORDER_PROCESSING]: {
    subject: '📦 Tu pedido está siendo preparado - #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Estamos preparando tu pedido!</h2>
        <p>Tu pedido <strong>#${data.orderId}</strong> está siendo procesado.</p>
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0;"><strong>Estado:</strong> En procesamiento</p>
        </div>
        <p>Te notificaremos cuando tu pedido sea enviado.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
    subject: '🚚 ¡Tu pedido ha sido enviado! - #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">¡Tu pedido va en camino!</h2>
        <p>Tu pedido <strong>#${data.orderId}</strong> ha sido enviado.</p>
        <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #7c3aed;">
          <p style="margin: 0;"><strong>Estado:</strong> Enviado</p>
          ${data.trackingNumber ? `<p style="margin: 8px 0 0;"><strong>Tracking:</strong> ${data.trackingNumber}</p>` : ''}
          ${data.carrier ? `<p style="margin: 8px 0 0;"><strong>Transportadora:</strong> ${data.carrier}</p>` : ''}
        </div>
        <h3 style="margin-top: 24px;">Dirección de entrega:</h3>
        <p>${data.shippingAddress?.line1 || ''}<br>
        ${data.shippingAddress?.city || ''}, ${data.shippingAddress?.state || ''}<br>
        ${data.shippingAddress?.recipientName || ''} - ${data.shippingAddress?.phone || ''}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ORDER_COMPLETED]: {
    subject: '🎉 ¡Pedido entregado! - #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">¡Tu pedido ha sido entregado!</h2>
        <p>Tu pedido <strong>#${data.orderId}</strong> ha sido completado exitosamente.</p>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0;"><strong>Estado:</strong> Completado ✓</p>
        </div>
        <p>Esperamos que disfrutes tu compra. ¡Gracias por elegirnos!</p>
        <p style="margin-top: 16px;">Si tienes alguna pregunta o problema con tu pedido, no dudes en contactarnos.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },

  [NOTIFICATION_TYPES.ORDER_CANCELLED]: {
    subject: '❌ Pedido cancelado - #{orderId}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Tu pedido ha sido cancelado</h2>
        <p>El pedido <strong>#${data.orderId}</strong> ha sido cancelado.</p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0;"><strong>Estado:</strong> Cancelado</p>
          ${data.reason ? `<p style="margin: 8px 0 0;"><strong>Motivo:</strong> ${data.reason}</p>` : ''}
        </div>
        <p>Si tienes alguna pregunta, por favor contáctanos.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Este es un correo automático de Prime Buy. No respondas a este mensaje.</p>
      </div>
    `,
  },
};

function createNotificationService({
  notificationLogsRepository,
  emailService,
  adminEmail = 'cyaimport.c.a@gmail.com',
  idGenerator = uuidv4,
  nowProvider = () => new Date(),
}) {
  /**
   * Send a notification email and log it
   * @param {Object} params
   * @param {string} params.userId - User ID (optional)
   * @param {string} params.email - Email address to send to
   * @param {string} params.type - Notification type from NOTIFICATION_TYPES
   * @param {Object} params.data - Template data
   * @param {string} params.relatedEntityId - Related entity ID (orderId, paymentId)
   * @param {string} params.relatedEntityType - 'order' | 'payment' | 'checkout'
   */
  async function sendNotification({
    userId,
    email,
    type,
    data,
    relatedEntityId,
    relatedEntityType,
  }) {
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      console.warn(`[NOTIFICATION] Unknown notification type: ${type}`);
      return { success: false, error: 'Unknown notification type' };
    }

    const subject = template.subject.replace('#{orderId}', data.orderId || data.checkoutId || '');
    const body = template.html(data);

    const logId = idGenerator();
    const now = nowProvider();

    // Create log entry
    const logEntry = {
      id: logId,
      userId,
      email,
      type,
      channel: 'email',
      subject,
      body,
      relatedEntityId,
      relatedEntityType,
      status: 'pending',
      createdAt: now.toISOString(),
    };

    await notificationLogsRepository.create(logEntry);

    try {
      // Send the email
      const result = await emailService.sendTransactionalEmail({
        to: email,
        subject,
        html: body,
      });

      if (result.skipped) {
        await notificationLogsRepository.updateStatus(logId, 'skipped');
        return { success: true, skipped: true, logId };
      }

      await notificationLogsRepository.updateStatus(logId, 'sent', now.toISOString());
      return { success: true, logId };
    } catch (error) {
      console.error(`[NOTIFICATION] Failed to send ${type} to ${email}:`, error.message);
      await notificationLogsRepository.updateStatus(logId, 'failed', null, error.message);
      return { success: false, error: error.message, logId };
    }
  }

  // Convenience methods for each notification type
  async function notifyPaymentSubmitted({ userId, email, checkoutId, amount, currency, paymentMethod }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.PAYMENT_SUBMITTED,
      data: { checkoutId, amount, currency, paymentMethod },
      relatedEntityId: checkoutId,
      relatedEntityType: 'checkout',
    });
  }

  async function notifyAdminPaymentSubmitted({
    paymentId,
    checkoutId,
    cartId,
    amount,
    currency,
    paymentMethod,
    proofReference,
    customerName,
    customerEmail,
    customerPhone,
    submittedAt,
  }) {
    return sendNotification({
      userId: null, // Admin notification, no specific user
      email: adminEmail,
      type: NOTIFICATION_TYPES.ADMIN_PAYMENT_SUBMITTED,
      data: {
        paymentId,
        checkoutId,
        cartId,
        amount,
        currency,
        paymentMethod,
        proofReference,
        customerName,
        customerEmail,
        customerPhone,
        submittedAt,
      },
      relatedEntityId: paymentId,
      relatedEntityType: 'payment',
    });
  }

  async function notifyOrderConfirmed({ userId, email, orderId, total, currency, items }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
      data: { orderId, total, currency, items },
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  async function notifyOrderProcessing({ userId, email, orderId }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.ORDER_PROCESSING,
      data: { orderId },
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  async function notifyOrderShipped({ userId, email, orderId, trackingNumber, carrier, shippingAddress }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.ORDER_SHIPPED,
      data: { orderId, trackingNumber, carrier, shippingAddress },
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  async function notifyOrderCompleted({ userId, email, orderId }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.ORDER_COMPLETED,
      data: { orderId },
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  async function notifyOrderCancelled({ userId, email, orderId, reason }) {
    return sendNotification({
      userId,
      email,
      type: NOTIFICATION_TYPES.ORDER_CANCELLED,
      data: { orderId, reason },
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  // Get notification logs for an entity
  async function getNotificationsForEntity(entityType, entityId) {
    return notificationLogsRepository.findByEntity(entityType, entityId);
  }

  async function getNotificationsForUser(userId) {
    return notificationLogsRepository.findByUserId(userId);
  }

  return {
    // Core method
    sendNotification,
    
    // Convenience methods
    notifyPaymentSubmitted,
    notifyAdminPaymentSubmitted,
    notifyOrderConfirmed,
    notifyOrderProcessing,
    notifyOrderShipped,
    notifyOrderCompleted,
    notifyOrderCancelled,
    
    // Query methods
    getNotificationsForEntity,
    getNotificationsForUser,
    
    // Constants
    NOTIFICATION_TYPES,
  };
}

module.exports = { createNotificationService, NOTIFICATION_TYPES };
