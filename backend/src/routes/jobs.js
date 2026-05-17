const express = require('express');

const { getJob } = require('../services/jobStore');

const router = express.Router();

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }

  return res.json(job);
});

module.exports = router;