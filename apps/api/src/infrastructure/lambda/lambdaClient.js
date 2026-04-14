const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

/**
 * AWS Lambda client configuration
 * Configured once, reused across the app
 */
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Invoke a Lambda function
 * @param {string} functionArn - Full ARN of the Lambda function
 * @param {object} payload - Data to send to Lambda
 * @returns {Promise<object>} Lambda response
 */
async function invokeLambda(functionArn, payload) {
  const command = new InvokeCommand({
    FunctionName: functionArn,
    Payload: JSON.stringify(payload),
    InvocationType: "RequestResponse", // Synchronous invocation
  });

  const response = await lambdaClient.send(command);

  // Decode response
  const result = JSON.parse(new TextDecoder().decode(response.Payload));

  return result;
}

module.exports = {
  lambdaClient,
  invokeLambda,
};
