/**
 * Spec-to-Ship Backend Server
 * Production-ready Express server with comprehensive error handling,
 * logging, validation, and graceful shutdown
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import configuration and middleware
const { validateConfig, isProduction } = require('./config/validate');
const logger = require('./config/logger');
const { register: metricsRegister, metricsMiddleware } = require('./services/metrics');
const requestIdMiddleware = require('./middleware/requestId');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeMiddleware } = require('./middleware/validation');

// Import routes
const specRouter = require('./routes/spec');
const jobRouter = require('./routes/jobs');

// Validate environment variables before starting
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration validation failed:');
  console.error(error.message);
  process.exit(1);
}

const app = express();

// Trust proxy (for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Metrics middleware (track all requests)
app.use(metricsMiddleware);

// CORS configuration with whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeMiddleware);

// Rate limiting
const specLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction() ? 10 : 20, // Stricter in production
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.id
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        requestId: req.id
      }
    });
  }
});

// Swagger API documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Spec-to-Ship API',
      version: '1.0.0',
      description: 'AI-powered engineering workflow API that converts specifications into pull requests',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:8080',
        description: isProduction() ? 'Production' : 'Development'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                requestId: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Spec-to-Ship API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Health check endpoint with dependency verification
app.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    service: 'spec-to-ship-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    dependencies: {}
  };

  // Check GitHub API
  try {
    const { healthCheck: githubHealthCheck } = require('./services/github');
    const githubHealthy = await githubHealthCheck();
    checks.dependencies.github = githubHealthy ? 'healthy' : 'unhealthy';
    if (!githubHealthy) checks.status = 'degraded';
  } catch (error) {
    checks.dependencies.github = 'unhealthy';
    checks.status = 'degraded';
    logger.warn('GitHub health check failed', { error: error.message });
  }

  // Check Storage (Redis or in-memory)
  try {
    const { healthCheck: storageHealthCheck, getStorageType } = require('./services/jobStore');
    const storageHealthy = await storageHealthCheck();
    checks.dependencies.storage = {
      type: getStorageType(),
      status: storageHealthy ? 'healthy' : 'unhealthy'
    };
    if (!storageHealthy) checks.status = 'degraded';
  } catch (error) {
    checks.dependencies.storage = { type: 'unknown', status: 'unhealthy' };
    checks.status = 'degraded';
    logger.warn('Storage health check failed', { error: error.message });
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to generate metrics', { error: error.message });
    res.status(500).send('Failed to generate metrics');
  }
});

// API routes
app.use('/api/spec', specLimiter, specRouter);
app.use('/api/jobs', jobRouter);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Server instance
let server;

/**
 * Start the server
 */
function startServer() {
  const PORT = process.env.PORT || 8080;
  
  server = app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      allowedOrigins
    });
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error', { error: error.message });
      process.exit(1);
    }
  });
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, starting graceful shutdown`);
  console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      console.log('✓ HTTP server closed');
    });
  }

  // Wait for ongoing requests to complete (with timeout)
  const shutdownTimeout = setTimeout(() => {
    logger.warn('Shutdown timeout reached, forcing exit');
    console.log('⚠️  Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout

  try {
    // Close storage connections (Redis if used)
    const { closeConnection } = require('./services/jobStore');
    await closeConnection();
    logger.info('Storage connections closed');
    console.log('✓ Storage connections closed');
    
    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed');
    console.log('✓ Graceful shutdown completed\n');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

// Export for testing
module.exports = app;

// Made with Bob
