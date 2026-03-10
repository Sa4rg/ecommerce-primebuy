/**
 * Truncates a long ID (UUID, etc.) to a shorter display form.
 * @param {string|number|null|undefined} id - The ID to format
 * @param {number} length - Number of characters to show (default: 8)
 * @returns {string} The truncated ID or empty string if invalid
 */
export function formatShortId(id, length = 8) {
  if (id == null) return "";
  const str = String(id);
  if (!str) return "";
  return str.slice(0, length);
}
