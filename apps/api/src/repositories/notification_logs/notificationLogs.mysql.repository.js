/**
 * MySQL NotificationLogs Repository
 * 
 * Stores notification logs in the database for auditing.
 */

const db = require("../../db/knex");
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require("../../utils/datetime");

class MySQLNotificationLogsRepository {
  constructor() {
    this.db = db;
  }

  _toDb(log) {
    return {
      id: log.id,
      user_id: log.userId,
      email: log.email,
      type: log.type,
      channel: log.channel || 'email',
      subject: log.subject,
      body: log.body,
      related_entity_id: log.relatedEntityId,
      related_entity_type: log.relatedEntityType,
      status: log.status || 'pending',
      error_message: log.errorMessage,
      created_at: log.createdAt ? isoToMySQLDatetime(log.createdAt) : null,
      sent_at: log.sentAt ? isoToMySQLDatetime(log.sentAt) : null,
    };
  }

  _fromDb(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      type: row.type,
      channel: row.channel,
      subject: row.subject,
      body: row.body,
      relatedEntityId: row.related_entity_id,
      relatedEntityType: row.related_entity_type,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at ? mysqlDatetimeToISO(row.created_at) : null,
      sentAt: row.sent_at ? mysqlDatetimeToISO(row.sent_at) : null,
    };
  }

  async create(log) {
    await this.db('notification_logs').insert(this._toDb(log));
    return log;
  }

  async findById(id) {
    const row = await this.db('notification_logs').where({ id }).first();
    return this._fromDb(row);
  }

  async findByUserId(userId) {
    const rows = await this.db('notification_logs')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return rows.map((row) => this._fromDb(row));
  }

  async findByEntity(entityType, entityId) {
    const rows = await this.db('notification_logs')
      .where({
        related_entity_type: entityType,
        related_entity_id: entityId,
      })
      .orderBy('created_at', 'desc');
    return rows.map((row) => this._fromDb(row));
  }

  async updateStatus(id, status, sentAt = null, errorMessage = null) {
    const updates = { status };
    if (sentAt) updates.sent_at = isoToMySQLDatetime(sentAt);
    if (errorMessage) updates.error_message = errorMessage;

    await this.db('notification_logs').where({ id }).update(updates);
    return this.findById(id);
  }

  async findAll(options = {}) {
    let query = this.db('notification_logs').orderBy('created_at', 'desc');

    if (options.type) {
      query = query.where({ type: options.type });
    }

    if (options.status) {
      query = query.where({ status: options.status });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const rows = await query;
    return rows.map((row) => this._fromDb(row));
  }
}

module.exports = MySQLNotificationLogsRepository;
