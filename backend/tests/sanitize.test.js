const { sanitizeForLogging } = require('../src/utils/sanitize');

describe('Sanitize Utility', () => {
  describe('sanitizeForLogging', () => {
    it('should redact authorization headers', () => {
      const data = {
        headers: {
          authorization: 'Bearer secret-token-12345',
          'content-type': 'application/json'
        }
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.headers.authorization).toBe('[REDACTED]');
      expect(sanitized.headers['content-type']).toBe('application/json');
    });

    it('should redact API keys and tokens', () => {
      const data = {
        apiKey: 'sk-1234567890abcdef',
        token: 'ghp_1234567890abcdef',
        password: 'super-secret',
        publicData: 'visible'
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.publicData).toBe('visible');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John Doe',
          credentials: {
            password: 'secret-password',
            apiKey: 'secret-api-key'
          }
        }
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.user.name).toBe('John Doe');
      expect(sanitized.user.credentials.password).toBe('[REDACTED]');
      expect(sanitized.user.credentials.apiKey).toBe('[REDACTED]');
    });

    it('should not modify original object', () => {
      const original = {
        password: 'secret',
        username: 'john'
      };

      const sanitized = sanitizeForLogging(original);

      expect(original.password).toBe('secret');
      expect(sanitized.password).toBe('[REDACTED]');
    });
  });
});

// Made with Bob
