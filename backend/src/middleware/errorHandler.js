/**
 * Error Handling Middleware
 * Centralized error handling with consistent response format
 */

const logger = require('../config/logger');
const { sanitizeError } = require('../utils/sanitize');
const { isDevelopment } = require('../config/validate');

/**
 * Custom Application Error class
 * Used for operational errors that should be handled gracefully
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client handling
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types for convenience
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, originalError) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalError: originalError?.message }
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error handler middleware
 * Catches all errors and sends consistent error responses
 */
function errorHandler(err, req, res, next) {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  
  // Handle specific error types
  if (err.name === 'ValidationError' && !err.isOperational) {
    // Mongoose/Joi validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    // MongoDB cast errors
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }
  
  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(err.details && { details: err.details }),
      ...(isDevelopment() && { stack: err.stack }),
      ...(req.id && { requestId: req.id })
    }
  };
  
  // Log error with sanitization
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    error: sanitizeError(err),
    userId: req.user?.id,
    ip: req.ip
  });
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: sanitizeError(error),
    fatal: true
  });
  
  // Give logger time to write, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: sanitizeError(reason),
    promise: promise.toString()
  });
});

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};

// Made with Bob
