/**
 * Timeout Protection Utilities
 * Prevents long-running operations from hanging indefinitely
 */

const logger = require('../config/logger');

/**
 * Timeout error class
 */
class TimeoutError extends Error {
  constructor(operation, timeoutMs) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.operation = operation;
    this.timeout = timeoutMs;
    this.code = 'TIMEOUT';
  }
}

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of operation for error message
 * @returns {Promise<any>} Result of promise or timeout error
 */
async function withTimeout(promise, timeoutMs, operationName = 'Operation') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      logger.warn(`${operationName} timed out`, {
        operation: operationName,
        timeout: timeoutMs
      });
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Timeout configuration for different operations
 */
const TIMEOUTS = {
  // API calls
  GITHUB_API: 30000,        // 30 seconds
  ORCHESTRATE_PARSE: 60000, // 60 seconds
  ORCHESTRATE_GENERATE: 120000, // 2 minutes
  WATSONX_API: 60000,       // 60 seconds
  
  // Database operations
  REDIS_OPERATION: 5000,    // 5 seconds
  
  // HTTP requests
  HTTP_REQUEST: 30000,      // 30 seconds
  
  // Pipeline stages
  PIPELINE_PARSE: 60000,    // 60 seconds
  PIPELINE_GENERATE: 180000, // 3 minutes
  PIPELINE_ASSEMBLE: 60000,  // 60 seconds
  PIPELINE_CREATE_PR: 30000, // 30 seconds
  
  // Total pipeline
  PIPELINE_TOTAL: 600000    // 10 minutes
};

/**
 * Wrap GitHub API call with timeout
 * @param {Promise} promise - GitHub API promise
 * @param {string} operation - Operation name
 * @returns {Promise<any>} Result or timeout error
 */
async function withGitHubTimeout(promise, operation = 'GitHub API call') {
  return await withTimeout(promise, TIMEOUTS.GITHUB_API, operation);
}

/**
 * Wrap Orchestrate call with timeout
 * @param {Promise} promise - Orchestrate promise
 * @param {string} operation - Operation name
 * @param {string} type - Type of operation ('parse' or 'generate')
 * @returns {Promise<any>} Result or timeout error
 */
async function withOrchestrateTimeout(promise, operation = 'Orchestrate call', type = 'parse') {
  const timeout = type === 'generate' ? TIMEOUTS.ORCHESTRATE_GENERATE : TIMEOUTS.ORCHESTRATE_PARSE;
  return await withTimeout(promise, timeout, operation);
}

/**
 * Wrap Redis operation with timeout
 * @param {Promise} promise - Redis promise
 * @param {string} operation - Operation name
 * @returns {Promise<any>} Result or timeout error
 */
async function withRedisTimeout(promise, operation = 'Redis operation') {
  return await withTimeout(promise, TIMEOUTS.REDIS_OPERATION, operation);
}

/**
 * Wrap HTTP request with timeout
 * @param {Promise} promise - HTTP request promise
 * @param {string} url - URL being requested
 * @returns {Promise<any>} Result or timeout error
 */
async function withHttpTimeout(promise, url = 'unknown') {
  return await withTimeout(promise, TIMEOUTS.HTTP_REQUEST, `HTTP request to ${url}`);
}

/**
 * Wrap pipeline stage with timeout
 * @param {Promise} promise - Pipeline stage promise
 * @param {string} stage - Stage name ('parse', 'generate', 'assemble', 'create_pr')
 * @returns {Promise<any>} Result or timeout error
 */
async function withPipelineStageTimeout(promise, stage) {
  const timeoutMap = {
    parse: TIMEOUTS.PIPELINE_PARSE,
    generating: TIMEOUTS.PIPELINE_GENERATE,
    assembling: TIMEOUTS.PIPELINE_ASSEMBLE,
    creating_pr: TIMEOUTS.PIPELINE_CREATE_PR
  };
  
  const timeout = timeoutMap[stage] || TIMEOUTS.HTTP_REQUEST;
  return await withTimeout(promise, timeout, `Pipeline stage: ${stage}`);
}

/**
 * Create an abortable promise with timeout
 * @param {Function} executor - Promise executor function
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Operation name
 * @returns {Object} Object with promise and abort function
 */
function createAbortablePromise(executor, timeoutMs, operationName = 'Operation') {
  let abortController;
  let timeoutId;
  
  const promise = new Promise((resolve, reject) => {
    abortController = {
      abort: () => {
        clearTimeout(timeoutId);
        reject(new TimeoutError(operationName, timeoutMs));
      }
    };
    
    timeoutId = setTimeout(() => {
      logger.warn(`${operationName} timed out`, {
        operation: operationName,
        timeout: timeoutMs
      });
      abortController.abort();
    }, timeoutMs);
    
    executor(resolve, reject, abortController);
  });
  
  return {
    promise,
    abort: () => abortController?.abort(),
    clearTimeout: () => clearTimeout(timeoutId)
  };
}

module.exports = {
  withTimeout,
  withGitHubTimeout,
  withOrchestrateTimeout,
  withRedisTimeout,
  withHttpTimeout,
  withPipelineStageTimeout,
  createAbortablePromise,
  TimeoutError,
  TIMEOUTS
};

// Made with Bob
