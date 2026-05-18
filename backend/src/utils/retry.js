/**
 * Retry Logic Utilities
 * Provides retry functionality for external API calls with exponential backoff
 */

const retry = require('async-retry');
const logger = require('../config/logger');

/**
 * Default retry options
 */
const DEFAULT_OPTIONS = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 5000,
  factor: 2,
  randomize: true
};

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error should be retried
 */
function isRetryableError(error) {
  // Network errors
  const retryableCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'EPIPE',
    'EAI_AGAIN'
  ];
  
  // HTTP status codes that should be retried
  const retryableStatuses = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504  // Gateway Timeout
  ];
  
  // Check error code
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }
  
  // Check HTTP status
  if (error.response && retryableStatuses.includes(error.response.status)) {
    return true;
  }
  
  // Check status property directly
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }
  
  return false;
}

/**
 * Wrapper for async-retry with custom options and logging
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, options = {}, operationName = 'Operation') {
  const retryOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    onRetry: (error, attempt) => {
      logger.warn(`Retry attempt ${attempt} for ${operationName}`, {
        operation: operationName,
        attempt,
        error: error.message,
        code: error.code,
        status: error.status || error.response?.status
      });
      
      // Call custom onRetry if provided
      if (options.onRetry) {
        options.onRetry(error, attempt);
      }
    }
  };

  return await retry(
    async (bail, attempt) => {
      try {
        logger.debug(`Executing ${operationName}`, { attempt });
        const result = await fn(attempt);
        
        if (attempt > 1) {
          logger.info(`${operationName} succeeded after ${attempt} attempts`);
        }
        
        return result;
      } catch (error) {
        // Don't retry on client errors (4xx except 408, 429)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (![408, 429].includes(error.response.status)) {
            logger.warn(`${operationName} failed with client error, not retrying`, {
              status: error.response.status,
              error: error.message
            });
            bail(error);
            return;
          }
        }
        
        // Don't retry if error is not retryable
        if (!isRetryableError(error)) {
          logger.warn(`${operationName} failed with non-retryable error`, {
            error: error.message,
            code: error.code
          });
          bail(error);
          return;
        }
        
        // Throw to trigger retry
        throw error;
      }
    },
    retryOptions
  );
}

/**
 * Retry wrapper specifically for HTTP requests
 * @param {Function} requestFn - Function that makes HTTP request
 * @param {Object} options - Retry options
 * @param {string} url - URL being requested (for logging)
 * @returns {Promise<any>} Response from request
 */
async function retryHttpRequest(requestFn, options = {}, url = 'unknown') {
  return await withRetry(
    requestFn,
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      ...options
    },
    `HTTP request to ${url}`
  );
}

/**
 * Retry wrapper for GitHub API calls
 * @param {Function} githubFn - Function that calls GitHub API
 * @param {Object} options - Retry options
 * @param {string} operation - Operation name
 * @returns {Promise<any>} Result from GitHub API
 */
async function retryGitHubAPI(githubFn, options = {}, operation = 'GitHub API call') {
  return await withRetry(
    githubFn,
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 10000,
      ...options
    },
    operation
  );
}

/**
 * Retry wrapper for watsonx Orchestrate calls
 * @param {Function} orchestrateFn - Function that calls Orchestrate
 * @param {Object} options - Retry options
 * @param {string} operation - Operation name
 * @returns {Promise<any>} Result from Orchestrate
 */
async function retryOrchestrate(orchestrateFn, options = {}, operation = 'Orchestrate call') {
  return await withRetry(
    orchestrateFn,
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 10000,
      ...options
    },
    operation
  );
}

module.exports = {
  withRetry,
  retryHttpRequest,
  retryGitHubAPI,
  retryOrchestrate,
  isRetryableError,
  DEFAULT_OPTIONS
};

// Made with Bob
