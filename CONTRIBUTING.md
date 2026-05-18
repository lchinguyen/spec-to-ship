# Contributing to Spec-to-Ship

Thank you for your interest in contributing to Spec-to-Ship! This document provides guidelines and instructions for contributing to this project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- Redis (optional, for local development)
- Git
- GitHub account

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/spec-to-ship.git
   cd spec-to-ship
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit .env with your credentials
   
   # Frontend
   cp frontend/.env.development.example frontend/.env.development
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 📝 Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

Example: `feature/add-webhook-support`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add webhook notification support

fix(frontend): resolve job history loading issue

docs(readme): update installation instructions

test(pipeline): add integration tests for PR creation
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- jobStore.test.js

# Watch mode
npm test -- --watch
```

### Writing Tests

- Place tests in `backend/tests/` directory
- Name test files as `*.test.js`
- Follow existing test patterns
- Aim for 70%+ coverage
- Test both success and error cases

**Example test structure:**
```javascript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
    
    it('should handle error case', async () => {
      // Test error handling
    });
  });
});
```

## 🎨 Code Style

### Linting and Formatting

```bash
# Backend
cd backend
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code
npm run format:check  # Check formatting

# Frontend
cd frontend
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Style Guidelines

**JavaScript/Node.js:**
- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use async/await over callbacks
- Add JSDoc comments for functions
- Keep functions small and focused
- Use meaningful variable names

**React:**
- Use functional components with hooks
- Keep components small and reusable
- Use prop-types or TypeScript for type checking
- Follow React best practices

**General:**
- Maximum line length: 100 characters
- Use 2 spaces for indentation
- Add comments for complex logic
- Remove console.logs before committing

## 📚 Documentation

### Code Documentation

Add JSDoc comments for all exported functions:

```javascript
/**
 * Retries an operation with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.initialDelay - Initial delay in ms
 * @returns {Promise<any>} Result of the operation
 * @throws {Error} If max retries exceeded
 */
async function retryWithBackoff(operation, options) {
  // Implementation
}
```

### README Updates

When adding features:
1. Update relevant sections in README.md
2. Add usage examples
3. Update configuration documentation
4. Add to feature list if applicable

## 🔍 Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Check code quality**
   ```bash
   npm run lint
   npm run format:check
   ```

4. **Update documentation**
   - Update README if needed
   - Add/update JSDoc comments
   - Update CHANGELOG if applicable

### Submitting a PR

1. **Push your changes**
   ```bash
   git push origin your-branch
   ```

2. **Create Pull Request**
   - Go to GitHub and create a PR
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link related issues

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Updated existing tests
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Delete your branch after merge

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test on latest version

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., macOS 12.0]
- Node version: [e.g., 20.0.0]
- Browser: [e.g., Chrome 120]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Mockups, examples, or other context
```

## 🏗️ Architecture Guidelines

### Backend Structure

```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
└── tests/            # Test files
```

### Frontend Structure

```
frontend/
└── src/
    ├── components/   # React components
    ├── hooks/        # Custom hooks
    └── pages/        # Page components
```

### Adding New Features

1. **Backend Service**
   - Create service in `src/services/`
   - Add tests in `tests/`
   - Export from service file

2. **API Endpoint**
   - Add route in `src/routes/`
   - Add validation schema
   - Add Swagger documentation
   - Add error handling

3. **Frontend Component**
   - Create component in `src/components/`
   - Add styles (CSS file or inline)
   - Add prop validation
   - Keep components small

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@example.com
2. Include detailed description
3. Provide steps to reproduce
4. Allow time for fix before disclosure

### Security Best Practices

- Never commit credentials
- Sanitize all user inputs
- Use environment variables for secrets
- Follow OWASP guidelines
- Keep dependencies updated

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an issue
- **Chat**: Join our Discord (if available)
- **Email**: support@example.com

## 🎯 Good First Issues

Look for issues labeled `good-first-issue` - these are great for new contributors!

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Spec-to-Ship! 🚀