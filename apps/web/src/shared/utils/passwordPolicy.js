// passwordPolicy.js
// Centralized password validation rules (frontend - same as backend)

const PASSWORD_MIN_LENGTH = 8;
const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * Validates password against policy rules
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["password_required"] };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push("password_min_length");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("password_requires_uppercase");
  }

  if (!SPECIAL_CHARS_REGEX.test(password)) {
    errors.push("password_requires_special");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { PASSWORD_MIN_LENGTH };
