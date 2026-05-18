# Spec-to-Ship 🚀

> **Production-Hardening Branch** - Enterprise-ready version with comprehensive production improvements

**Spec-to-Ship** is an AI-powered software engineering workflow built for the IBM Bob Hackathon. It converts plain-English feature requests into structured engineering tasks and automatically opens GitHub pull requests.

This branch contains **post-hackathon production hardening improvements** that transform the prototype into an enterprise-ready application with comprehensive error handling, monitoring, testing, and deployment infrastructure.

---

## 🌟 What's New in Production-Hardening Branch

This branch adds **40+ production-ready features** across 4 phases:

### ✅ Phase 1: Critical Production Readiness
- **Environment Validation** - Startup checks for required configuration
- **Structured Logging** - Winston with JSON format, file/console transports, sensitive data sanitization
- **Error Handling** - Custom error classes, centralized middleware, consistent responses
- **Input Validation** - Joi schemas for all API inputs
- **Security** - CORS whitelist, rate limiting (10-20 req/15min)
- **Request Tracking** - UUID-based request IDs throughout lifecycle

### ✅ Phase 2: Reliability & Storage
- **Redis Storage** - Persistent job storage with automatic in-memory fallback
- **Retry Logic** - Exponential backoff for transient failures
- **Timeout Protection** - Configurable timeouts per operation type
- **Health Monitoring** - Dependency verification endpoints
- **Graceful Shutdown** - SIGTERM/SIGINT handling
- **Visual Progress** - Animated pipeline stages with real-time updates

### ✅ Phase 3: Developer Experience
- **Testing** - Jest infrastructure with 70% coverage threshold
- **Code Quality** - ESLint and Prettier for backend and frontend
- **Docker** - Complete containerization with docker-compose
- **Metrics** - Prometheus endpoint with comprehensive observability
- **Job History** - LocalStorage-based recent jobs (last 10)
- **Examples** - Pre-built specification templates

### ✅ Phase 4: Documentation & Polish
- **Production Docs** - Complete implementation documentation
- **Contributing Guide** - Comprehensive contribution guidelines
- **Demo Setup** - Step-by-step demo scenarios
- **Error Boundary** - React error boundary with dev/prod modes

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  IBM Bob    │
│   (React)   │      │  (Express)   │      │   Agent     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─────▶ Redis (Job Storage)
                            │
                            ├─────▶ GitHub API
                            │
                            └─────▶ Prometheus Metrics
```

### Core Workflow

1. **User Input** - Submit feature request via React frontend
2. **Pipeline Creation** - Backend creates tracked job with request ID
3. **AI Processing** - watsonx Orchestrate agents parse and structure tasks
4. **Code Generation** - IBM Bob generates implementation
5. **PR Creation** - GitHub API creates branch, commits, opens PR
6. **Monitoring** - Real-time progress, metrics, and health checks

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Redis (optional, falls back to in-memory)
- Docker & Docker Compose (for containerized deployment)
- GitHub Personal Access Token
- IBM Bob API credentials
- watsonx Orchestrate credentials

### Option 1: Docker Deployment (Recommended)

```bash
# Clone and navigate
git clone https://github.com/lchinguyen/spec-to-ship.git
cd spec-to-ship
git checkout production-hardening

# Create .env file
cat > .env << EOF
GITHUB_TOKEN=your_github_token
BOB_API_KEY=your_bob_api_key
BOB_API_URL=https://your-bob-api-url
ORCHESTRATE_URL=your_orchestrate_url
ORCHESTRATE_INSTANCE_ID=your_instance_id
ORCHESTRATE_AGENT_ID=your_agent_id
ORCHESTRATE_PR_AGENT_ID=your_pr_agent_id
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
EOF

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
open http://localhost:4173
```

### Option 2: Local Development

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Access application
open http://localhost:5173
```

---

## 📊 Monitoring & Observability

### Health Check
```bash
curl http://localhost:3000/health | jq
```

Returns service status and dependency health:
```json
{
  "status": "ok",
  "service": "spec-to-ship-backend",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "github": "healthy",
    "storage": {
      "type": "redis",
      "status": "healthy"
    }
  }
}
```

### Prometheus Metrics
```bash
curl http://localhost:3000/metrics
```

Available metrics:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `jobs_total` - Job creation by status
- `job_duration_seconds` - Job processing time
- `pipeline_stage_total` - Pipeline stage execution
- `active_jobs` - Current active jobs
- `redis_connection_status` - Redis health
- `github_api_calls_total` - GitHub API usage

### API Documentation
```bash
open http://localhost:3000/api-docs
```

Interactive Swagger UI with all API endpoints.

### Logs

Structured JSON logs with:
- Timestamps
- Request IDs
- Sanitized data (no credentials)
- Error stack traces (dev only)

```bash
# View logs
docker-compose logs -f backend

# Or locally
tail -f backend/logs/combined.log
```

---

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- jobStore.test.js

# Watch mode
npm test -- --watch
```

### Test Coverage
- Target: 70% coverage (branches, functions, lines, statements)
- Tests: jobStore, retry logic, sanitization
- Framework: Jest with supertest

---

## 🎨 Code Quality

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

---

## 🐳 Docker Services

### Services
- **backend** (port 3000) - Express API with health checks
- **frontend** (port 4173) - Nginx serving React app
- **redis** (port 6379) - Job storage with persistence

### Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Check status
docker-compose ps
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | Yes | - | GitHub Personal Access Token |
| `BOB_API_KEY` | Yes | - | IBM Bob API key |
| `BOB_API_URL` | Yes | - | IBM Bob API endpoint |
| `ORCHESTRATE_URL` | Yes | - | watsonx Orchestrate URL |
| `ORCHESTRATE_INSTANCE_ID` | Yes | - | Orchestrate instance ID |
| `ORCHESTRATE_AGENT_ID` | Yes | - | Spec parser agent ID |
| `ORCHESTRATE_PR_AGENT_ID` | Yes | - | PR description agent ID |
| `PORT` | No | 3000 | Backend server port |
| `NODE_ENV` | No | development | Environment mode |
| `REDIS_URL` | No | - | Redis connection URL |
| `LOG_LEVEL` | No | info | Logging level |
| `ALLOWED_ORIGINS` | No | * | CORS allowed origins |

### Rate Limiting
- Development: 20 requests per 15 minutes
- Production: 10 requests per 15 minutes

### Timeouts
- Spec parsing: 60 seconds
- Code generation: 300 seconds (5 minutes)
- PR creation: 120 seconds
- GitHub API: 30 seconds

---

## 📚 Documentation

- **[PRODUCTION_HARDENING.md](PRODUCTION_HARDENING.md)** - Complete implementation details
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[DEMO_SETUP.md](DEMO_SETUP.md)** - Demo scenarios and setup
- **[IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)** - Progress tracking
- **API Docs** - http://localhost:3000/api-docs

---

## 🎯 Key Features

### Frontend
- ✅ Error banner with dismissible alerts
- ✅ Job history with localStorage (last 10 jobs)
- ✅ Example specifications (3 templates)
- ✅ Visual progress indicators with animations
- ✅ Error boundary for crash recovery
- ✅ Responsive design

### Backend
- ✅ Environment validation on startup
- ✅ Structured logging with Winston
- ✅ Comprehensive error handling
- ✅ Input validation with Joi
- ✅ CORS whitelist and rate limiting
- ✅ Request ID tracking
- ✅ Redis with in-memory fallback
- ✅ Retry logic with exponential backoff
- ✅ Timeout protection
- ✅ Health checks
- ✅ Graceful shutdown
- ✅ Prometheus metrics

### Infrastructure
- ✅ Docker and docker-compose
- ✅ Multi-stage builds
- ✅ Health checks
- ✅ Non-root users
- ✅ Volume management

---

## 🔗 Links

- **Original Hackathon Submission**: [main branch](https://github.com/lchinguyen/spec-to-ship/tree/main)
- **Production Improvements**: [production-hardening branch](https://github.com/lchinguyen/spec-to-ship/tree/production-hardening)
- **Demo Target Repo**: [spec-to-ship-demo-target](https://github.com/lchinguyen/spec-to-ship-demo-target/pulls)
- **Video Demo**: [YouTube](https://youtu.be/D9c0wnX1vw4?si=yMuJSlpD_OvPfN6F)
- **Vercel Deployment**: [spec-to-ship-pied.vercel.app](https://spec-to-ship-pied.vercel.app/)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Development setup
- Code style
- Testing requirements
- Pull request process

---

