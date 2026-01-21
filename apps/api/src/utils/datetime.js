/**
 * DateTime Conversion Utilities
 * 
 * Centralized helpers for converting between domain timestamps (ISO 8601)
 * and MySQL DATETIME format.
 * 
 * Rules:
 * - Domain layer always uses ISO 8601 strings (e.g., "2026-01-21T10:00:00.000Z")
 * - MySQL always stores DATETIME format (e.g., "2026-01-21 10:00:00")
 * - All functions throw on invalid input
 */

/**
 * Convert ISO 8601 string to MySQL DATETIME format
 * 
 * @param {string} isoString - ISO 8601 timestamp (e.g., "2026-01-21T10:00:00.000Z")
 * @returns {string} MySQL DATETIME format (e.g., "2026-01-21 10:00:00")
 * @throws {TypeError} If input is not a string
 * @throws {Error} If input is not a valid ISO 8601 timestamp
 * 
 * @example
 * isoToMySQLDatetime("2026-01-21T10:00:00.000Z")
 * // => "2026-01-21 10:00:00"
 */
function isoToMySQLDatetime(isoString) {
  if (typeof isoString !== 'string') {
    throw new TypeError('isoToMySQLDatetime expects a string');
  }

  if (!isoString || isoString.trim().length === 0) {
    throw new Error('isoToMySQLDatetime expects a non-empty string');
  }

  // Validate ISO 8601 format by attempting to parse
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: ${isoString}`);
  }

  // Convert to MySQL DATETIME format: "YYYY-MM-DD HH:mm:ss"
  // Extract from ISO string by replacing 'T' with space and removing timezone/milliseconds
  const mysqlDatetime = isoString.replace('T', ' ').substring(0, 19);

  return mysqlDatetime;
}

/**
 * Convert MySQL DATETIME to ISO 8601 string
 * 
 * @param {string|Date} mysqlDatetime - MySQL DATETIME value (string or Date object)
 * @returns {string} ISO 8601 UTC timestamp (e.g., "2026-01-21T10:00:00.000Z")
 * @throws {TypeError} If input is not a string or Date
 * @throws {Error} If input cannot be parsed as a valid datetime
 * 
 * @example
 * mysqlDatetimeToISO("2026-01-21 10:00:00")
 * // => "2026-01-21T10:00:00.000Z"
 */
function mysqlDatetimeToISO(mysqlDatetime) {
  if (mysqlDatetime === null || mysqlDatetime === undefined) {
    throw new TypeError('mysqlDatetimeToISO expects a string or Date object');
  }

  if (typeof mysqlDatetime !== 'string' && !(mysqlDatetime instanceof Date)) {
    throw new TypeError('mysqlDatetimeToISO expects a string or Date object');
  }

  if (typeof mysqlDatetime === 'string' && mysqlDatetime.trim().length === 0) {
    throw new Error('mysqlDatetimeToISO expects a non-empty string');
  }

  // Attempt to parse the datetime
  const date = new Date(mysqlDatetime);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid datetime value: ${mysqlDatetime}`);
  }

  // Convert to ISO 8601 string
  return date.toISOString();
}

module.exports = {
  isoToMySQLDatetime,
  mysqlDatetimeToISO,
};
