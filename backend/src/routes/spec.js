/**
 * Spec Submission Routes
 * Handles specification submission and job creation
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { createJob } = require('../services/jobStore');
const { runPipeline } = require('../services/pipeline');
const { validateSpec } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/spec:
 *   post:
 *     summary: Submit a feature specification
 *     description: Creates a new job to process the specification and generate a pull request
 *     tags:
 *       - Specifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - spec
 *             properties:
 *               spec:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 description: Feature specification describing what to build
 *                 example: "Add JWT authentication with login endpoint and protected routes"
 *     responses:
 *       202:
 *         description: Job created successfully and processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique job identifier for tracking
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 status:
 *                   type: string
 *                   enum: [queued]
 *                   example: "queued"
 *                 message:
 *                   type: string
 *                   example: "Job created successfully. Use the jobId to track progress."
 *       400:
 *         description: Invalid specification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
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
router.post('/', validateSpec, asyncHandler(async (req, res) => {
  const { spec } = req.body;

  // Generate unique job ID
  const jobId = uuidv4();

  // Create job in store
  const job = createJob(jobId, spec);

  // Log job creation
  logger.info('Job created', {
    jobId: job.id,
    specLength: spec.length,
    requestId: req.id
  });

  // Start pipeline asynchronously (don't await)
  runPipeline(job).catch(error => {
    logger.error('Pipeline execution failed', {
      jobId: job.id,
      error: error.message,
      requestId: req.id
    });
  });

  // Return immediate response
  return res.status(202).json({
    success: true,
    jobId: job.id,
    status: job.status,
    message: 'Job created successfully. Use the jobId to track progress.'
  });
}));

module.exports = router;

// Made with Bob
