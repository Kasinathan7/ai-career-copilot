# Technical Audit Report: AI Resume Assistant (7 Features)

**Generated:** 2026-01-25  
**Project:** AI Resume Assistant - MERN Stack Application with 7 Core Features  
**Auditor:** Senior Software Architect & Codebase Auditor  
**Version:** 2.0 (Updated with Coding Practice & Aptitude Assessment)

---

## 1. Project Overview

### Business Purpose
AI Resume Assistant is a comprehensive career development platform that uses AI to help users:
- Build and optimize resumes for ATS (Applicant Tracking System) compatibility
- Practice mock interviews with AI feedback
- Search and match job opportunities
- Receive personalized career guidance and role suggestions
- Track job applications and analyze match scores
- Practice coding problems with real-time execution
- Take aptitude assessments with adaptive difficulty

### Target Users
- Job seekers at all career levels (entry to executive)
- Career changers seeking guidance
- Professionals optimizing their resumes
- Students preparing for job market entry
- Developers practicing coding skills
- Candidates preparing for aptitude tests

### Core Workflows
1. **User Registration/Authentication** → JWT-based auth with optional guest access
2. **Resume Management** → Create, edit, version, and analyze resumes
3. **ATS Scoring** → Upload resume → AI analysis → Score breakdown → Improvement suggestions
4. **Chat Interface** → Main orchestrator bot routes to specialized bots
5. **Job Search** → Multi-source aggregation (Indeed, GitHub Jobs) → Match scoring → Application tracking
6. **Mock Interviews** → AI-generated questions → User responses → Feedback and scoring
7. **Coding Practice** → Problem selection → Code submission → Local execution → Results
8. **Aptitude Assessment** → Adaptive difficulty → Topic rotation → Performance tracking

### Runtime Environment
- **Backend:** Node.js server (Express.js) running on port 5002 (default, configurable)
- **Frontend:** React SPA (Vite) running on port 5173 (default)
- **Database:** MongoDB (local or cloud)
- **Real-time:** Socket.IO for live chat and notifications
- **Deployment:** Docker containers with docker-compose, or standalone Node.js

---

## 2. Tech Stack

### Languages
- **JavaScript (ES6+)** - Backend and frontend
- **JSX** - React component syntax

### Backend Frameworks/Libraries
- **Express.js 4.22.1** - Web framework
- **Mongoose 7.8.7** - MongoDB ODM
- **Socket.IO 4.8.1** - Real-time bidirectional communication
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcryptjs 2.4.3** - Password hashing
- **Winston 3.17.0** - Logging
- **Helmet 7.2.0** - Security headers
- **express-rate-limit 6.11.2** - Rate limiting
- **Multer 1.4.5** - File uploads
- **pdf-parse 1.1.1, pdfkit 0.17.2** - PDF processing
- **mammoth 1.11.0** - DOCX parsing
- **Axios 1.12.2** - HTTP client for external APIs
- **Joi 17.9.2** - Schema validation

### AI/ML Services
- **Groq AI** - Primary AI service (via `groqService.js`)
- **GroqAIService** - Wrapper service for AI operations
- **Model:** `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`)
- **OpenRouter Compatibility** - Supports OpenRouter API (aliased as OpenAI SDK)
- **Google Generative AI** - `@google/generative-ai` package present (may be for future use)

### Frontend Frameworks/Libraries
- **React 18.2.0** - UI framework
- **Material-UI (MUI) 5.18.0** - Component library
- **React Router 6.30.1** - Client-side routing
- **React Query 3.39.3** - Data fetching and caching
- **Socket.io-client 4.8.1** - Real-time client
- **Framer Motion 10.12.22** - Animations
- **React Hook Form 7.45.2** - Form management
- **Vite 4.4.5** - Build tool and dev server
- **react-pdf 10.1.0** - PDF rendering
- **jspdf 3.0.2** - PDF generation
- **html2canvas 1.4.1** - Screenshot generation

### Database
- **MongoDB 5.0+** - Document database
- **Mongoose** - ODM with schema validation

### Build Tools
- **Vite** - Frontend bundler and dev server
- **Node.js** - Backend runtime
- **npm** - Package manager

### Infrastructure Assumptions
- **Local Development:** MongoDB running locally or via Docker
- **Production:** Docker Compose with MongoDB, Redis (optional), Nginx reverse proxy
- **File Storage:** Local filesystem (`backend/uploads/`)
- **Redis:** Configured in docker-compose but usage not verified in codebase

---

## 3. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  Port: 5173                                                  │
│  - BotRouter (7-feature router)                             │
│  - Specialized Bot Components (7 features)                    │
│  - ChatInterface (Socket.IO client)                          │
└───────────────────────┬───────────────────────────────────────┘
                       │ HTTP/REST + WebSocket
┌───────────────────────▼───────────────────────────────────────┐
│              Backend API (Express.js)                          │
│  Port: 5002                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Routes Layer                                           │  │
│  │  - /api/v1/auth, /api/v1/chat, /api/v1/resumes, etc.  │  │
│  │  - /api/v1/coding, /api/v1/aptitude                    │  │
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Controllers Layer                                       │  │
│  │  - authController, chatController, resumeController     │  │
│  │  - codingController, aptitudeController                 │  │
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Services Layer                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  ChatbotService (Orchestrator)                    │  │  │
│  │  │  ├─ ATSScoringBot                                 │  │  │
│  │  │  ├─ ResumeBuilderBot                             │  │  │
│  │  │  ├─ MockInterviewBot                             │  │  │
│  │  │  ├─ JobSuggesterBot                              │  │  │
│  │  │  └─ JobSearchBot                                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  GroqAIService → GroqService                      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  SocketIOService (Real-time)                       │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  JobSourceManager                                  │  │  │
│  │  │  ├─ IndeedJobSource                               │  │  │
│  │  │  └─ GitHubJobSource                               │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  CodeExecutionService (Local execution)            │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  AptitudeService (Question management)              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Models Layer (Mongoose)                                  │  │
│  │  - User, Resume, ChatSession, JobSearch                   │  │
│  │  - CodingProblem, CodingSubmission                         │  │
│  │  - AptitudeQuestion, AptitudeSession                      │  │
│  └──────────────┬──────────────────────────────────────────┘  │
└─────────────────┼──────────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────────┐
│                    MongoDB                                     │
│  Port: 27017                                                   │
│  - ai-resume-assistant database                                │
└───────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
ai_resume-main/
├── backend/
│   ├── server.js                    # Entry point, Express app setup
│   ├── package.json
│   ├── .env                         # Environment variables (not in git)
│   ├── .env.example                 # Template for .env
│   ├── Dockerfile
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   ├── resumeController.js
│   │   │   ├── userController.js
│   │   │   ├── jobsController.js
│   │   │   ├── interviewController.js
│   │   │   ├── externalJobsController.js
│   │   │   ├── codingController.js      # NEW: Coding practice
│   │   │   └── aptitudeController.js     # NEW: Aptitude tests
│   │   ├── routes/                  # Route definitions
│   │   │   ├── index.js             # Main router aggregator
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   ├── resumes.js
│   │   │   ├── users.js
│   │   │   ├── jobs.js
│   │   │   ├── interview.js
│   │   │   ├── externalJobs.js
│   │   │   ├── coding.js            # NEW
│   │   │   └── aptitude.js          # NEW
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Resume.js
│   │   │   ├── ChatSession.js
│   │   │   ├── JobSearch.js
│   │   │   ├── CodingProblem.js     # NEW
│   │   │   ├── CodingSubmission.js  # NEW
│   │   │   ├── AptitudeQuestion.js  # NEW
│   │   │   ├── AptitudeSession.js   # NEW
│   │   │   └── Role.js
│   │   ├── services/               # Business logic
│   │   │   ├── chatbotService.js   # Main orchestrator
│   │   │   ├── groqAIService.js   # AI wrapper
│   │   │   ├── groqService.js      # Groq API client
│   │   │   ├── SocketIOService.js  # Real-time service
│   │   │   ├── DocumentParser.js   # Resume parsing
│   │   │   ├── PDFGenerator.js     # PDF creation
│   │   │   ├── codeExecutionService.js  # NEW: Code execution
│   │   │   ├── aptitudeService.js       # NEW: Aptitude logic
│   │   │   ├── aptitudeSeedService.js   # NEW: Seed questions
│   │   │   ├── codingSeedService.js     # NEW: Seed problems
│   │   │   ├── chatbots/           # Specialized bots
│   │   │   │   ├── ATSScoringBot.js
│   │   │   │   ├── ResumeBuilderBot.js
│   │   │   │   ├── MockInterviewBot.js
│   │   │   │   ├── JobSuggesterBot.js
│   │   │   │   └── JobSearchBot.js
│   │   │   └── jobSources/        # External job APIs
│   │   │       ├── BaseJobSource.js
│   │   │       ├── JobSourceManager.js
│   │   │       ├── IndeedJobSource.js
│   │   │       └── GitHubJobSource.js
│   │   ├── middleware/             # Express middleware
│   │   │   ├── index.js            # Auth, CORS, validation, error handling
│   │   │   └── errorHandler.js
│   │   └── utils/                  # Utilities
│   │       ├── logger.js           # Winston logger
│   │       ├── helpers.js
│   │       └── validation.js
│   └── uploads/                   # File uploads directory
│       └── resumes/
├── frontend/
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js             # Vite configuration
│   ├── package.json
│   ├── .env                        # Frontend env vars
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Root component
│   │   ├── components/
│   │   │   ├── BotRouter.jsx      # 7-feature router
│   │   │   ├── Chat/
│   │   │   │   └── ChatInterface.jsx
│   │   │   └── Bots/
│   │   │       ├── ATSScorer.jsx
│   │   │       ├── ResumeBuilder_AI.jsx
│   │   │       ├── ResumeBuilder.jsx
│   │   │       ├── InterviewCoach.jsx
│   │   │       ├── JobFinder.jsx
│   │   │       ├── CareerAdvisor.jsx
│   │   │       ├── CodingPracticeBot.jsx    # NEW
│   │   │       └── AptitudeAssessmentBot.jsx # NEW
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── services/
│   │   │   └── api.js             # Axios instance
│   │   ├── hooks/
│   │   │   └── useAPI.js
│   │   ├── pages/
│   │   │   └── CodingPractice.jsx
│   │   └── theme/
│   │       └── theme.js           # MUI theme config
│   └── Dockerfile
├── docker-compose.yml              # Docker orchestration
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
└── README.md
```

### The 7 Core Features

1. **ATS Scorer** (`ats-scorer`)
   - Analyzes resumes for ATS compatibility
   - Provides score breakdown (keywords, formatting, content, skills)
   - Suggests improvements
   - Backend: `ATSScoringBot.js`
   - Frontend: `ATSScorer.jsx`

2. **Resume Builder** (`resume-builder`)
   - AI-powered resume creation
   - Template optimization
   - Version management
   - Backend: `ResumeBuilderBot.js`
   - Frontend: `ResumeBuilder_AI.jsx`

3. **Interview Coach** (`interview-coach`)
   - Mock interview practice
   - AI-generated questions
   - Real-time feedback
   - Backend: `MockInterviewBot.js`
   - Frontend: `InterviewCoach.jsx`

4. **Coding Practice** (`coding-practice`) ⭐ NEW
   - Coding problem database
   - Local code execution
   - Test case validation
   - Backend: `codingController.js`, `codeExecutionService.js`
   - Frontend: `CodingPracticeBot.jsx`
   - Models: `CodingProblem.js`, `CodingSubmission.js`

5. **Aptitude Assessment** (`aptitude-assessment`) ⭐ NEW
   - Adaptive difficulty questions
   - Topic rotation (logical, quantitative, verbal)
   - Performance tracking
   - Backend: `aptitudeController.js`, `aptitudeService.js`
   - Frontend: `AptitudeAssessmentBot.jsx`
   - Models: `AptitudeQuestion.js`, `AptitudeSession.js`

6. **Job Finder** (`job-finder`)
   - Multi-source job search (Indeed, GitHub)
   - Match scoring
   - Application tracking
   - Backend: `JobSearchBot.js`
   - Frontend: `JobFinder.jsx`

7. **Career Advisor** (`career-advisor`)
   - Career path suggestions
   - Skill gap analysis
   - Role recommendations
   - Backend: `JobSuggesterBot.js`
   - Frontend: `CareerAdvisor.jsx`

### Module Boundaries and Responsibilities

#### Backend Modules

1. **Controllers** (`src/controllers/`)
   - **Responsibility:** Handle HTTP requests, validate input, call services, format responses
   - **Pattern:** Thin controllers, business logic in services
   - **Dependencies:** Services, Models, Middleware
   - **New Controllers:** `codingController.js`, `aptitudeController.js`

2. **Services** (`src/services/`)
   - **Responsibility:** Business logic, AI interactions, external API calls
   - **Key Services:**
     - `chatbotService.js`: Routes messages to specialized bots
     - `groqAIService.js`: AI operations (intent classification, entity extraction, completions)
     - `SocketIOService.js`: Real-time WebSocket communication
     - `JobSourceManager.js`: Aggregates job search from multiple sources
     - `codeExecutionService.js`: Executes user code locally (NEW)
     - `aptitudeService.js`: Manages aptitude test logic (NEW)
   - **Dependencies:** Models, External APIs (Groq, Indeed, GitHub)

3. **Models** (`src/models/`)
   - **Responsibility:** Data schemas, validation, database operations
   - **Pattern:** Mongoose schemas with instance/static methods
   - **New Models:** `CodingProblem.js`, `CodingSubmission.js`, `AptitudeQuestion.js`, `AptitudeSession.js`
   - **Dependencies:** Mongoose

4. **Routes** (`src/routes/`)
   - **Responsibility:** Define API endpoints, apply middleware, delegate to controllers
   - **Pattern:** Express Router
   - **New Routes:** `coding.js`, `aptitude.js`
   - **Dependencies:** Controllers, Middleware

5. **Middleware** (`src/middleware/`)
   - **Responsibility:** Authentication, authorization, validation, error handling, CORS
   - **Dependencies:** JWT, Models (for user lookup)

#### Frontend Modules

1. **Components** (`src/components/`)
   - **Responsibility:** UI rendering, user interactions
   - **Pattern:** Functional components with hooks
   - **New Components:** `CodingPracticeBot.jsx`, `AptitudeAssessmentBot.jsx`
   - **Dependencies:** Services (API), Context (Auth)

2. **Services** (`src/services/`)
   - **Responsibility:** API communication, request/response handling
   - **Pattern:** Axios instance with interceptors
   - **Dependencies:** Axios

3. **Context** (`src/context/`)
   - **Responsibility:** Global state management (auth state)
   - **Pattern:** React Context API
   - **Dependencies:** Services

### Key Design Patterns

1. **Orchestrator Pattern** - `ChatbotService` routes messages to specialized bots
2. **Strategy Pattern** - Different job sources implement `BaseJobSource` interface
3. **Factory Pattern** - Bot creation based on session type
4. **Repository Pattern** - Models encapsulate database operations
5. **Middleware Pattern** - Express middleware chain for cross-cutting concerns
6. **Singleton Pattern** - Services exported as singleton instances
7. **Adapter Pattern** - OpenRouter API aliased as OpenAI SDK for compatibility

### State Management Approach

**Backend:**
- Stateless API (JWT tokens for auth)
- Database as source of truth
- Socket.IO maintains connection state in memory

**Frontend:**
- **React Context** for auth state (`AuthContext`)
- **React Query** for server state caching and synchronization
- **Local State** (useState) for component-level state
- **No Redux/Zustand** - Lightweight state management

---

## 4. Entry Points & Execution Flow

### Main Entry Files

**Backend:**
- **File:** `backend/server.js`
- **Command:** `npm start` or `npm run dev` (nodemon)
- **Port:** 5002 (configurable via `PORT` env var, default in code is 5002)

**Frontend:**
- **File:** `frontend/src/main.jsx`
- **Command:** `npm run dev` (Vite dev server)
- **Port:** 5173 (configurable in `vite.config.js`)

### Application Startup Sequence

#### Backend Startup (`server.js`)

1. **Load Environment Variables**
   ```javascript
   dotenv.config()
   ```

2. **OpenRouter Compatibility Check**
   - If `OPENROUTER_API_KEY` exists and `OPENAI_API_KEY` doesn't, alias OpenRouter key as OpenAI key
   - This enables OpenAI SDK compatibility with OpenRouter

3. **Initialize Express App**
   - Create Express instance
   - Create HTTP server

4. **Connect to MongoDB**
   - `connectDB()` async function
   - Connection options: timeout 5s, IPv4, pool size 10
   - **Critical:** Server continues even if DB connection fails (logs warning)
   - **Auto-seeding:** After connection, seeds coding problems and aptitude questions if collections are empty

5. **Apply Global Middleware** (in order):
   - Rate limiting (15 min window, 100-1000 requests based on NODE_ENV)
   - Compression
   - Helmet (security headers, CSP disabled in dev)
   - CORS middleware
   - Security headers
   - Request logging (if not test env)
   - Body parsing (JSON, URL-encoded, 10MB limit)

6. **Register Routes**
   - Health check: `GET /health`
   - API docs: `GET /api`
   - API routes: `app.use('/api', apiRoutes)`
   - Routes include: auth, users, resumes, chat, jobs, external-jobs, interview, **coding**, **aptitude**

7. **Initialize Socket.IO**
   - `SocketIOService.initialize(server)`
   - Sets up authentication middleware
   - Registers event handlers

8. **Initialize Job Sources**
   - `initializeJobSources()` called after server starts
   - Sets up Indeed and GitHub job sources

9. **Start HTTP Server**
   - `server.listen(PORT)`
   - Logs startup information

10. **Error Handlers** (registered last)
    - `notFoundHandler` (404)
    - `errorHandler` (500)

### Request Lifecycle

1. **HTTP Request Arrives**
   - Rate limiter checks
   - CORS middleware processes
   - Security headers added

2. **Route Matching**
   - Express matches route pattern
   - Middleware chain executes (auth, validation, etc.)

3. **Controller Execution**
   - Controller validates request
   - Calls service layer
   - Service performs business logic
   - May query database via Models

4. **Response**
   - Controller formats response
   - Error handler catches exceptions
   - Response sent to client

### Socket.IO Event Flow

1. **Connection**
   - Client connects with JWT token
   - Middleware verifies token
   - User info attached to socket
   - User joins personal room: `user:${userId}`

2. **Chat Events**
   - `join-chat`: User joins `chat:${sessionId}` room
   - `message-sent`: Broadcasts to room
   - `typing-start/stop`: Typing indicators

3. **Disconnection**
   - Cleanup: Remove from connected users map
   - Broadcast offline status

### Background Jobs/Workers

**Auto-Seeding on Startup:**
- `seedCodingProblems()` - Seeds coding problems if collection is empty
- `seedAptitudeQuestions()` - Seeds aptitude questions if collection is empty
- Runs automatically after MongoDB connection

**No Scheduled Tasks:**
- No cron jobs
- No background workers
- No scheduled cleanup tasks

**Potential Future Additions:**
- Job search result caching/refresh
- Resume ATS score recalculation
- Session cleanup (expired sessions)
- Usage statistics aggregation

---

## 5. Data Layer

### Database Schema Overview

**Database Name:** `ai-resume-assistant` (development) or `ai-resume-assistant-prod` (production)

**Collections:**
1. **users** (User model)
2. **resumes** (Resume model)
3. **chatsessions** (ChatSession model)
4. **jobsearches** (JobSearch model)
5. **codingproblems** (CodingProblem model) ⭐ NEW
6. **codingsubmissions** (CodingSubmission model) ⭐ NEW
7. **aptitudequestions** (AptitudeQuestion model) ⭐ NEW
8. **aptitudesessions** (AptitudeSession model) ⭐ NEW
9. **roles** (Role model)

### ORM/Query Layer

**Mongoose 7.8.7** - MongoDB ODM
- Schema definitions with validation
- Middleware hooks (pre-save, post-save)
- Virtual properties
- Instance and static methods
- Index definitions

### Important Models/Entities

#### User Model (`src/models/User.js`)

**Schema Structure:**
```javascript
{
  email: String (unique, required, lowercase)
  password: String (hashed with bcrypt, min 6 chars)
  profile: {
    firstName, lastName, phone, location,
    linkedinUrl, githubUrl, portfolioUrl,
    profilePicture, bio
  }
  preferences: {
    jobType: [String],
    industries: [String],
    locations: [String],
    salaryRange: { min, max, currency },
    experienceLevel: String,
    remoteWork: Boolean
  }
  subscription: {
    plan: 'free' | 'premium' | 'pro',
    status: 'active' | 'inactive' | 'cancelled',
    expiresAt: Date
  }
  usage: {
    chatMessagesCount: Number,
    resumesGenerated: Number,
    atsScoresRun: Number,
    mockInterviewsCompleted: Number
  }
  isActive: Boolean
  isVerified: Boolean
  refreshToken: String
  verificationToken: String
  resetPasswordToken: String
  resetPasswordExpires: Date
  timestamps: { createdAt, updatedAt }
}
```

**Key Methods:**
- `comparePassword(candidatePassword)` - Verify password
- `getPublicProfile()` - Return user without sensitive data
- `canUseFeature(feature)` - Check subscription limits
- `incrementUsage(feature)` - Track feature usage

**Indexes:**
- `email` (unique)
- `profile.firstName, profile.lastName`
- `createdAt` (descending)

#### Resume Model (`src/models/Resume.js`)

**Schema Structure:**
```javascript
{
  userId: ObjectId (ref: User)
  title: String (required, max 100)
  content: {
    personalInfo: { name, email, phone, location, summary, URLs }
    experience: [{
      company, position, startDate, endDate, current,
      description, achievements, location
    }]
    education: [{
      institution, degree, field, startDate, endDate,
      current, gpa, location
    }]
    skills: {
      technical: [{ name, level }],
      soft: [String],
      languages: [{ name, proficiency }]
    }
    certifications: [{
      name, issuer, date, expiryDate, credentialId, verificationUrl
    }]
    projects: [{
      name, description, technologies, url, githubUrl,
      startDate, endDate
    }]
  }
  atsScore: {
    overall: Number (0-100),
    breakdown: { keywords, formatting, content, skills },
    suggestions: [String],
    lastAnalyzed: Date,
    jobDescription: String
  }
  versions: [{
    versionName, content, targetJob, createdAt
  }]
  template: String (enum)
  isActive: Boolean
  isPublic: Boolean
  downloadCount: Number
  lastDownloaded: Date
  timestamps
}
```

**Key Methods:**
- `calculateATSScore(jobDescription)` - Calculate ATS compatibility score
- `createVersion(versionName, targetJob)` - Save resume version
- `restoreFromVersion(versionId)` - Restore from saved version

**Indexes:**
- `userId, createdAt` (descending)
- `userId, isActive`
- `atsScore.overall` (descending)
- Text index on `title, content.personalInfo.summary`

#### ChatSession Model (`src/models/ChatSession.js`)

**Schema Structure:**
```javascript
{
  userId: Mixed (ObjectId or String for guests)
  sessionType: 'main' | 'ats-score' | 'resume-builder' | 
                'mock-interview' | 'job-suggest' | 'job-search'
  title: String (max 100)
  messages: [{
    role: 'user' | 'assistant' | 'system',
    content: String (max 10000),
    timestamp: Date,
    metadata: {
      chatbotType, confidence, processingTime, tokens,
      intent, entities
    },
    attachments: [{
      type, filename, url, size, mimeType
    }]
  }]
  context: {
    resumeId: ObjectId,
    jobDescription: String,
    targetRole: String,
    userPreferences: Mixed,
    interviewState: { ... },
    atsAnalysis: { ... },
    jobSearchCriteria: { ... }
  }
  status: 'active' | 'completed' | 'paused' | 'archived'
  settings: { language, voiceEnabled, notificationsEnabled }
  analytics: {
    totalMessages, userMessages, assistantMessages,
    averageResponseTime, lastActivity, totalTokens,
    userSatisfactionScore, completionRate, intents
  }
  expiresAt: Date (default: 30 days from creation)
  timestamps
}
```

**Key Methods:**
- `addMessage(role, content, metadata)` - Add message to session
- `getConversationHistory(limit)` - Get recent messages for AI context
- `updateInterviewState(updates)` - Update interview progress
- `calculateCompletionRate()` - Calculate session completion

**Indexes:**
- `userId, createdAt` (descending)
- `userId, sessionType, status`
- `messages.timestamp` (descending)
- TTL index on `expiresAt` (auto-delete after expiry)

#### CodingProblem Model (`src/models/CodingProblem.js`) ⭐ NEW

**Schema Structure:**
```javascript
{
  title: String (required)
  description: String (required)
  difficulty: 'easy' | 'medium' | 'hard'
  category: String (e.g., 'arrays', 'strings', 'algorithms')
  tags: [String]
  examples: [{
    input: String,
    output: String,
    explanation: String
  }]
  constraints: String
  publicTests: [{
    input: String,
    expectedOutput: String
  }]
  hiddenTests: [{
    input: String,
    expectedOutput: String
  }]
  starterCode: {
    javascript: String,
    python: String,
    java: String
  }
  solution: String (optional, for reference)
  timestamps
}
```

**Key Methods:**
- Static methods for querying by difficulty, category
- Instance methods for validation

**Indexes:**
- `difficulty, category`
- `tags` (text index)

#### CodingSubmission Model (`src/models/CodingSubmission.js`) ⭐ NEW

**Schema Structure:**
```javascript
{
  userId: String (can be 'guest' for unauthenticated users)
  problemId: ObjectId (ref: CodingProblem)
  language: 'javascript' | 'python' | 'java'
  code: String (required)
  result: {
    passed: Boolean,
    passedTests: Number,
    totalTests: Number,
    executionTime: Number,
    error: String (if any),
    testResults: [{
      testCase: Number,
      passed: Boolean,
      input: String,
      expectedOutput: String,
      actualOutput: String
    }]
  }
  submittedAt: Date
  timestamps
}
```

**Indexes:**
- `userId, submittedAt` (descending)
- `problemId, submittedAt`

#### AptitudeQuestion Model (`src/models/AptitudeQuestion.js`) ⭐ NEW

**Schema Structure:**
```javascript
{
  question: String (required)
  type: 'logical' | 'quantitative' | 'verbal'
  difficulty: 'easy' | 'medium' | 'hard'
  options: [String] (4 options typically)
  correctAnswer: Number (index of correct option)
  explanation: String
  topic: String (e.g., 'analogies', 'number-series', 'comprehension')
  tags: [String]
  timestamps
}
```

**Indexes:**
- `type, difficulty`
- `topic`
- Text index on `question`

#### AptitudeSession Model (`src/models/AptitudeSession.js`) ⭐ NEW

**Schema Structure:**
```javascript
{
  sessionId: String (unique, required)
  userId: String (optional, can be guest)
  currentDifficulty: 'easy' | 'medium' | 'hard'
  score: Number (default: 0)
  correctStreak: Number
  wrongStreak: Number
  totalQuestions: Number
  askedQuestionIds: [ObjectId] (to avoid repeats)
  topicRotationIndex: Number (for rotating topics)
  topicStats: {
    logical: { asked: Number, correct: Number },
    quantitative: { asked: Number, correct: Number },
    verbal: { asked: Number, correct: Number }
  }
  answers: [{
    questionId: ObjectId,
    userAnswer: Number,
    correct: Boolean,
    timeTaken: Number,
    timestamp: Date
  }]
  startedAt: Date
  completedAt: Date
  timestamps
}
```

**Key Methods:**
- `updateScore(correct)` - Update score and streaks
- `getNextDifficulty()` - Adaptive difficulty adjustment
- `getNextTopic()` - Rotate through topics

**Indexes:**
- `sessionId` (unique)
- `userId, startedAt` (descending)

#### JobSearch Model (`src/models/JobSearch.js`)

**Schema Structure:**
```javascript
{
  userId: ObjectId (ref: User)
  searchQuery: {
    keywords: String (required, max 200),
    location: String (max 100),
    jobType: String (enum),
    salaryRange: { min, max, currency },
    experience: String (enum),
    remote: Boolean,
    companySize: String (enum),
    industry: String
  }
  results: [{
    jobId: String (unique),
    title, company, location, description,
    requirements: [String],
    skills: [{ name, required, level }],
    salary: { min, max, currency, type },
    benefits: [String],
    remote: Boolean,
    source: String (enum),
    url: String,
    postedDate: Date,
    expiryDate: Date,
    matchScore: Number (0-100),
    matchDetails: {
      skillsMatch, experienceMatch, salaryMatch, locationMatch
    },
    appliedAt: Date,
    status: String (enum),
    notes: String
  }]
  recommendations: [{
    jobId, reason, confidence, categories
  }]
  analytics: {
    totalResults, appliedCount, responseRate,
    averageMatchScore, topSources
  }
  filters: {
    excludeCompanies: [String],
    includeKeywords: [String],
    excludeKeywords: [String],
    minMatchScore: Number
  }
  isActive: Boolean
  lastSearched: Date
  timestamps
}
```

**Key Methods:**
- `addJob(jobData)` - Add job to results
- `updateJobStatus(jobId, status, notes)` - Update application status
- `calculateMatchScore(jobData, userResume)` - Calculate job-resume match
- `generateRecommendations()` - Generate top job recommendations

**Indexes:**
- `userId, createdAt` (descending)
- `userId, isActive`
- Text index on `searchQuery.keywords, searchQuery.location`
- `results.jobId`
- `results.matchScore` (descending)
- `results.postedDate` (descending)

### Migration Strategy

**No formal migration system.** Mongoose handles schema changes automatically:
- New fields are added on save
- Removed fields are ignored
- Type changes may cause issues (manual migration needed)

**Auto-Seeding:**
- Coding problems and aptitude questions are automatically seeded on server startup if collections are empty
- Seed services: `codingSeedService.js`, `aptitudeSeedService.js`

**Recommendation:** Implement migration scripts for production schema changes.

### Seed Data

**Auto-Seeding on Startup:**
- `seedCodingProblems()` - Called in `server.js` after MongoDB connection
- `seedAptitudeQuestions()` - Called in `server.js` after MongoDB connection
- Both check if collections are empty before seeding

**Manual Seeding:**
- `npm run db:seed` - References `src/scripts/seedDatabase.js` (file may not exist)
- Seed scripts exist: `codingSeedService.js`, `aptitudeSeedService.js`

---

## 6. API / Interfaces

### Public APIs

**Base URL:** `http://localhost:5002/api/v1`

### Routes/Endpoints (Grouped by Domain)

#### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user (returns JWT)
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (invalidate refresh token)
- `GET /me` - Get current user profile (requires auth)
- `PUT /me` - Update user profile (requires auth)

#### Users (`/api/v1/users`)
- `GET /:userId` - Get user by ID (requires auth)
- `PUT /:userId` - Update user (requires auth, own user only)
- `DELETE /:userId` - Delete user (requires auth, own user only)

#### Resumes (`/api/v1/resumes`)
- `GET /` - List user's resumes (requires auth)
- `POST /` - Create new resume (requires auth)
- `GET /:resumeId` - Get resume by ID (requires auth)
- `PUT /:resumeId` - Update resume (requires auth)
- `DELETE /:resumeId` - Delete resume (requires auth)
- `POST /:resumeId/analyze` - Analyze resume for ATS (requires auth)
- `POST /:resumeId/versions` - Create resume version (requires auth)
- `GET /:resumeId/versions` - List resume versions (requires auth)
- `POST /:resumeId/restore` - Restore from version (requires auth)
- `POST /:resumeId/export` - Export resume as PDF (requires auth)
- `POST /upload` - Upload resume file (requires auth, multipart/form-data)

#### Chat (`/api/v1/chat`)
- `POST /sessions` - Create chat session (optional auth - supports guests)
- `GET /sessions` - List user's chat sessions (optional auth)
- `GET /sessions/:sessionId` - Get chat history (optional auth)
- `PUT /sessions/:sessionId` - Update session (optional auth)
- `DELETE /sessions/:sessionId` - Delete session (optional auth)
- `POST /sessions/:sessionId/messages` - Send message (optional auth)
- `GET /analytics` - Get chat analytics (requires auth)

#### Jobs (`/api/v1/jobs`)
- `GET /` - List saved jobs (requires auth)
- `POST /` - Save job (requires auth)
- `GET /:jobId` - Get job details (requires auth)
- `PUT /:jobId` - Update job status (requires auth)
- `DELETE /:jobId` - Remove saved job (requires auth)

#### External Jobs (`/api/v1/external-jobs`)
- `GET /search` - Search jobs from external sources (optional auth)
- `GET /sources` - List available job sources (optional auth)
- `GET /:source/:jobId` - Get job details from source (optional auth)

#### Interview (`/api/v1/interview`)
- `POST /sessions` - Create interview session (requires auth)
- `POST /sessions/:sessionId/questions` - Get interview questions (requires auth)
- `POST /sessions/:sessionId/answers` - Submit answer and get feedback (requires auth)
- `GET /sessions/:sessionId` - Get interview session details (requires auth)

#### Coding Practice (`/api/v1/coding`) ⭐ NEW
- `GET /problems` - List all coding problems (optional auth)
- `GET /problems/:problemId` - Get problem details (optional auth)
- `POST /submit` - Submit code for execution (optional auth)
  - Body: `{ problemId, language, code }`
  - Returns: `{ success, data: { passed, passedTests, totalTests, testResults, ... } }`

#### Aptitude Assessment (`/api/v1/aptitude`) ⭐ NEW
- `POST /sessions` - Start new aptitude session (optional auth)
  - Returns: `{ success, sessionId }`
- `GET /sessions/:sessionId/question` - Get next question (optional auth)
  - Returns: `{ success, question: { question, options, type, difficulty, ... } }`
- `POST /sessions/:sessionId/answer` - Submit answer (optional auth)
  - Body: `{ answer: Number }`
  - Returns: `{ success, correct, explanation, score, nextDifficulty, ... }`
- `GET /sessions/:sessionId/stats` - Get session statistics (optional auth)
  - Returns: `{ success, stats: { score, totalQuestions, topicStats, ... } }`

### Authentication & Authorization Model

**JWT-Based Authentication:**
- **Access Token:** Short-lived (24 hours default, configurable via `JWT_EXPIRE`)
- **Refresh Token:** Long-lived (7 days default, configurable via `JWT_REFRESH_EXPIRE`)
- **Token Storage:** Frontend stores in `localStorage`
- **Token Format:** `Bearer <token>` in `Authorization` header

**Middleware:**
- `verifyToken` - Required authentication (401 if missing/invalid)
- `optionalAuth` - Optional authentication (continues without user if no token)
- `checkSubscription(requiredPlans)` - Subscription-based authorization (403 if plan insufficient)

**Guest Access:**
- Chat endpoints support guest users
- Coding and Aptitude endpoints support guest users
- Guest users have `userId: 'guest_' + timestamp` or just `'guest'`
- No database record for guests
- Limited functionality (no persistence beyond session)

**Authorization Rules:**
- Users can only access their own resources (userId matching)
- Admin role not implemented (all users are equal)
- Subscription plans: `free`, `premium`, `pro`
- Usage limits enforced per plan (see User model `canUseFeature` method)

### Data Validation Approach

**Backend:**
1. **Mongoose Schema Validation** - Automatic on save
2. **Joi Validation** - Request body validation via `validateRequest` middleware
3. **express-validator** - Available but not consistently used
4. **Custom Validation** - In controllers and services

**Frontend:**
- **React Hook Form** - Form validation
- **HTML5 Validation** - Basic input validation
- **API Response Validation** - Errors handled via axios interceptors

### Error Handling Strategy

**Backend Error Responses:**
```javascript
{
  success: false,
  message: "Error message",
  details?: "Additional details (dev only)",
  stack?: "Stack trace (dev only)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions/subscription)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

**Error Handler Middleware** (`src/middleware/index.js`):
- Catches all unhandled errors
- Maps Mongoose errors to user-friendly messages
- Maps JWT errors to appropriate status codes
- Logs errors with Winston
- Returns sanitized errors (stack only in development)

**Frontend Error Handling:**
- Axios interceptors catch API errors
- `react-hot-toast` displays error notifications
- 401 errors trigger logout and redirect to login
- 500+ errors show generic "Server error" message

---

## 7. Frontend

### UI Architecture

**Framework:** React 18.2.0 with functional components and hooks

**Component Hierarchy:**
```
App
└── ThemeProvider (MUI)
    └── Router (React Router)
        └── BotRouter (7-feature router)
            ├── ChatInterface (main)
            ├── ATSScorer
            ├── ResumeBuilder_AI
            ├── InterviewCoach
            ├── CodingPracticeBot ⭐ NEW
            ├── AptitudeAssessmentBot ⭐ NEW
            ├── JobFinder
            └── CareerAdvisor
```

### Component Structure

**Main Components:**

1. **App.jsx** - Root component
   - Theme provider (light/dark mode)
   - Toast notifications
   - App bar with theme toggle
   - Container for BotRouter

2. **BotRouter.jsx** - 7-feature router
   - Manages active bot state
   - Provides BotContext for child components
   - Renders appropriate bot component based on selection
   - **7 Modules:**
     - `ats-scorer` → ATSScorer
     - `resume-builder` → ResumeBuilder_AI
     - `interview-coach` → InterviewCoach
     - `coding-practice` → CodingPracticeBot ⭐
     - `aptitude-assessment` → AptitudeAssessmentBot ⭐
     - `job-finder` → JobFinder
     - `career-advisor` → CareerAdvisor

3. **ChatInterface.jsx** - Main chat interface
   - Socket.IO client connection
   - Message list
   - Input field
   - Real-time message handling

4. **Specialized Bot Components:**
   - `ATSScorer.jsx` - ATS scoring interface
   - `ResumeBuilder_AI.jsx` - AI-powered resume builder
   - `InterviewCoach.jsx` - Mock interview interface
   - `CodingPracticeBot.jsx` - Coding practice interface ⭐ NEW
   - `AptitudeAssessmentBot.jsx` - Aptitude test interface ⭐ NEW
   - `JobFinder.jsx` - Job search interface
   - `CareerAdvisor.jsx` - Career guidance interface

### State Management

**Global State:**
- **AuthContext** - User authentication state, token, login/logout functions
- **BotContext** - Active bot selection, switchBot function

**Server State:**
- **React Query** - Caching and synchronization of API data
- Automatic refetching, background updates

**Local State:**
- `useState` for component-specific state
- `useRef` for DOM references and non-reactive values

### Routing

**React Router v6** - Client-side routing
- Currently minimal routing (mostly handled by BotRouter component state)
- No route definitions found (likely single-page with component switching)

**Recommendation:** Implement proper routing for:
- `/` - Main chat
- `/ats-scorer` - ATS scoring
- `/resume-builder` - Resume builder
- `/interview` - Interview coach
- `/coding` - Coding practice
- `/aptitude` - Aptitude assessment
- `/jobs` - Job finder
- `/career` - Career advisor

### Styling Approach

**Material-UI (MUI) v5:**
- Component library with theming
- Custom theme in `src/theme/theme.js`
- Dark/light mode support
- Responsive design with breakpoints

**CSS:**
- `index.css` - Global styles
- Emotion (via MUI) - Component-level styles
- Inline styles via `sx` prop (MUI's styling system)

**No CSS-in-JS library** (styled-components, etc.) - Uses MUI's built-in styling

### Build/Bundling Process

**Vite 4.4.5:**
- **Dev Server:** Fast HMR (Hot Module Replacement)
- **Build:** Production bundle to `dist/`
- **Base Path:** `/ai_resume/` (configurable in `vite.config.js`)
- **Proxy:** `/api` requests proxied to `http://localhost:5002` in development

**Build Commands:**
- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Output:**
- Static files in `dist/`
- No server-side rendering (pure SPA)

---

## 8. Configuration & Environment

### Required Environment Variables

#### Backend (`.env`)

**Server:**
- `NODE_ENV` - `development` | `production` | `test`
- `PORT` - Server port (default: 5002)

**Database:**
- `MONGODB_URI` - MongoDB connection string (development)
- `MONGODB_URI_PROD` - MongoDB connection string (production, optional)

**Authentication:**
- `JWT_SECRET` - Secret for signing access tokens (REQUIRED)
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens (REQUIRED)
- `JWT_EXPIRE` - Access token expiration (default: `24h`)
- `JWT_REFRESH_EXPIRE` - Refresh token expiration (default: `7d`)

**AI Service:**
- `GROQ_API_KEY` - Groq API key (REQUIRED for AI features)
- `GROQ_MODEL` - Model name (default: `llama-3.3-70b-versatile`)
- **OR** `OPENROUTER_API_KEY` - OpenRouter API key (aliased as OpenAI key)
- `OPENROUTER_MODEL` - OpenRouter model (e.g., `meta-llama/llama-3.1-8b-instruct:free`)

**Client URLs:**
- `APP_URL` - Frontend URL (default: `http://localhost:5173`)
- `CLIENT_URL` - Alternative client URL
- `FRONTEND_URL` - Frontend URL for Socket.IO CORS
- `CORS_ORIGINS` - Comma-separated allowed origins

**Optional:**
- `LINKEDIN_CLIENT_ID` - LinkedIn API client ID
- `LINKEDIN_CLIENT_SECRET` - LinkedIn API secret
- `INDEED_PUBLISHER_ID` - Indeed API publisher ID
- `RAPIDAPI_KEY` - RapidAPI key (if using RapidAPI job sources)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration

#### Frontend (`.env.local` or `.env`)

**API:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:5000/api`)
- `VITE_SOCKET_URL` - Socket.IO server URL (default: `http://localhost:5000`)

**Note:** Vite requires `VITE_` prefix for environment variables to be exposed to client code.

### Config Files

**Backend:**
- `.env` - Environment variables (not in git)
- `.env.example` - Template for `.env`

**Frontend:**
- `.env` - Environment variables (not in git)
- `.env.production` - Production environment variables

**Docker:**
- `docker-compose.yml` - Container orchestration
- `backend/Dockerfile` - Backend container image
- `frontend/Dockerfile` - Frontend container image
- `nginx/nginx.conf` - Reverse proxy configuration

### Secrets Handling

**Current Approach:**
- Environment variables stored in `.env` files (not committed to git)
- `.gitignore` should exclude `.env` files
- Secrets passed to Docker containers via environment variables

**Security Concerns:**
- No secret management service (AWS Secrets Manager, HashiCorp Vault, etc.)
- Secrets in plain text in `.env` files
- No encryption at rest for secrets

**Recommendations:**
- Use secret management service in production
- Rotate secrets regularly
- Never commit `.env` files
- Use different secrets for development/production

### Feature Flags

**No formal feature flag system.** Features are controlled by:
- Environment variables (`NODE_ENV`)
- Subscription plans (usage limits)
- Configuration in code

**Recommendation:** Implement feature flag system (e.g., LaunchDarkly, custom solution) for:
- Gradual feature rollouts
- A/B testing
- Emergency feature toggles

---

## 9. Testing

### Test Frameworks

**Backend:**
- **Jest 29.6.2** - Test framework (configured in `package.json`)
- **Supertest 6.3.3** - HTTP assertion library

**Frontend:**
- **No test framework configured** - No Jest, React Testing Library, or Vitest setup found

### Test Structure

**Backend Tests:**
- Expected location: `backend/tests/` or `backend/__tests__/`
- **No test files found** in codebase

**Frontend Tests:**
- **No test files found**

### Coverage Level

**0% coverage** - No tests currently implemented

### How to Run Tests

**Backend:**
```bash
cd backend
npm test          # Run tests once
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

**Frontend:**
- No test commands available

**Critical Gap:** Testing infrastructure exists (Jest) but no tests are written. This is a significant technical debt.

---

## 10. Development & Deployment

### How to Run Locally

#### Prerequisites
- Node.js 18+
- MongoDB (local or Docker)
- npm or yarn
- Groq API key or OpenRouter API key

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration:
# - GROQ_API_KEY or OPENROUTER_API_KEY
# - JWT_SECRET
# - MONGODB_URI
npm run dev  # Starts with nodemon (auto-restart on changes)
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL:
# - VITE_API_URL=http://localhost:5002/api/v1
# - VITE_SOCKET_URL=http://localhost:5002
npm run dev  # Starts Vite dev server on port 5173
```

#### Database Setup
```bash
# Option 1: Docker
docker-compose up -d mongodb

# Option 2: Local MongoDB
mongod  # Start MongoDB daemon
```

**Note:** Coding problems and aptitude questions are auto-seeded on first server start.

#### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5002
- Health Check: http://localhost:5002/health
- API Docs: http://localhost:5002/api

### Build Commands

**Backend:**
```bash
npm run build  # Currently just echoes "Backend build complete"
npm start      # Production mode (node server.js)
```

**Frontend:**
```bash
npm run build  # Creates production bundle in dist/
npm run preview # Preview production build locally
```

### CI/CD

**GitHub Actions:**
- File: `.github/workflows/deploy.yml`
- **Not reviewed** - CI/CD pipeline exists but not analyzed in this audit

**Docker Deployment:**
```bash
docker-compose up -d  # Start all services
docker-compose down   # Stop all services
```

### Production Deployment Flow

**Docker Compose (Recommended):**
1. Build images: `docker-compose build`
2. Set environment variables in `.env` files
3. Start services: `docker-compose up -d`
4. Services: MongoDB, Backend, Frontend, Nginx (reverse proxy), Redis

**Manual Deployment:**
1. Build frontend: `cd frontend && npm run build`
2. Serve frontend: Use Nginx or static file server
3. Start backend: `cd backend && npm start`
4. Ensure MongoDB is running and accessible

**Production Considerations:**
- Use production MongoDB URI
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Enable HTTPS (Nginx with SSL)
- Configure proper CORS origins
- Set up monitoring and logging
- Use process manager (PM2) for Node.js
- Configure Redis for caching (if used)

---

## 11. Known Constraints & Risks

### Technical Debt

1. **No Tests**
   - Zero test coverage
   - High risk for regressions
   - Difficult to refactor safely

2. **Inconsistent Error Handling**
   - Some controllers have try-catch, others don't
   - Error messages not standardized
   - Some services throw errors, others return error objects

3. **No Database Migrations**
   - Schema changes require manual migration
   - Risk of data loss on schema updates

4. **Guest User Implementation**
   - Guest users stored in ChatSession with string IDs
   - No cleanup mechanism for guest sessions
   - Potential data bloat

5. **File Upload Storage**
   - Local filesystem storage (not scalable)
   - No cloud storage integration (S3, etc.)
   - Risk of disk space issues

6. **Code Execution Security** ⭐ NEW RISK
   - Local code execution in `codeExecutionService.js`
   - Potential security risk if not properly sandboxed
   - No timeout or resource limits visible
   - **Critical:** Review sandboxing implementation

7. **No Rate Limiting Per User**
   - Global rate limiting only
   - No per-user or per-endpoint limits
   - Vulnerable to abuse

8. **Socket.IO Connection Management**
   - No reconnection strategy documented
   - No handling of connection failures
   - Memory leaks possible with many connections

### Performance Bottlenecks

1. **AI API Calls**
   - Synchronous AI calls block request thread
   - No request queuing or batching
   - Slow responses under load

2. **Database Queries**
   - No query optimization analysis
   - Potential N+1 query problems
   - No connection pooling configuration (using defaults)

3. **File Processing**
   - PDF/DOCX parsing is synchronous
   - Large files can block event loop
   - No streaming for large files

4. **Job Search Aggregation**
   - Sequential API calls to job sources
   - No caching of search results
   - Duplicate job detection is O(n²) in worst case

5. **Code Execution** ⭐ NEW
   - Local execution may be slow for complex code
   - No async execution visible
   - Potential blocking of event loop

6. **Frontend Bundle Size**
   - No code splitting analysis
   - MUI and other libraries may be large
   - No lazy loading of bot components

### Security Concerns

1. **JWT Secret Management**
   - Secrets in plain text `.env` files
   - No secret rotation mechanism
   - Same secrets for dev/prod (if not configured)

2. **Password Hashing**
   - Using bcryptjs (good), but salt rounds not configurable
   - Fixed salt rounds (12) - may need adjustment

3. **CORS Configuration**
   - CORS origins from environment variables
   - Risk of misconfiguration allowing unauthorized origins
   - No validation of CORS origins

4. **File Upload Security**
   - No file type validation (only size limit)
   - No virus scanning
   - Uploaded files stored with predictable names

5. **Code Execution Security** ⭐ CRITICAL
   - Local code execution without visible sandboxing
   - Risk of code injection
   - No resource limits (CPU, memory, time)
   - **URGENT

   