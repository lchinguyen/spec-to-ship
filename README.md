# Spec-to-Ship

**Spec-to-Ship** is an AI-powered software engineering workflow built for the IBM Bob Hackathon. It converts plain-English feature requests into structured engineering tasks and automatically opens GitHub pull requests.

The project demonstrates how **IBM Bob**, **watsonx Orchestrate**, and the **GitHub API** can work together to reduce repetitive engineering work and help developers move from idea to implementation faster.

---

## Core Features

Plain-English Feature Intake: 

Users submit natural-language software requirements through a React frontend interface

Example:

    > Add JWT login authentication with protected routes.

An engineer then has to manually convert that idea into:
- implementation tasks,
- affected files,
- acceptance criteria,
- code changes,
- documentation,
- and a pull request.

Spec-to-Ship automates this workflow.

---

## Demo Workflow

1. User enters a plain-English feature request in the frontend.
2. Backend creates a pipeline job.
3. watsonx Orchestrate agents define the task-decomposition workflow.
4. IBM Bob IDE is used as the repository-aware development partner to analyze, improve, and document the implementation.
5. Backend generates implementation artifacts.
6. GitHub API creates a branch, commits generated files, and opens a pull request.
7. Developer reviews the generated PR instead of starting from scratch.

---

## Architecture

Frontend
```text
    User submits feature request
```

   ↓
 
Backend
```text
      Node.js/Express pipeline processes request
```
 
   ↓

watsonx Orchestrate:
```text
     Spec Parser Agent: for task decomposition
     PR Description Agent: for pull request generation
```

   ↓
      
GitHub Automation:
```text
    Create branch
    Commit generated files
    Open pull request
```

   ↓
      
Demo repo `spec-to-ship-demo-target` Generated Pull Request

```

## IBM Bob IDE usage: 

Bob was used as the repository-aware development partner for this project.

- analyze the backend pipeline,
- explain how the system converts specs into pull requests,
- review the repository for production-readiness improvements,
- improve developer experience and demo clarity,
   generate README/documentation content.

Bob task session reports are included in:

```text
bob_sessions/
```

Included Bob session artifacts:

```text
bob_sessions/
├── bob-task-1-backend-pipeline-analysis.md
├── bob-task-2-production-readiness-improvements.md
└── bob-task-3-readme-generation.md
```

## IBM watsonx Orchestrate Agents

More details are store in docs/orchestrate-agents/

Spec Parser Agent:

     Converts feature specifications into structured JSON engineering task plans.
     
Example output includes:

- feature name
- summary
- implementation tasks
- acceptance criteria
- affected files

PR Description Agent:
 
      Generates professional GitHub pull request titles and summaries from engineering task lists.

## GitHub Automation

The backend pipeline processes these tasks and uses GitHub API through Octokit to:
- create a new branch,
- commit generated files,
- open a pull request in the live demo target repository (view PR for testing): https://github.com/lchinguyen/spec-to-ship-demo-target/pulls

The live demo shows a real pull request generated from a user-entered feature specification at the testing repo `spec-to-ship-demo-target`

Video Demo + voiceover explain: 

The project uses a React frontend where users submit software feature requests through a simple UI. The frontend sends requests to a Node.js/Express backend pipeline API that creates processing jobs and manages the engineering workflow. The frontend demo interacts directly with this backend workflow. When a user submits a feature request such as “Add JWT login authentication,” the backend generates a processing job and automatically creates a real GitHub pull request in the demo target repository. The live demo shows a complete end-to-end engineering workflow from plain-English specification to automated code contribution.

Custom watsonx Orchestrate agents define the AI planning layer. The Spec Parser Agent converts feature requests into structured JSON engineering tasks including implementation details, acceptance criteria, and affected files. The PR Description Agent generates professional GitHub pull request titles and summaries from generated task plans.

IBM Bob IDE was used throughout development as the repository-aware engineering assistant. Bob analyzed the backend architecture, reviewed production readiness, improved developer workflows, and generated technical documentation using full repository context. Exported Bob task session reports are included in the final repository as required by the hackathon guidelines.

The project demonstrates how IBM Bob IDE and watsonx Orchestrate can work together to reduce repetitive software engineering work and accelerate development workflows using AI-native tooling.

## Tech Stack

Frontend: React, Vite, Axios

Backend: Node.js,Express, Octokit, UUID, dotenv, CORS

AI/Automation: IBM Bob IDE, IBM watsonx Orchestrate, GitHub REST API

## Project structure

```text
spec-to-ship/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   └── orchestrate.js
│   │   ├── routes/
│   │   │   ├── jobs.js
│   │   │   └── spec.js
│   │   ├── services/
│   │   │   ├── bob.js
│   │   │   ├── github.js
│   │   │   ├── jobStore.js
│   │   │   └── pipeline.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PipelineStatus.jsx
│   │   │   ├── PRResult.jsx
│   │   │   └── SpecForm.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── bob_sessions/
├── docs/
│   └── orchestrate-agents/
└── README.md
```

## Local setup

1. Clone the repository
   
       git clone https://github.com/lchinguyen/spec-to-ship.git
       cd spec-to-ship
2. Backend setup:

       cd backend
       npm install
       node src/server.js

## Environment Confirgurtion (Github API + IBM Cloud API Key & watsonx Orchestrate Service Credentials)

Update .env with your own credentials:

    PORT=8080
    FRONTEND_URL=http://localhost:5173

     GITHUB_TOKEN=your_github_token
     GITHUB_OWNER=your_github_username
     GITHUB_REPO=spec-to-ship-demo-target
     GITHUB_BASE_BRANCH=main

     ORCHESTRATE_URL=your_orchestrate_url
     ORCHESTRATE_INSTANCE_ID=your_orchestrate_instance_id
     ORCHESTRATE_AGENT_ID=your_spec_parser_agent_id
     ORCHESTRATE_PR_AGENT_ID=your_pr_description_agent_id

Start backend:

    npm start

Backend runs at:

    http://localhost:8080
    
3. Frontend setup

In a second terminal:

     cd frontend
     npm install
     npm run dev

Frontend runs at:

    http://localhost:5173




