/**
 * Redis-based Job Storage
 * Persistent job storage with automatic TTL cleanup
 */

const Redis = require('ioredis');
const logger = require('../config/logger');

// Redis client instance
let redisClient = null;
let isConnected = false;

// Job TTL (24 hours in seconds)
const JOB_TTL = 24 * 60 * 60;

/**
 * Initialize Redis connection
 */
function initRedis() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn('Redis connection retry', { attempt: times, delay });
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
  });

  // Connection event handlers
  redisClient.on('connect', () => {
    logger.info('Redis connecting...');
  });

  redisClient.on('ready', () => {
    isConnected = true;
    logger.info('Redis connected successfully', { url: redisUrl });
  });

  redisClient.on('error', (error) => {
    isConnected = false;
    logger.error('Redis connection error', { error: error.message });
  });

  redisClient.on('close', () => {
    isConnected = false;
    logger.warn('Redis connection closed');
  });

  redisClient.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  // Connect to Redis
  redisClient.connect().catch(error => {
    logger.error('Failed to connect to Redis', { error: error.message });
  });

  return redisClient;
}

/**
 * Get Redis key for a job
 * @param {string} id - Job ID
 * @returns {string} Redis key
 */
function getJobKey(id) {
  return `job:${id}`;
}

/**
 * Create a new job
 * @param {string} id - Job ID
 * @param {string} spec - Specification text
 * @returns {Promise<Object>} Created job object
 */
async function createJob(id, spec) {
  const client = initRedis();
  
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

  try {
    const key = getJobKey(id);
    await client.setex(key, JOB_TTL, JSON.stringify(job));
    
    logger.debug('Job created in Redis', { jobId: id, ttl: JOB_TTL });
    return job;
  } catch (error) {
    logger.error('Failed to create job in Redis', { 
      jobId: id, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Update a job
 * @param {string} id - Job ID
 * @param {Object} patch - Fields to update
 * @returns {Promise<Object|null>} Updated job object or null if not found
 */
async function updateJob(id, patch) {
  const client = initRedis();
  
  try {
    const key = getJobKey(id);
    const jobData = await client.get(key);
    
    if (!jobData) {
      logger.warn('Job not found for update', { jobId: id });
      return null;
    }

    const job = JSON.parse(jobData);
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    
    // Preserve TTL
    const ttl = await client.ttl(key);
    if (ttl > 0) {
      await client.setex(key, ttl, JSON.stringify(job));
    } else {
      await client.setex(key, JOB_TTL, JSON.stringify(job));
    }
    
    logger.debug('Job updated in Redis', { 
      jobId: id, 
      status: job.status,
      ttl: ttl > 0 ? ttl : JOB_TTL
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to update job in Redis', { 
      jobId: id, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Get a job by ID
 * @param {string} id - Job ID
 * @returns {Promise<Object|null>} Job object or null if not found
 */
async function getJob(id) {
  const client = initRedis();
  
  try {
    const key = getJobKey(id);
    const jobData = await client.get(key);
    
    if (!jobData) {
      logger.debug('Job not found in Redis', { jobId: id });
      return null;
    }

    const job = JSON.parse(jobData);
    logger.debug('Job retrieved from Redis', { jobId: id, status: job.status });
    
    return job;
  } catch (error) {
    logger.error('Failed to get job from Redis', { 
      jobId: id, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Delete a job
 * @param {string} id - Job ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteJob(id) {
  const client = initRedis();
  
  try {
    const key = getJobKey(id);
    const result = await client.del(key);
    
    logger.debug('Job deleted from Redis', { jobId: id, deleted: result > 0 });
    return result > 0;
  } catch (error) {
    logger.error('Failed to delete job from Redis', { 
      jobId: id, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Health check for Redis connection
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function healthCheck() {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
    return false;
  }
}

/**
 * Close Redis connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis connection closed');
  }
}

/**
 * Get connection status
 * @returns {boolean} True if connected
 */
function isRedisConnected() {
  return isConnected;
}

module.exports = {
  createJob,
  updateJob,
  getJob,
  deleteJob,
  healthCheck,
  closeConnection,
  isRedisConnected,
  initRedis
};

// Made with Bob
