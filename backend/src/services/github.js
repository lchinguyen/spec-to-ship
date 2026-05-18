/**
 * GitHub Service
 * Handles all GitHub API interactions with retry logic and timeout protection
 */

const { Octokit } = require('octokit');
const { retryGitHubAPI } = require('../utils/retry');
const { withGitHubTimeout } = require('../utils/timeout');
const logger = require('../config/logger');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main';

/**
 * Get base branch SHA with retry and timeout
 * @returns {Promise<string>} SHA of base branch
 */
async function getBaseSHA() {
  return await retryGitHubAPI(
    async () => {
      return await withGitHubTimeout(
        (async () => {
          logger.debug('Getting base branch SHA', { owner, repo, branch: baseBranch });
          
          const { data } = await octokit.rest.repos.getBranch({
            owner,
            repo,
            branch: baseBranch
          });
          
          logger.debug('Base branch SHA retrieved', { sha: data.commit.sha });
          return data.commit.sha;
        })(),
        'Get base branch SHA'
      );
    },
    {},
    'Get base branch SHA'
  );
}

/**
 * Create a new branch with retry and timeout
 * @param {string} branchName - Name of branch to create
 * @param {string} sha - SHA to branch from
 * @returns {Promise<void>}
 */
async function createBranch(branchName, sha) {
  return await retryGitHubAPI(
    async () => {
      return await withGitHubTimeout(
        (async () => {
          logger.debug('Creating branch', { branchName, sha });
          
          await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha
          });
          
          logger.info('Branch created', { branchName });
        })(),
        'Create branch'
      );
    },
    {},
    `Create branch ${branchName}`
  );
}

/**
 * Commit a file to a branch with retry and timeout
 * @param {string} branchName - Branch to commit to
 * @param {string} filePath - Path of file
 * @param {string} content - File content
 * @returns {Promise<void>}
 */
async function commitFile(branchName, filePath, content) {
  return await retryGitHubAPI(
    async () => {
      return await withGitHubTimeout(
        (async () => {
          let fileSHA;

          // Try to get existing file SHA
          try {
            logger.debug('Checking for existing file', { filePath, branchName });
            
            const { data } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: filePath,
              ref: branchName
            });

            fileSHA = data.sha;
            logger.debug('Existing file found', { filePath, sha: fileSHA });
          } catch (error) {
            // File doesn't exist, that's okay
            logger.debug('File does not exist, will create new', { filePath });
            fileSHA = undefined;
          }

          // Create or update file
          logger.debug('Committing file', { filePath, branchName, update: !!fileSHA });
          
          await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `feat: generate ${filePath} via Spec-to-Ship`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName,
            ...(fileSHA ? { sha: fileSHA } : {})
          });
          
          logger.info('File committed', { filePath, branchName });
        })(),
        'Commit file'
      );
    },
    {},
    `Commit file ${filePath}`
  );
}

/**
 * Open a pull request with retry and timeout
 * @param {string} branchName - Branch to create PR from
 * @param {string} title - PR title
 * @param {string} body - PR body
 * @returns {Promise<string>} PR URL
 */
async function openPR(branchName, title, body) {
  return await retryGitHubAPI(
    async () => {
      return await withGitHubTimeout(
        (async () => {
          logger.debug('Creating pull request', { branchName, title });
          
          const { data } = await octokit.rest.pulls.create({
            owner,
            repo,
            title,
            body,
            head: branchName,
            base: baseBranch
          });
          
          logger.info('Pull request created', {
            prNumber: data.number,
            prUrl: data.html_url
          });
          
          return data.html_url;
        })(),
        'Create pull request'
      );
    },
    {},
    'Create pull request'
  );
}

/**
 * Create a complete pull request with all files
 * @param {Array} outputs - Generated file outputs
 * @param {Object} prDescription - PR title and body
 * @returns {Promise<Object>} PR result with URL
 */
async function createPullRequest(outputs, prDescription) {
  const branchName = `spec-to-ship/generated-${Date.now()}`;
  
  logger.info('Starting pull request creation', {
    branchName,
    fileCount: outputs.length
  });

  try {
    // Get base SHA
    const baseSHA = await getBaseSHA();

    // Create branch
    await createBranch(branchName, baseSHA);

    // Commit all files
    for (const output of outputs) {
      await commitFile(branchName, output.targetFile, output.content);
    }

    // Open PR
    const prUrl = await openPR(
      branchName,
      prDescription.title || 'feat: generated feature',
      prDescription.body || 'Generated by Spec-to-Ship.'
    );

    logger.info('Pull request creation completed', { prUrl, branchName });

    return { prUrl, branchName };
  } catch (error) {
    logger.error('Pull request creation failed', {
      branchName,
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

/**
 * Health check for GitHub API
 * @returns {Promise<boolean>} True if GitHub API is accessible
 */
async function healthCheck() {
  try {
    await withGitHubTimeout(
      octokit.rest.users.getAuthenticated(),
      'GitHub health check'
    );
    return true;
  } catch (error) {
    logger.error('GitHub health check failed', { error: error.message });
    return false;
  }
}

module.exports = {
  createPullRequest,
  healthCheck
};

// Made with Bob
