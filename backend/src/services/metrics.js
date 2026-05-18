const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const jobsTotal = new promClient.Counter({
  name: 'jobs_total',
  help: 'Total number of jobs created',
  labelNames: ['status']
});

const jobDuration = new promClient.Histogram({
  name: 'job_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['status'],
  buckets: [10, 30, 60, 120, 300, 600]
});

const pipelineStageCounter = new promClient.Counter({
  name: 'pipeline_stage_total',
  help: 'Total number of pipeline stages executed',
  labelNames: ['stage', 'status']
});

const activeJobs = new promClient.Gauge({
  name: 'active_jobs',
  help: 'Number of currently active jobs'
});

const redisConnectionStatus = new promClient.Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)'
});

const githubApiCalls = new promClient.Counter({
  name: 'github_api_calls_total',
  help: 'Total number of GitHub API calls',
  labelNames: ['endpoint', 'status']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(jobsTotal);
register.registerMetric(jobDuration);
register.registerMetric(pipelineStageCounter);
register.registerMetric(activeJobs);
register.registerMetric(redisConnectionStatus);
register.registerMetric(githubApiCalls);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
};

// Export metrics and functions
module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    jobsTotal,
    jobDuration,
    pipelineStageCounter,
    activeJobs,
    redisConnectionStatus,
    githubApiCalls
  }
};

// Made with Bob
