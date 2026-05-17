const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { createJob } = require('../services/jobStore');
const { runPipeline } = require('../services/pipeline');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { spec } = req.body;

    if (!spec || spec.trim().length < 10) {
      return res.status(400).json({
        error: 'Spec must be at least 10 characters'
      });
    }

    const jobId = uuidv4();
    const job = createJob(jobId, spec);

    runPipeline(job).catch(console.error);

    return res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;