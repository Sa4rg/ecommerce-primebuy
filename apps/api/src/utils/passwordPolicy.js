// passwordPolicy.js
// Centralized password validation rules

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_SPECIAL = true;

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validates password against policy rules
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["password_required"] };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push("password_min_length");
  }

  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("password_requires_uppercase");
  }

  if (PASSWORD_REQUIRES_SPECIAL && !SPECIAL_CHARS_REGEX.test(password)) {
    errors.push("password_requires_special");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIRES_UPPERCASE,
  PASSWORD_REQUIRES_SPECIAL,
};
