/**
 * Script de prueba para verificar integración Lambda + WhatsApp
 * 
 * Ejecutar: node test-lambda-whatsapp.js
 */

const { invokeLambda } = require('../lambdaClient');

async function testLambdaWhatsApp() {
  console.log('🧪 Iniciando prueba de Lambda + WhatsApp...\n');

  const testPayload = {
    productName: 'Smartwatch Serie Y13 (PRUEBA)',
    stock: 1
  };

  const functionArn = process.env.AWS_LAMBDA_INVENTORY_ALERT_ARN;

  if (!functionArn) {
    console.error('❌ AWS_LAMBDA_INVENTORY_ALERT_ARN no está configurado en .env');
    process.exit(1);
  }

  console.log('📦 Payload de prueba:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n📡 Invocando Lambda...\n');

  try {
    const result = await invokeLambda(functionArn, testPayload);

    console.log('✅ Lambda ejecutada exitosamente\n');
    console.log('📄 Respuesta:');
    console.log(JSON.stringify(result, null, 2));

    if (result.statusCode === 200) {
      console.log('\n🎉 ¡ÉXITO! Revisa tu WhatsApp, deberías recibir la alerta.');
    } else {
      console.log('\n⚠️ La Lambda respondió pero con error. Revisa CloudWatch logs.');
    }
  } catch (error) {
    console.error('\n❌ Error al invocar Lambda:');
    console.error(error.message);
    
    if (error.message.includes('credential')) {
      console.log('\n💡 Tip: Verifica tus credenciales AWS en el .env');
    }
    process.exit(1);
  }
}

// Ejecutar test
testLambdaWhatsApp()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la prueba:', error);
    process.exit(1);
  });
