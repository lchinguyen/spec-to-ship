/**
 * Job Storage Service
 * Automatically uses Redis if available, falls back to in-memory storage
 */

const logger = require('../config/logger');

// Try to use Redis, fall back to in-memory if not available
let storage;
let storageType = 'memory';

try {
  const redisStorage = require('./jobStore.redis');
  
  // Test Redis connection
  redisStorage.initRedis();
  
  // Use Redis if REDIS_URL is configured
  if (process.env.REDIS_URL) {
    storage = redisStorage;
    storageType = 'redis';
    logger.info('Using Redis for job storage', { url: process.env.REDIS_URL });
  } else {
    throw new Error('REDIS_URL not configured, using in-memory storage');
  }
} catch (error) {
  logger.warn('Redis not available, using in-memory storage', { 
    reason: error.message 
  });
  
  // In-memory storage fallback
  const jobs = new Map();
  
  storage = {
    createJob: (id, spec) => {
      const job = {
        id,
        spec,
        status: 'queued',
        tasks: [],
        prUrl: null,
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      jobs.set(id, job);
      logger.debug('Job created in memory', { jobId: id });
      return Promise.resolve(job);
    },
    
    updateJob: (id, patch) => {
      const job = jobs.get(id);
      if (!job) {
        logger.warn('Job not found for update', { jobId: id });
        return Promise.resolve(null);
      }
      Object.assign(job, patch, { updatedAt: new Date().toISOString() });
      jobs.set(id, job);
      logger.debug('Job updated in memory', { jobId: id, status: job.status });
      return Promise.resolve(job);
    },
    
    getJob: (id) => {
      const job = jobs.get(id) || null;
      if (job) {
        logger.debug('Job retrieved from memory', { jobId: id, status: job.status });
      } else {
        logger.debug('Job not found in memory', { jobId: id });
      }
      return Promise.resolve(job);
    },
    
    deleteJob: (id) => {
      const deleted = jobs.delete(id);
      logger.debug('Job deleted from memory', { jobId: id, deleted });
      return Promise.resolve(deleted);
    },
    
    healthCheck: () => {
      return Promise.resolve(true);
    },
    
    closeConnection: () => {
      jobs.clear();
      logger.info('In-memory storage cleared');
      return Promise.resolve();
    },
    
    isRedisConnected: () => false
  };
}

/**
 * Create a new job
 * @param {string} id - Job ID
 * @param {string} spec - Specification text
 * @returns {Promise<Object>} Created job object
 */
async function createJob(id, spec) {
  return await storage.createJob(id, spec);
}

/**
 * Update a job
 * @param {string} id - Job ID
 * @param {Object} patch - Fields to update
 * @returns {Promise<Object|null>} Updated job object or null if not found
 */
async function updateJob(id, patch) {
  return await storage.updateJob(id, patch);
}

/**
 * Get a job by ID
 * @param {string} id - Job ID
 * @returns {Promise<Object|null>} Job object or null if not found
 */
async function getJob(id) {
  return await storage.getJob(id);
}

/**
 * Delete a job
 * @param {string} id - Job ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteJob(id) {
  return await storage.deleteJob(id);
}

/**
 * Health check for storage
 * @returns {Promise<boolean>} True if healthy
 */
async function healthCheck() {
  return await storage.healthCheck();
}

/**
 * Close storage connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  return await storage.closeConnection();
}

/**
 * Check if using Redis
 * @returns {boolean} True if using Redis
 */
function isUsingRedis() {
  return storageType === 'redis';
}

/**
 * Get storage type
 * @returns {string} 'redis' or 'memory'
 */
function getStorageType() {
  return storageType;
}

module.exports = {
  createJob,
  updateJob,
  getJob,
  deleteJob,
  healthCheck,
  closeConnection,
  isUsingRedis,
  getStorageType
};

// Made with Bob
