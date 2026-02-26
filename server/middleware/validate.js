// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const PASSWORD_MIN_LENGTH = 8;

/**
 * Validates password strength.
 * Returns null if valid, or an error message string.
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null; // valid
}

/**
 * Validates that a value is in an allowed set.
 * Returns the value if valid, or defaultVal if not.
 */
function validateEnum(value, allowed, defaultVal = null) {
  if (!value) return defaultVal;
  return allowed.includes(value) ? value : defaultVal;
}

/**
 * Validates an integer is within bounds.
 */
function validateInt(value, { min = 0, max = Infinity, fallback = 0 } = {}) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

module.exports = { validatePassword, validateEnum, validateInt, PASSWORD_MIN_LENGTH };
