const jobs = new Map();

function createJob(id, spec) {
  const job = {
    id,
    spec,
    status: 'queued',
    tasks: [],
    prUrl: null,
    error: null,
    createdAt: new Date().toISOString()
  };

  jobs.set(id, job);

  return job;
}

function updateJob(id, patch) {
  const job = jobs.get(id);

  if (!job) return null;

  Object.assign(job, patch);

  jobs.set(id, job);

  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

module.exports = {
  createJob,
  updateJob,
  getJob
};