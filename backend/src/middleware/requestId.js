/**
 * Request ID Middleware
 * Generates unique request ID for each request
 * Adds to response headers and logs for traceability
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Request ID middleware
 * Generates or uses existing request ID from headers
 * Adds request ID to req object and response headers
 */
function requestIdMiddleware(req, res, next) {
  // Check if request ID already exists in headers
  // Common headers: X-Request-ID, X-Correlation-ID, X-Trace-ID
  const existingId = 
    req.get('X-Request-ID') ||
    req.get('X-Correlation-ID') ||
    req.get('X-Trace-ID');
  
  // Use existing ID or generate new one
  const requestId = existingId || uuidv4();
  
  // Attach to request object for use in handlers
  req.id = requestId;
  
  // Add to response headers for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Continue to next middleware
  next();
}

module.exports = requestIdMiddleware;

// Made with Bob
