/**
 * Secure Logger Utility
 * Sanitizes sensitive data before logging
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Sensitive keys that should be sanitized
 */
const SENSITIVE_KEYS = [
  'access_token',
  'refresh_token',
  'id_token',
  'idp_access_token',
  'idp_refresh_token',
  'token',
  'auth_token',
  'authorization',
  'password',
  'secret',
  'api_key',
  'apiKey',
  'client_secret',
  'clientSecret',
  'stripe_client_secret',
  'c_stripe_client_secret',
  'payment_intent_client_secret'
];

/**
 * Sanitize sensitive data from an object
 * @param {any} data - Data to sanitize
 * @param {number} depth - Current depth (to prevent infinite recursion)
 * @returns {any} Sanitized data
 */
function sanitizeData(data, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Max Depth Reached]';
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      // Sanitize sensitive values
      if (typeof value === 'string' && value.length > 0) {
        // Show first 4 and last 4 characters, mask the rest
        if (value.length <= 8) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeData(value, depth + 1);
      } else {
        sanitized[key] = '***';
      }
    } else {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Secure logger - only logs in development and sanitizes sensitive data
 */
export const logger = {
  /**
   * Log info message (only in development)
   */
  log: (...args) => {
    if (!isDevelopment) return;
    const sanitized = args.map(arg => sanitizeData(arg));
    // console.log(...sanitized);
  },

  /**
   * Log warning message (only in development)
   */
  warn: (...args) => {
    if (!isDevelopment) return;
    const sanitized = args.map(arg => sanitizeData(arg));
    // console.warn(...sanitized);
  },

  /**
   * Log error message (always logs, but sanitizes sensitive data)
   */
  error: (...args) => {
    const sanitized = args.map(arg => sanitizeData(arg));
    // console.error(...sanitized);
  },

  /**
   * Log debug message (only in development)
   */
  debug: (...args) => {
    if (!isDevelopment) return;
    const sanitized = args.map(arg => sanitizeData(arg));
    // console.debug(...sanitized);
  },

  /**
   * Log info message (always logs, but sanitizes sensitive data)
   * Use for important messages that should appear in production
   */
  info: (...args) => {
    const sanitized = args.map(arg => sanitizeData(arg));
    // console.info(...sanitized);
  }
};

/**
 * Check if logging is enabled (development mode)
 */
export const isLoggingEnabled = () => isDevelopment;

export default logger;

