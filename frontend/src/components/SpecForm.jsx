import { useState } from 'react';

const EXAMPLE_SPECS = [
  {
    title: 'Add User Authentication',
    spec: `# User Authentication Feature

## Overview
Implement JWT-based authentication system with login, logout, and token refresh capabilities.

## Requirements
- User login endpoint with email/password
- JWT token generation and validation
- Refresh token mechanism
- Logout functionality
- Password hashing with bcrypt
- Rate limiting on auth endpoints

## Technical Details
- Use Express middleware for auth
- Store tokens in HTTP-only cookies
- Implement token expiration (15min access, 7d refresh)
- Add authentication middleware for protected routes`
  },
  {
    title: 'REST API for Blog Posts',
    spec: `# Blog Post API

## Endpoints
- GET /api/posts - List all posts (with pagination)
- GET /api/posts/:id - Get single post
- POST /api/posts - Create new post (auth required)
- PUT /api/posts/:id - Update post (auth required)
- DELETE /api/posts/:id - Delete post (auth required)

## Data Model
- title (string, required)
- content (text, required)
- author (reference to User)
- tags (array of strings)
- createdAt, updatedAt (timestamps)

## Features
- Input validation with Joi
- Pagination (limit, offset)
- Search by title/content
- Filter by tags
- Sort by date/popularity`
  },
  {
    title: 'Real-time Chat Feature',
    spec: `# Real-time Chat System

## Features
- WebSocket-based real-time messaging
- Multiple chat rooms
- User presence indicators
- Message history
- Typing indicators
- Read receipts

## Technical Stack
- Socket.io for WebSocket
- Redis for pub/sub
- MongoDB for message persistence
- JWT for WebSocket authentication

## Requirements
- Handle 1000+ concurrent connections
- Message delivery guarantee
- Reconnection handling
- Rate limiting per user`
  }
];

export default function SpecForm({ onSubmit, loading }) {
  const [spec, setSpec] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!spec.trim()) return;

    onSubmit(spec);
  };

  const loadExample = (exampleSpec) => {
    setSpec(exampleSpec);
    setShowExamples(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Engineering Specification</h2>
        <button
          type="button"
          className="examples-toggle"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? '✕ Close' : '💡 Examples'}
        </button>
      </div>

      {showExamples && (
        <div className="examples-panel">
          <h3>Example Specifications</h3>
          <div className="examples-grid">
            {EXAMPLE_SPECS.map((example, index) => (
              <div key={index} className="example-card">
                <h4>{example.title}</h4>
                <pre className="example-preview">
                  {example.spec.substring(0, 150)}...
                </pre>
                <button
                  type="button"
                  onClick={() => loadExample(example.spec)}
                  className="load-example-btn"
                >
                  Use This Example
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          rows={12}
          placeholder="Describe the feature you want to generate...

Example:
# Feature Name
## Overview
Brief description of what you want to build

## Requirements
- Requirement 1
- Requirement 2

## Technical Details
Implementation specifics..."
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
        />

        <button type="submit" disabled={loading || !spec.trim()}>
          {loading ? 'Running Pipeline...' : 'Generate PR'}
        </button>
      </form>
    </div>
  );
}

// Made with Bob
