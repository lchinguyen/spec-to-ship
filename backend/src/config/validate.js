/**
 * Environment Variable Validation
 * Validates all required environment variables on server startup
 * Prevents server from starting with invalid configuration
 */

const requiredEnvVars = [
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'WATSONX_API_KEY',
  'WATSONX_PROJECT_ID',
  'ORCHESTRATE_URL',
  'ORCHESTRATE_INSTANCE_ID',
  'ORCHESTRATE_AGENT_ID'
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'ALLOWED_ORIGINS',
  'REDIS_URL',
  'LOG_LEVEL'
];

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variables are missing
 */
function validateConfig() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
      `Please check your .env file or environment configuration.`
    );
  }

  // Log configuration status (without sensitive values)
  console.log('✓ Environment validation passed');
  console.log(`✓ Node environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Port: ${process.env.PORT || 8080}`);
  console.log(`✓ All ${requiredEnvVars.length} required variables configured`);
}

/**
 * Gets the current environment
 * @returns {'development' | 'production' | 'test'}
 */
function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Checks if running in production
 * @returns {boolean}
 */
function isProduction() {
  return getEnvironment() === 'production';
}

/**
 * Checks if running in development
 * @returns {boolean}
 */
function isDevelopment() {
  return getEnvironment() === 'development';
}

/**
 * Checks if running in test
 * @returns {boolean}
 */
function isTest() {
  return getEnvironment() === 'test';
}

module.exports = {
  validateConfig,
  getEnvironment,
  isProduction,
  isDevelopment,
  isTest,
  requiredEnvVars,
  optionalEnvVars
};

// Made with Bob
