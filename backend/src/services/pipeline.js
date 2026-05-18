/**
 * Pipeline Service
 * Orchestrates the entire spec-to-ship workflow with retry logic,
 * timeout protection, and comprehensive error handling
 */

const { updateJob } = require('./jobStore');
const { parseSpec, generatePRDescription } = require('../agents/orchestrate');
const { generateAll } = require('./bob');
const { createPullRequest } = require('./github');
const { retryOrchestrate, retryGitHubAPI, isRetryableError } = require('../utils/retry');
const { withPipelineStageTimeout, TimeoutError } = require('../utils/timeout');
const { sanitizeError } = require('../utils/sanitize');
const logger = require('../config/logger');

/**
 * Delay helper
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse specification with retry and timeout
 * @param {string} spec - Specification text
 * @returns {Promise<Object>} Parsed specification
 */
async function parseSpecWithRetry(spec) {
  return await retryOrchestrate(
    async () => {
      return await withPipelineStageTimeout(
        parseSpec(spec),
        'parse'
      );
    },
    { retries: 2 },
    'Parse specification'
  );
}

/**
 * Generate all outputs with retry and timeout
 * @param {Array} tasks - Tasks to generate
 * @returns {Promise<Array>} Generated outputs
 */
async function generateAllWithRetry(tasks) {
  return await retryOrchestrate(
    async () => {
      return await withPipelineStageTimeout(
        generateAll(tasks),
        'generating'
      );
    },
    { retries: 2 },
    'Generate code'
  );
}

/**
 * Generate PR description with retry and timeout
 * @param {string} summary - Summary text
 * @returns {Promise<Object>} PR description
 */
async function generatePRDescriptionWithRetry(summary) {
  return await retryOrchestrate(
    async () => {
      return await withPipelineStageTimeout(
        generatePRDescription(summary),
        'assembling'
      );
    },
    { retries: 2 },
    'Generate PR description'
  );
}

/**
 * Create pull request with retry and timeout
 * @param {Array} outputs - Generated outputs
 * @param {Object} prDescription - PR description
 * @returns {Promise<Object>} PR result
 */
async function createPullRequestWithRetry(outputs, prDescription) {
  return await retryGitHubAPI(
    async () => {
      return await withPipelineStageTimeout(
        createPullRequest(outputs, prDescription),
        'creating_pr'
      );
    },
    { retries: 3 },
    'Create pull request'
  );
}

/**
 * Run the complete pipeline
 * @param {Object} job - Job object
 * @returns {Promise<void>}
 */
async function runPipeline(job) {
  const startTime = Date.now();
  const totalStages = 4;
  
  logger.info('Pipeline started', {
    jobId: job.id,
    specLength: job.spec.length
  });

  try {
    // Stage 1: Parsing
    logger.info('Pipeline stage: parsing', { jobId: job.id, stage: 1, totalStages });
    await updateJob(job.id, {
      status: 'parsing',
      currentStage: 1,
      totalStages
    });
    
    const parsed = await parseSpecWithRetry(job.spec);
    await delay(1000);

    // Stage 2: Generating
    logger.info('Pipeline stage: generating', {
      jobId: job.id,
      stage: 2,
      totalStages,
      taskCount: parsed.tasks?.length || 0
    });
    
    await updateJob(job.id, {
      status: 'generating',
      currentStage: 2,
      totalStages,
      tasks: parsed.tasks
    });

    const outputs = await generateAllWithRetry(parsed.tasks);
    await delay(1000);

    // Stage 3: Assembling
    logger.info('Pipeline stage: assembling', {
      jobId: job.id,
      stage: 3,
      totalStages,
      outputCount: outputs?.length || 0
    });
    
    await updateJob(job.id, {
      status: 'assembling',
      currentStage: 3,
      totalStages,
      generatedFiles: outputs
    });

    const prDescription = await generatePRDescriptionWithRetry(
      parsed.summary || job.spec
    );

    // Stage 4: Creating PR
    logger.info('Pipeline stage: creating PR', {
      jobId: job.id,
      stage: 4,
      totalStages
    });
    
    await updateJob(job.id, {
      status: 'creating_pr',
      currentStage: 4,
      totalStages
    });

    const pr = await createPullRequestWithRetry(outputs, prDescription);
    await delay(1000);

    // Success
    const duration = (Date.now() - startTime) / 1000;
    
    logger.info('Pipeline completed successfully', {
      jobId: job.id,
      duration,
      prUrl: pr.prUrl
    });

    await updateJob(job.id, {
      status: 'done',
      prUrl: pr.prUrl,
      completedAt: new Date().toISOString(),
      duration
    });

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    // Determine error details
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Pipeline failed';
    const retryable = isRetryableError(error);
    const isTimeout = error instanceof TimeoutError;
    
    logger.error('Pipeline failed', {
      jobId: job.id,
      duration,
      error: sanitizeError(error),
      errorCode,
      retryable,
      isTimeout
    });

    // Update job with failure details
    await updateJob(job.id, {
      status: 'failed',
      error: errorMessage,
      errorCode,
      errorDetails: {
        retryable,
        isTimeout,
        stage: error.operation || 'unknown'
      },
      failedAt: new Date().toISOString(),
      duration
    });
  }
}

module.exports = {
  runPipeline
};

// Made with Bob
