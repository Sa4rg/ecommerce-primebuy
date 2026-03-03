/**
 * NotificationLogs Repository Factory
 * 
 * Creates the appropriate NotificationLogsRepository implementation based on environment.
 */

const { shouldUseMySQL } = require("./repository.provider");

function createNotificationLogsRepository() {
  if (shouldUseMySQL()) {
    const MySQLNotificationLogsRepository = require('../../repositories/notification_logs/notificationLogs.mysql.repository');
    return new MySQLNotificationLogsRepository();
  }

  const InMemoryNotificationLogsRepository = require('../../repositories/notification_logs/notificationLogs.memory.repository');
  return new InMemoryNotificationLogsRepository();
}

module.exports = { createNotificationLogsRepository };
