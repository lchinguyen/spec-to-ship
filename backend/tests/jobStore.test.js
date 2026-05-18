const jobStore = require('../src/services/jobStore');

describe('JobStore Service', () => {
  beforeEach(async () => {
    // Clear all jobs before each test
    const allJobs = await jobStore.getAllJobs();
    for (const job of allJobs) {
      await jobStore.deleteJob(job.id);
    }
  });

  describe('createJob', () => {
    it('should create a new job with initial status', async () => {
      const jobData = {
        specUrl: 'https://example.com/spec.pdf',
        repoUrl: 'https://github.com/user/repo'
      };

      const job = await jobStore.createJob(jobData);

      expect(job).toHaveProperty('id');
      expect(job.status).toBe('pending');
      expect(job.specUrl).toBe(jobData.specUrl);
      expect(job.repoUrl).toBe(jobData.repoUrl);
      expect(job).toHaveProperty('createdAt');
      expect(job).toHaveProperty('updatedAt');
    });

    it('should generate unique job IDs', async () => {
      const jobData = {
        specUrl: 'https://example.com/spec.pdf',
        repoUrl: 'https://github.com/user/repo'
      };

      const job1 = await jobStore.createJob(jobData);
      const job2 = await jobStore.createJob(jobData);

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', async () => {
      const jobData = {
        specUrl: 'https://example.com/spec.pdf',
        repoUrl: 'https://github.com/user/repo'
      };

      const createdJob = await jobStore.createJob(jobData);
      const retrievedJob = await jobStore.getJob(createdJob.id);

      expect(retrievedJob).toEqual(createdJob);
    });

    it('should return null for non-existent job', async () => {
      const job = await jobStore.getJob('non-existent-id');
      expect(job).toBeNull();
    });
  });

  describe('updateJob', () => {
    it('should update job status and data', async () => {
      const jobData = {
        specUrl: 'https://example.com/spec.pdf',
        repoUrl: 'https://github.com/user/repo'
      };

      const job = await jobStore.createJob(jobData);
      
      const updates = {
        status: 'processing',
        currentStage: 'parsing'
      };

      const updatedJob = await jobStore.updateJob(job.id, updates);

      expect(updatedJob.status).toBe('processing');
      expect(updatedJob.currentStage).toBe('parsing');
      expect(updatedJob.updatedAt).not.toBe(job.updatedAt);
    });

    it('should return null when updating non-existent job', async () => {
      const result = await jobStore.updateJob('non-existent-id', { status: 'completed' });
      expect(result).toBeNull();
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      const jobData1 = {
        specUrl: 'https://example.com/spec1.pdf',
        repoUrl: 'https://github.com/user/repo1'
      };
      const jobData2 = {
        specUrl: 'https://example.com/spec2.pdf',
        repoUrl: 'https://github.com/user/repo2'
      };

      await jobStore.createJob(jobData1);
      await jobStore.createJob(jobData2);

      const allJobs = await jobStore.getAllJobs();

      expect(allJobs).toHaveLength(2);
    });

    it('should return empty array when no jobs exist', async () => {
      const allJobs = await jobStore.getAllJobs();
      expect(allJobs).toEqual([]);
    });
  });

  describe('deleteJob', () => {
    it('should delete an existing job', async () => {
      const jobData = {
        specUrl: 'https://example.com/spec.pdf',
        repoUrl: 'https://github.com/user/repo'
      };

      const job = await jobStore.createJob(jobData);
      const deleted = await jobStore.deleteJob(job.id);

      expect(deleted).toBe(true);

      const retrievedJob = await jobStore.getJob(job.id);
      expect(retrievedJob).toBeNull();
    });

    it('should return false when deleting non-existent job', async () => {
      const deleted = await jobStore.deleteJob('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('health check', () => {
    it('should return healthy status', async () => {
      const health = await jobStore.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health).toHaveProperty('type');
    });
  });
});

// Made with Bob
