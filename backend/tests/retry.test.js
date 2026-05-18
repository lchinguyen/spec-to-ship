const { retryWithBackoff, isRetryableError } = require('../src/utils/retry');

describe('Retry Utility', () => {
  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('Network error');
      networkError.code = 'ECONNRESET';
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ETIMEDOUT';
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify 5xx status codes as retryable', () => {
      const serverError = new Error('Server error');
      serverError.response = { status: 503 };
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('should identify 429 (rate limit) as retryable', () => {
      const rateLimitError = new Error('Rate limited');
      rateLimitError.response = { status: 429 };
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it('should not retry 4xx client errors (except 429)', () => {
      const clientError = new Error('Bad request');
      clientError.response = { status: 400 };
      expect(isRetryableError(clientError)).toBe(false);
    });

    it('should not retry 404 errors', () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };
      expect(isRetryableError(notFoundError)).toBe(false);
    });

    it('should not retry authentication errors', () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      expect(isRetryableError(authError)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const clientError = new Error('Bad request');
      clientError.response = { status: 400 };
      const operation = jest.fn().mockRejectedValue(clientError);

      await expect(
        retryWithBackoff(operation, {
          maxRetries: 3,
          initialDelay: 10
        })
      ).rejects.toThrow('Bad request');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ECONNRESET';
      const operation = jest.fn().mockRejectedValue(networkError);

      await expect(
        retryWithBackoff(operation, {
          maxRetries: 2,
          initialDelay: 10
        })
      ).rejects.toThrow('Network error');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000
      });

      const duration = Date.now() - startTime;
      
      // Should take at least 100ms (first retry) + 200ms (second retry) = 300ms
      expect(duration).toBeGreaterThanOrEqual(250); // Allow some margin
    });

    it('should respect max delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 500 // Max delay is less than initial delay
      });

      const duration = Date.now() - startTime;
      
      // Should cap at maxDelay for both retries: 500ms + 500ms = 1000ms
      expect(duration).toBeLessThan(1500);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const operation = jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { code: 'ECONNRESET' }))
        .mockResolvedValue('success');

      await retryWithBackoff(operation, {
        maxRetries: 2,
        initialDelay: 10,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      );
    });
  });
});

// Made with Bob
