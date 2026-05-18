# Phase 1 Quick Start Guide

## 🚀 Testing Your Production-Ready Backend

### Prerequisites
- Node.js 18+ installed
- All environment variables configured in `backend/.env`

### Step 1: Install Dependencies (Already Done)
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and fill in your actual values
# Required variables:
# - GITHUB_TOKEN
# - GITHUB_OWNER
# - GITHUB_REPO
# - WATSONX_API_KEY
# - WATSONX_PROJECT_ID
# - ORCHESTRATE_URL
# - ORCHESTRATE_INSTANCE_ID
# - ORCHESTRATE_AGENT_ID
```

### Step 3: Start the Backend
```bash
npm start
```

You should see:
```
✓ Environment validation passed
✓ Node environment: development
✓ Port: 8080
✓ All 8 required variables configured

🚀 Server running on port 8080
📚 API Documentation: http://localhost:8080/api-docs
💚 Health Check: http://localhost:8080/health
```

### Step 4: Test the Improvements

#### Test 1: Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "spec-to-ship-backend",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "uptime": 123.456
}
```

#### Test 2: API Documentation
Open in browser: `http://localhost:8080/api-docs`

You should see the Swagger UI with:
- POST /api/spec endpoint
- GET /api/jobs/{jobId} endpoint
- Interactive testing interface

#### Test 3: Input Validation
```bash
# Test with invalid spec (too short)
curl -X POST http://localhost:8080/api/spec \
  -H "Content-Type: application/json" \
  -d '{"spec": "short"}'
```

Expected response:
```json
{
  "success": false,
  "error": {
    "message": "Specification must be at least 10 characters",
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [...]
    }
  }
}
```

#### Test 4: Valid Spec Submission
```bash
curl -X POST http://localhost:8080/api/spec \
  -H "Content-Type: application/json" \
  -d '{"spec": "Add JWT authentication with login endpoint and protected routes"}'
```

Expected response:
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Job created successfully. Use the jobId to track progress."
}
```

#### Test 5: Job Status Retrieval
```bash
# Use the jobId from previous response
curl http://localhost:8080/api/jobs/550e8400-e29b-41d4-a716-446655440000
```

#### Test 6: Rate Limiting
```bash
# Send 11 requests quickly (limit is 10 per 15 minutes in production, 20 in dev)
for i in {1..11}; do
  curl -X POST http://localhost:8080/api/spec \
    -H "Content-Type: application/json" \
    -d '{"spec": "Test rate limiting with request '$i'"}' &
done
wait
```

The 11th request should return:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

#### Test 7: CORS Protection
```bash
# Test with unauthorized origin
curl -X POST http://localhost:8080/api/spec \
  -H "Content-Type: application/json" \
  -H "Origin: http://evil-site.com" \
  -d '{"spec": "Test CORS protection"}'
```

Should be blocked by CORS policy.

#### Test 8: Request ID Tracking
```bash
curl -v http://localhost:8080/health
```

Look for the response header:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

#### Test 9: Graceful Shutdown
1. Start the server: `npm start`
2. Press `Ctrl+C`
3. Observe the shutdown sequence:
```
⚠️  SIGINT received, shutting down gracefully...
✓ HTTP server closed
✓ Graceful shutdown completed
```

#### Test 10: Check Logs (Production Mode)
```bash
# Run in production mode
NODE_ENV=production npm start

# Check log files
cat logs/combined.log
cat logs/error.log
```

### Step 5: Test Frontend

```bash
cd ../frontend
npm run dev
```

Open `http://localhost:5173` and test:
1. Submit an invalid spec (< 10 characters) - should show error banner
2. Submit a valid spec - should create job
3. Dismiss error banner - should disappear
4. Check browser console for any errors

---

## 🎯 What to Look For

### ✅ Success Indicators
- Server starts without errors
- Environment validation passes
- All endpoints respond correctly
- Validation works as expected
- Rate limiting activates
- CORS blocks unauthorized origins
- Request IDs appear in headers
- Graceful shutdown works
- Logs are structured and sanitized
- Frontend displays errors properly

### ❌ Common Issues

#### Issue: "Missing required environment variables"
**Solution**: Copy `.env.example` to `.env` and fill in all required values

#### Issue: "Port 8080 is already in use"
**Solution**: Change PORT in `.env` or kill the process using port 8080

#### Issue: "CORS error in frontend"
**Solution**: Ensure FRONTEND_URL in backend `.env` matches your frontend URL

#### Issue: "Rate limit not working"
**Solution**: Check if you're in development mode (limit is 20 instead of 10)

---

## 📊 Monitoring

### Check Logs
```bash
# Development (console)
npm start

# Production (files)
NODE_ENV=production npm start
tail -f logs/combined.log
tail -f logs/error.log
```

### Log Format
```json
{
  "timestamp": "2024-01-15 10:30:00",
  "level": "info",
  "message": "Job created",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "abc-123-def-456"
}
```

---

## 🔧 Troubleshooting

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm start
```

### Test Individual Components
```javascript
// Test logger
const logger = require('./src/config/logger');
logger.info('Test message', { data: 'test' });

// Test validation
const { validateConfig } = require('./src/config/validate');
validateConfig();

// Test sanitization
const { sanitizeError } = require('./src/utils/sanitize');
console.log(sanitizeError(new Error('Test error')));
```

---

## 🎉 Success!

If all tests pass, you have successfully implemented Phase 1:
- ✅ Production-ready error handling
- ✅ Comprehensive logging
- ✅ Security hardening
- ✅ Input validation
- ✅ User-friendly errors
- ✅ API documentation
- ✅ Graceful shutdown

**Ready to proceed with Phase 2!**