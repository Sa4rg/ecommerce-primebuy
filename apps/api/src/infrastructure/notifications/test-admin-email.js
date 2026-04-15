/**
 * Quick test script to verify admin email notification functionality
 * Run with: node src/infrastructure/notifications/test-admin-email.js
 */

require('dotenv').config();
const { createNotificationService, NOTIFICATION_TYPES } = require('../../services/notification.service');
const emailService = require('../../services/email.service');

// Mock repository
const mockNotificationLogsRepository = {
  create: async (entry) => {
    console.log('[MOCK REPO] Creating log entry:', {
      id: entry.id,
      email: entry.email,
      type: entry.type,
      status: entry.status,
    });
    return entry;
  },
  updateStatus: async (id, status, sentAt, error) => {
    console.log('[MOCK REPO] Updating status:', { id, status, sentAt, error });
  },
};

async function testAdminEmail() {
  console.log('\n🧪 Testing Admin Payment Notification Email\n');
  console.log('Environment Variables:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- RESEND_FROM:', process.env.RESEND_FROM || '❌ Missing');
  console.log('- ADMIN_NOTIFICATION_EMAIL:', process.env.ADMIN_NOTIFICATION_EMAIL || 'cyaimport.c.a@gmail.com (default)');
  console.log('\n---\n');

  const notificationService = createNotificationService({
    notificationLogsRepository: mockNotificationLogsRepository,
    emailService,
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'cyaimport.c.a@gmail.com',
  });

  const testPaymentData = {
    paymentId: 'test-payment-123',
    checkoutId: 'test-checkout-456',
    cartId: 'test-cart-789',
    amount: '49.99',
    currency: 'USD',
    paymentMethod: 'zelle',
    proofReference: 'REF-123456',
    customerName: 'Carlos Test',
    customerEmail: 'customer@example.com',
    customerPhone: '+1234567890',
    submittedAt: new Date().toISOString(),
  };

  console.log('📧 Attempting to send admin notification...\n');
  console.log('Payment Data:', testPaymentData);
  console.log('\n---\n');

  try {
    const result = await notificationService.notifyAdminPaymentSubmitted(testPaymentData);
    
    console.log('\n✅ Result:', result);

    if (result.skipped) {
      console.log('\n⚠️  Email was SKIPPED (RESEND_API_KEY not configured)');
    } else if (result.success) {
      console.log('\n🎉 Email sent successfully!');
      console.log('Log ID:', result.logId);
    } else {
      console.log('\n❌ Email failed!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    console.error(error);
  }
}

testAdminEmail().catch(console.error);
