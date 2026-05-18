/**
 * Job Status Routes
 * Handles job status retrieval and tracking
 */

const express = require('express');

const { getJob } = require('../services/jobStore');
const { validateJobId } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job status
 *     description: Retrieves the current status and details of a job
 *     tags:
 *       - Jobs
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique job identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 spec:
 *                   type: string
 *                   example: "Add JWT authentication"
 *                 status:
 *                   type: string
 *                   enum: [queued, parsing, generating, assembling, creating_pr, done, failed]
 *                   example: "generating"
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Generated tasks from spec parsing
 *                 prUrl:
 *                   type: string
 *                   nullable: true
 *                   example: "https://github.com/owner/repo/pull/123"
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 currentStage:
 *                   type: integer
 *                   example: 2
 *                 totalStages:
 *                   type: integer
 *                   example: 4
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:jobId', validateJobId, asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Retrieve job from store
  const job = getJob(jobId);

  if (!job) {
    logger.warn('Job not found', {
      jobId,
      requestId: req.id
    });
    throw new NotFoundError('Job');
  }

  // Log job retrieval
  logger.debug('Job retrieved', {
    jobId: job.id,
    status: job.status,
    requestId: req.id
  });

  // Return job details
  return res.json(job);
}));

module.exports = router;

// Made with Bob
