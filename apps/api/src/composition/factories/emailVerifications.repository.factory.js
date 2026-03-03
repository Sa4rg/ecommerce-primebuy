/**
 * Email Verifications Repository Factory
 * 
 * Creates the appropriate EmailVerificationsRepository implementation based on environment.
 */

const { shouldUseMySQL } = require("./repository.provider");

function createEmailVerificationsRepository() {
  if (shouldUseMySQL()) {
    const { MySQLEmailVerificationsRepository } = require("../../repositories/email_verifications/emailVerifications.mysql.repository");
    return new MySQLEmailVerificationsRepository();
  }

  const { InMemoryEmailVerificationsRepository } = require("../../repositories/email_verifications/emailVerifications.memory.repository");
  return new InMemoryEmailVerificationsRepository();
}

module.exports = { createEmailVerificationsRepository };
