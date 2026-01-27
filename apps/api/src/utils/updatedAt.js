/**
 * Generate next updatedAt timestamp
 * 
 * Returns a new ISO timestamp. If the new timestamp equals the previous one,
 * returns previousUpdatedAt + 1ms to ensure monotonic progression.
 * 
 * @param {string} previousUpdatedAt - Previous ISO timestamp
 * @returns {string} New ISO timestamp
 */
function nextUpdatedAt(previousUpdatedAt) {
  const next = new Date().toISOString();
  if (next !== previousUpdatedAt) return next;
  return new Date(Date.parse(previousUpdatedAt) + 1).toISOString();
}

module.exports = { nextUpdatedAt };
