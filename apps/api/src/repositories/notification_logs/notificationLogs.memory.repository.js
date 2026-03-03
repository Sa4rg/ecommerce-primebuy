/**
 * In-Memory NotificationLogs Repository
 * 
 * For testing and development without a database.
 */

class InMemoryNotificationLogsRepository {
  constructor() {
    this.logs = new Map();
  }

  async create(log) {
    this.logs.set(log.id, { ...log });
    return log;
  }

  async findById(id) {
    return this.logs.get(id) || null;
  }

  async findByUserId(userId) {
    return Array.from(this.logs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findByEntity(entityType, entityId) {
    return Array.from(this.logs.values())
      .filter(
        (log) =>
          log.relatedEntityType === entityType &&
          log.relatedEntityId === entityId
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async updateStatus(id, status, sentAt = null, errorMessage = null) {
    const log = this.logs.get(id);
    if (!log) return null;
    
    log.status = status;
    if (sentAt) log.sentAt = sentAt;
    if (errorMessage) log.errorMessage = errorMessage;
    
    return log;
  }

  async findAll(options = {}) {
    let results = Array.from(this.logs.values());
    
    if (options.type) {
      results = results.filter((log) => log.type === options.type);
    }
    
    if (options.status) {
      results = results.filter((log) => log.status === options.status);
    }
    
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  // Test helper: clear all logs
  clear() {
    this.logs.clear();
  }
}

module.exports = InMemoryNotificationLogsRepository;
