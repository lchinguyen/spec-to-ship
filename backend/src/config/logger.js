/**
 * Structured Logging Configuration
 * Winston logger with file and console transports
 * Different log levels for development/production
 */

const winston = require('winston');
const { isProduction, isDevelopment } = require('./validate');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create transports based on environment
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: isDevelopment() ? consoleFormat : logFormat,
    level: process.env.LOG_LEVEL || (isDevelopment() ? 'debug' : 'info')
  })
);

// File transports (production only)
if (isProduction()) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Add request logging helper
logger.logRequest = (req, meta = {}) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...meta
  });
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: isDevelopment() ? error.stack : undefined,
    ...context
  });
};

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;

// Made with Bob
