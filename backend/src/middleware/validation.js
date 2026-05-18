/**
 * Input Validation Middleware
 * Joi schemas for request validation
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

/**
 * Joi schema for spec submission
 */
const specSchema = Joi.object({
  spec: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .pattern(/[a-zA-Z]/) // Must contain letters
    .trim()
    .messages({
      'string.base': 'Specification must be a string',
      'string.empty': 'Specification cannot be empty',
      'string.min': 'Specification must be at least 10 characters',
      'string.max': 'Specification cannot exceed 5000 characters',
      'string.pattern.base': 'Specification must contain meaningful text',
      'any.required': 'Specification is required'
    })
});

/**
 * Joi schema for job ID parameter
 */
const jobIdSchema = Joi.object({
  jobId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid job ID format',
      'any.required': 'Job ID is required'
    })
});

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Extract error details
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      // Throw validation error
      throw new ValidationError(
        error.details[0].message, // Use first error as main message
        { fields: details }
      );
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
}

/**
 * Validate spec submission
 */
const validateSpec = validate(specSchema, 'body');

/**
 * Validate job ID parameter
 */
const validateJobId = validate(jobIdSchema, 'params');

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Middleware to sanitize all string inputs
 */
function sanitizeMiddleware(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  
  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    }
  }
  
  next();
}

module.exports = {
  validate,
  validateSpec,
  validateJobId,
  sanitizeMiddleware,
  schemas: {
    specSchema,
    jobIdSchema
  }
};

// Made with Bob
