Spec-to-Ship

Spec-to-Ship is an AI-powered software engineering workflow that converts plain-English feature requests into structured engineering tasks and automatically generates GitHub pull requests.

Built for the IBM Bob Hackathon, the project demonstrates how AI agents and repository-aware development tools can streamline the software delivery lifecycle — from product specification to implementation planning and automated code contribution workflows.

Problem:
Modern software teams spend significant time translating high-level product ideas into engineering tasks, coordinating implementation details, writing pull request summaries, and managing repetitive development workflows.

Spec-to-Ship reduces this friction by introducing an AI-native engineering pipeline that:

interprets feature specifications,
structures implementation plans,
generates development artifacts,
and automates GitHub pull request creation.

Architecture:
Frontend UI
    ↓
Backend Pipeline API
    ↓
watsonx Orchestrate Agents
    ↓
Task Decomposition + PR Generation
    ↓
GitHub API Automation
    ↓
Automated Pull Request Creation


Core Features
Plain-English Feature Intake

Users submit natural-language software requirements through a React frontend interface.

Example:

Add JWT login authentication with protected routes and session validation.

AI Task Decomposition

watsonx Orchestrate custom agents transform feature requests into structured engineering tasks, including:

implementation tasks,
affected files,
acceptance criteria,
and development context.
GitHub Pull Request Automation

The backend pipeline automatically:

creates branches,
commits generated implementation artifacts,
and opens GitHub pull requests.
Repository-Aware Development with IBM Bob

IBM Bob IDE was used as the repository-aware AI engineering assistant throughout development to:

analyze backend architecture,
review production readiness,
improve engineering workflows,
and generate technical documentation.
IBM watsonx Orchestrate Agents
Spec Parser Agent

Converts feature specifications into structured JSON engineering task plans.

PR Description Agent

Generates professional GitHub pull request titles and summaries from engineering task lists.

Agent evidence and screenshots are included in:

docs/orchestrate-agents/
IBM Bob IDE Usage

IBM Bob was used as the primary AI-assisted development environment for:

backend architecture analysis,
repository understanding,
engineering review,
developer workflow improvement,
and documentation generation.

Bob task session reports are included in:

docs/bob-session-reports/
Tech Stack
Frontend
React
Vite
Backend
Node.js
Express
AI & Automation
IBM Bob IDE
IBM watsonx Orchestrate
Integrations
GitHub REST API
Octokit
Example Workflow
User enters a feature request in the frontend UI.
Backend creates a processing job.
watsonx Orchestrate agents structure implementation tasks.
Backend generates implementation artifacts.
GitHub API creates a branch and commits generated files.
A pull request is automatically opened in GitHub.
Local Development
Backend
cd backend
npm install
node src/server.js

Backend runs on:

http://localhost:8080
Frontend
cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:5173
Demo Assets
Orchestrate Agents
docs/orchestrate-agents/
IBM Bob Session Reports
docs/bob-session-reports/
Future Improvements
Direct watsonx Orchestrate API integration
Multi-agent engineering workflows
CI/CD integration
Automatic code validation/testing
Real-time pipeline orchestration dashboard
Deployment automation with IBM Cloud Code Engine
Hackathon Notes

IBM Cloud provisioning permissions for additional watsonx project resources and Code Engine deployments were unavailable in this hackathon environment. The project is demonstrated locally while still integrating:

IBM Bob IDE,
watsonx Orchestrate agents,
and live GitHub pull request automation.
