/**
 * Log Sanitization Utilities
 * Removes sensitive data (tokens, API keys, passwords) from logs
 */

// List of sensitive field names to redact
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'auth',
  'credentials',
  'GITHUB_TOKEN',
  'WATSONX_API_KEY',
  'ORCHESTRATE_API_KEY'
];

// Patterns to detect sensitive data in strings
const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w-]+/gi,           // Bearer tokens
  /ghp_[\w]+/gi,                  // GitHub personal access tokens
  /gho_[\w]+/gi,                  // GitHub OAuth tokens
  /ghs_[\w]+/gi,                  // GitHub server tokens
  /sk-[\w]+/gi,                   // API keys starting with sk-
  /apikey[\s:=]+[\w-]+/gi,        // API key patterns
];

/**
 * Sanitizes an object by removing or redacting sensitive fields
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {any} Sanitized object
 */
function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) return '[Max Depth Reached]';
  
  // Handle null/undefined
  if (obj === null || obj === undefined) return obj;
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if field name is sensitive
    if (SENSITIVE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes a string by redacting sensitive patterns
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  let sanitized = str;
  
  // Replace sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}

/**
 * Sanitizes an error object for logging
 * @param {Error} error - Error to sanitize
 * @returns {Object} Sanitized error object
 */
function sanitizeError(error) {
  if (!error) return null;
  
  const sanitized = {
    message: sanitizeString(error.message || 'Unknown error'),
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    isOperational: error.isOperational
  };
  
  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development' && error.stack) {
    sanitized.stack = sanitizeString(error.stack);
  }
  
  // Sanitize any additional properties
  if (error.details) {
    sanitized.details = sanitizeObject(error.details);
  }
  
  if (error.response) {
    sanitized.response = {
      status: error.response.status,
      statusText: error.response.statusText,
      data: sanitizeObject(error.response.data)
    };
  }
  
  return sanitized;
}

/**
 * Sanitizes request object for logging
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request info
 */
function sanitizeRequest(req) {
  return {
    method: req.method,
    path: req.path,
    query: sanitizeObject(req.query),
    body: sanitizeObject(req.body),
    headers: sanitizeObject(req.headers),
    ip: req.ip,
    requestId: req.id
  };
}

module.exports = {
  sanitizeObject,
  sanitizeString,
  sanitizeError,
  sanitizeRequest,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS
};

// Made with Bob
