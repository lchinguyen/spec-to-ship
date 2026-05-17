const { updateJob } = require('./jobStore');
const { parseSpec, generatePRDescription } = require('../agents/orchestrate');
const { generateAll } = require('./bob');
const { createPullRequest } = require('./github');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPipeline(job) {
  try {
    updateJob(job.id, { status: 'parsing' });
    const parsed = await parseSpec(job.spec);
    await delay(1000);

    updateJob(job.id, {
      status: 'generating',
      tasks: parsed.tasks
    });

    const outputs = await generateAll(parsed.tasks);
    await delay(1000);

    updateJob(job.id, {
      status: 'assembling',
      generatedFiles: outputs
    });

    const prDescription = await generatePRDescription(parsed.summary || job.spec);
    const pr = await createPullRequest(outputs, prDescription);

    await delay(1000);

    updateJob(job.id, {
      status: 'done',
      prUrl: pr.prUrl
    });

  } catch (error) {
    updateJob(job.id, {
      status: 'failed',
      error: error.message
    });
  }
}

module.exports = {
  runPipeline
};