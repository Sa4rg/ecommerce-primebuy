const { invokeLambda } = require("./lambdaClient");

/**
 * Send low stock alert via Lambda → WhatsApp
 * @param {object} productInfo - Product information
 * @param {string} productInfo.productId - Product ID
 * @param {string} productInfo.productName - Product name
 * @param {number} productInfo.currentStock - Current stock level
 * @returns {Promise<void>}
 */
async function sendLowStockAlert(productInfo) {
  const functionArn = process.env.AWS_LAMBDA_INVENTORY_ALERT_ARN;

  if (!functionArn) {
    console.warn("[Lambda] AWS_LAMBDA_INVENTORY_ALERT_ARN not configured, skipping alert");
    return;
  }

  try {
    const payload = {
      productName: productInfo.productName,
      stock: productInfo.currentStock,
    };

    console.log(`[Lambda] Sending low stock alert for product: ${productInfo.productName} (stock: ${productInfo.currentStock})`);

    const result = await invokeLambda(functionArn, payload);

    console.log("[Lambda] Alert sent successfully:", result);
  } catch (error) {
    // ⚠️ No lanzamos error para no romper el flujo principal
    // El decremento de stock debe completarse aunque falle la notificación
    console.error("[Lambda] Failed to send low stock alert:", error.message);
  }
}

module.exports = {
  sendLowStockAlert,
};
