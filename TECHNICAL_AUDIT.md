# Technical Audit Report: AI Resume Assistant

**Generated:** 2026-01-24  
**Project:** AI Resume Assistant - MERN Stack Application  
**Auditor:** Senior Software Architect & Codebase Auditor

---

## 1. Project Overview

### Business Purpose
AI Resume Assistant is a comprehensive career development platform that uses AI to help users:
- Build and optimize resumes for ATS (Applicant Tracking System) compatibility
- Practice mock interviews with AI feedback
- Search and match job opportunities
- Receive personalized career guidance and role suggestions
- Track job applications and analyze match scores

### Target Users
- Job seekers at all career levels (entry to executive)
- Career changers seeking guidance
- Professionals optimizing their resumes
- Students preparing for job market entry

### Core Workflows
1. **User Registration/Authentication** → JWT-based auth with optional guest access
2. **Resume Management** → Create, edit, version, and analyze resumes
3. **ATS Scoring** → Upload resume → AI analysis → Score breakdown → Improvement suggestions
4. **Chat Interface** → Main orchestrator bot routes to specialized bots (ATS, Resume Builder, Interview, Job Search, Career Advisor)
5. **Job Search** → Multi-source aggregation (Indeed, GitHub Jobs) → Match scoring → Application tracking
6. **Mock Interviews** → AI-generated questions → User responses → Feedback and scoring

### Runtime Environment
- **Backend:** Node.js server (Express.js) running on port 5002 (default)
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

### AI/ML Services
- **Groq AI** - Primary AI service (via custom `groqService.js`)
- **GroqAIService** - Wrapper service for AI operations
- **Model:** `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`)

### Frontend Frameworks/Libraries
- **React 18.2.0** - UI framework
- **Material-UI (MUI) 5.18.0** - Component library
- **React Router 6.30.1** - Client-side routing
- **React Query 3.39.3** - Data fetching and caching
- **Socket.io-client 4.8.1** - Real-time client
- **Framer Motion 10.12.22** - Animations
- **React Hook Form 7.45.2** - Form management
- **Vite 4.4.5** - Build tool and dev server

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
- **No Redis:** Currently not used despite being in docker-compose.yml

---

## 3. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  Port: 5173                                                  │
│  - BotRouter (main orchestrator)                            │
│  - Specialized Bot Components                                │
│  - ChatInterface (Socket.IO client)                          │
└───────────────────────┬───────────────────────────────────────┘
                       │ HTTP/REST + WebSocket
┌───────────────────────▼───────────────────────────────────────┐
│              Backend API (Express.js)                          │
│  Port: 5002                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Routes Layer                                           │  │
│  │  - /api/v1/auth, /api/v1/chat, /api/v1/resumes, etc.  │  │
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Controllers Layer                                       │  │
│  │  - authController, chatController, resumeController     │  │
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Services Layer                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  ChatbotService (Orchestrator)                    │  │  │
│  │  │  ├─ ATSScoringBot                                 │  │  │
│  │  │  ├─ ResumeBuilderBot                              │  │  │
│  │  │  ├─ MockInterviewBot                              │  │  │
│  │  │  ├─ JobSuggesterBot                               │  │  │
│  │  │  └─ JobSearchBot                                  │  │  │
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
│  └──────────────┬──────────────────────────────────────────┘  │
│                 │                                                │
│  ┌──────────────▼──────────────────────────────────────────┐  │
│  │  Models Layer (Mongoose)                                  │  │
│  │  - User, Resume, ChatSession, JobSearch                   │  │
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
│   │   │   └── externalJobsController.js
│   │   ├── routes/                  # Route definitions
│   │   │   ├── index.js             # Main router aggregator
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   ├── resumes.js
│   │   │   ├── users.js
│   │   │   ├── jobs.js
│   │   │   ├── interview.js
│   │   │   └── externalJobs.js
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Resume.js
│   │   │   ├── ChatSession.js
│   │   │   └── JobSearch.js
│   │   ├── services/               # Business logic
│   │   │   ├── chatbotService.js   # Main orchestrator
│   │   │   ├── groqAIService.js   # AI wrapper
│   │   │   ├── groqService.js      # Groq API client
│   │   │   ├── SocketIOService.js  # Real-time service
│   │   │   ├── DocumentParser.js   # Resume parsing
│   │   │   ├── PDFGenerator.js     # PDF creation
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
│   └── uploads/                    # File uploads directory
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
│   │   │   ├── BotRouter.jsx      # Bot selection/router
│   │   │   ├── Chat/
│   │   │   │   └── ChatInterface.jsx
│   │   │   └── Bots/
│   │   │       ├── ATSScorer.jsx
│   │   │       ├── ResumeBuilder_AI.jsx
│   │   │       ├── ResumeBuilder.jsx
│   │   │       ├── InterviewCoach.jsx
│   │   │       ├── JobFinder.jsx
│   │   │       └── CareerAdvisor.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── services/
│   │   │   └── api.js             # Axios instance
│   │   ├── hooks/
│   │   │   └── useAPI.js
│   │   └── theme/
│   │       └── theme.js           # MUI theme config
│   └── Dockerfile
├── docker-compose.yml              # Docker orchestration
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
└── README.md
```

### Module Boundaries and Responsibilities

#### Backend Modules

1. **Controllers** (`src/controllers/`)
   - **Responsibility:** Handle HTTP requests, validate input, call services, format responses
   - **Pattern:** Thin controllers, business logic in services
   - **Dependencies:** Services, Models, Middleware

2. **Services** (`src/services/`)
   - **Responsibility:** Business logic, AI interactions, external API calls
   - **Key Services:**
     - `chatbotService.js`: Routes messages to specialized bots
     - `groqAIService.js`: AI operations (intent classification, entity extraction, completions)
     - `SocketIOService.js`: Real-time WebSocket communication
     - `JobSourceManager.js`: Aggregates job search from multiple sources
   - **Dependencies:** Models, External APIs (Groq, Indeed, GitHub)

3. **Models** (`src/models/`)
   - **Responsibility:** Data schemas, validation, database operations
   - **Pattern:** Mongoose schemas with instance/static methods
   - **Dependencies:** Mongoose

4. **Routes** (`src/routes/`)
   - **Responsibility:** Define API endpoints, apply middleware, delegate to controllers
   - **Pattern:** Express Router
   - **Dependencies:** Controllers, Middleware

5. **Middleware** (`src/middleware/`)
   - **Responsibility:** Authentication, authorization, validation, error handling, CORS
   - **Dependencies:** JWT, Models (for user lookup)

#### Frontend Modules

1. **Components** (`src/components/`)
   - **Responsibility:** UI rendering, user interactions
   - **Pattern:** Functional components with hooks
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
- **Port:** 5002 (configurable via `PORT` env var)

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

2. **Initialize Express App**
   - Create Express instance
   - Create HTTP server

3. **Connect to MongoDB**
   - `connectDB()` async function
   - Connection options: timeout 5s, IPv4, pool size 10
   - **Critical:** Server continues even if DB connection fails (logs warning)

4. **Apply Global Middleware** (in order):
   - Rate limiting (15 min window, 100-1000 requests)
   - Compression
   - Helmet (security headers, CSP disabled in dev)
   - CORS middleware
   - Security headers
   - Request logging (if not test env)
   - Body parsing (JSON, URL-encoded, 10MB limit)

5. **Register Routes**
   - Health check: `GET /health`
   - API docs: `GET /api`
   - API routes: `app.use('/api', apiRoutes)`

6. **Initialize Socket.IO**
   - `SocketIOService.initialize(server)`
   - Sets up authentication middleware
   - Registers event handlers

7. **Initialize Job Sources**
   - `initializeJobSources()` called after server starts
   - Sets up Indeed and GitHub job sources

8. **Start HTTP Server**
   - `server.listen(PORT)`
   - Logs startup information

9. **Error Handlers** (registered last)
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

**None currently implemented.** The application is request-driven with no scheduled tasks, cron jobs, or background workers.

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

**Virtual Properties:**
- `totalExperience` - Calculated from experience entries
- `atsScoreStatus` - 'excellent' | 'good' | 'average' | 'needs-improvement'

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

**Recommendation:** Implement migration scripts for production schema changes.

### Seed Data

**No seed data scripts found.** The `package.json` references `db:seed` script pointing to `src/scripts/seedDatabase.js`, but the file doesn't exist in the codebase.

**Recommendation:** Create seed script for development/testing.

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

### Authentication & Authorization Model

**JWT-Based Authentication:**
- **Access Token:** Short-lived (15 minutes default, configurable via `JWT_EXPIRE`)
- **Refresh Token:** Long-lived (7 days default, configurable via `JWT_REFRESH_EXPIRE`)
- **Token Storage:** Frontend stores in `localStorage`
- **Token Format:** `Bearer <token>` in `Authorization` header

**Middleware:**
- `verifyToken` - Required authentication (401 if missing/invalid)
- `optionalAuth` - Optional authentication (continues without user if no token)
- `checkSubscription(requiredPlans)` - Subscription-based authorization (403 if plan insufficient)

**Guest Access:**
- Chat endpoints support guest users
- Guest users have `userId: 'guest_' + timestamp`
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
        └── BotRouter
            ├── ChatInterface (main)
            ├── ATSScorer
            ├── ResumeBuilder_AI
            ├── InterviewCoach
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

2. **BotRouter.jsx** - Bot selection and routing
   - Manages active bot state
   - Provides BotContext for child components
   - Renders appropriate bot component based on selection

3. **ChatInterface.jsx** - Main chat interface
   - Socket.IO client connection
   - Message list
   - Input field
   - Real-time message handling

4. **Specialized Bot Components:**
   - `ATSScorer.jsx` - ATS scoring interface
   - `ResumeBuilder_AI.jsx` - AI-powered resume builder
   - `InterviewCoach.jsx` - Mock interview interface
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
- `JWT_EXPIRE` - Access token expiration (default: `15m`)
- `JWT_REFRESH_EXPIRE` - Refresh token expiration (default: `7d`)

**AI Service:**
- `GROQ_API_KEY` - Groq API key (REQUIRED for AI features)
- `GROQ_MODEL` - Model name (default: `llama-3.3-70b-versatile`)

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

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration (especially GROQ_API_KEY, JWT_SECRET, MONGODB_URI)
npm run dev  # Starts with nodemon (auto-restart on changes)
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev  # Starts Vite dev server on port 5173
```

#### Database Setup
```bash
# Option 1: Docker
docker-compose up -d mongodb

# Option 2: Local MongoDB
mongod  # Start MongoDB daemon
```

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
4. Services: MongoDB, Backend, Frontend, Nginx (reverse proxy)

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

6. **No Rate Limiting Per User**
   - Global rate limiting only
   - No per-user or per-endpoint limits
   - Vulnerable to abuse

7. **Socket.IO Connection Management**
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

5. **Frontend Bundle Size**
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

5. **SQL Injection / NoSQL Injection**
   - Mongoose provides some protection
   - But raw queries or `$where` could be vulnerable
   - No input sanitization for user-generated content

6. **XSS (Cross-Site Scripting)**
   - User content rendered in chat messages
   - No HTML sanitization visible
   - MUI may provide some protection, but not guaranteed

7. **CSRF Protection**
   - No CSRF tokens
   - Relies on SameSite cookies (if using cookies)
   - JWT in Authorization header helps, but not complete protection

8. **Rate Limiting**
   - Global rate limit only
   - No per-user or per-IP tracking
   - Vulnerable to distributed attacks

### Tight Couplings

1. **Groq AI Service**
   - Hard dependency on Groq API
   - No abstraction for AI provider switching
   - Difficult to switch to OpenAI, Anthropic, etc.

2. **MongoDB**
   - Mongoose models tightly coupled to MongoDB
   - No database abstraction layer
   - Difficult to switch databases

3. **Socket.IO**
   - Real-time features depend on Socket.IO
   - No fallback for WebSocket failures
   - Client must use Socket.IO library

4. **Job Sources**
   - JobSourceManager tightly coupled to Indeed/GitHub
   - Adding new sources requires code changes
   - No plugin system for job sources

### Fragile Areas of Code

1. **Chatbot Service Orchestration**
   - Complex routing logic in `chatbotService.js`
   - Intent classification can fail silently
   - No fallback if specialized bot fails

2. **Resume Parsing**
   - DocumentParser handles multiple formats
   - Parsing errors may not be handled gracefully
   - No validation of parsed resume structure

3. **ATS Score Calculation**
   - Score calculation in Resume model method
   - Algorithm is simplistic (keyword matching)
   - May not reflect real ATS behavior

4. **Job Match Scoring**
   - Match score calculation in JobSearch model
   - Weights are hardcoded
   - No machine learning for better matching

5. **Session Management**
   - ChatSession expiration relies on TTL index
   - No manual cleanup for orphaned sessions
   - Guest sessions never expire (only 30-day TTL)

6. **Error Recovery**
   - Database connection failures logged but server continues
   - No retry logic for failed AI API calls
   - No circuit breaker for external services

---

## 12. Feature Extension Guidelines

### Where New Features Should Be Added

#### Adding a New Specialized Bot

**Location:** `backend/src/services/chatbots/`

**Steps:**
1. Create new bot class (e.g., `NewFeatureBot.js`)
2. Extend base bot pattern (see `ATSScoringBot.js` for reference)
3. Implement `processMessage(message, userId, sessionContext)` method
4. Register in `chatbotService.js`:
   ```javascript
   this.subBots['new-feature'] = new NewFeatureBot();
   ```
5. Add session type to ChatSession model enum
6. Create frontend component in `frontend/src/components/Bots/`
7. Register in `BotRouter.jsx`

**Example:**
```javascript
// backend/src/services/chatbots/NewFeatureBot.js
import GroqAIService from '../groqAIService.js';

class NewFeatureBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'New Feature Assistant';
  }

  async processMessage(message, userId, sessionContext) {
    // Implement bot logic
    const response = await this.openai.generateCompletion([...]);
    return {
      content: response.content,
      metadata: { ... }
    };
  }
}

export default NewFeatureBot;
```

#### Adding a New API Endpoint

**Location:** `backend/src/routes/` and `backend/src/controllers/`

**Steps:**
1. Add route in appropriate route file (or create new one)
2. Create controller function in corresponding controller file
3. Add middleware (auth, validation) as needed
4. Register route in `backend/src/routes/index.js`

**Example:**
```javascript
// backend/src/routes/newFeature.js
import express from 'express';
import { verifyToken } from '../middleware/index.js';
import { getNewFeature } from '../controllers/newFeatureController.js';

const router = express.Router();
router.get('/', verifyToken, getNewFeature);
export default router;

// backend/src/routes/index.js
import newFeatureRoutes from './newFeature.js';
router.use(`${API_VERSION}/new-feature`, newFeatureRoutes);
```

#### Adding a New Database Model

**Location:** `backend/src/models/`

**Steps:**
1. Create Mongoose schema
2. Define indexes for performance
3. Add instance/static methods as needed
4. Export model
5. Use in controllers/services

**Example:**
```javascript
// backend/src/models/NewModel.js
import mongoose from 'mongoose';

const newModelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ... other fields
}, { timestamps: true });

newModelSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('NewModel', newModelSchema);
```

### Which Modules Are Safe to Extend

**Safe to Extend:**
- ✅ `backend/src/controllers/` - Add new controllers
- ✅ `backend/src/routes/` - Add new routes
- ✅ `backend/src/services/chatbots/` - Add new bots
- ✅ `backend/src/services/jobSources/` - Add new job sources
- ✅ `frontend/src/components/Bots/` - Add new bot components
- ✅ `backend/src/models/` - Add new models (be careful with existing ones)

### Which Modules Should NOT Be Modified

**Do NOT Modify Without Careful Consideration:**
- ⚠️ `backend/server.js` - Core server setup (middleware order matters)
- ⚠️ `backend/src/middleware/index.js` - Auth and error handling (affects all routes)
- ⚠️ `backend/src/services/chatbotService.js` - Orchestration logic (affects all bots)
- ⚠️ `backend/src/models/User.js` - User schema (affects authentication)
- ⚠️ `backend/src/services/groqService.js` - AI service client (affects all AI features)
- ⚠️ `frontend/src/App.jsx` - Root component (affects entire app)
- ⚠️ `frontend/src/services/api.js` - API client (affects all API calls)

**If Modification Required:**
- Test thoroughly
- Check for breaking changes
- Update dependent code
- Document changes

### Required Patterns to Follow

1. **Error Handling**
   - Always use try-catch in async functions
   - Return consistent error format: `{ success: false, message: "..." }`
   - Log errors with Winston logger

2. **Authentication**
   - Use `verifyToken` middleware for protected routes
   - Use `optionalAuth` for public routes with optional user context
   - Check user ownership before allowing resource access

3. **Validation**
   - Validate input in controllers
   - Use Mongoose schema validation
   - Return 400 for validation errors

4. **AI Service Usage**
   - Always use `GroqAIService` wrapper, not `groqService` directly
   - Handle AI API errors gracefully
   - Set appropriate temperature and maxTokens

5. **Database Queries**
   - Use Mongoose methods (not raw queries)
   - Add proper indexes for frequently queried fields
   - Use `.lean()` for read-only queries (performance)

6. **Frontend Components**
   - Use functional components with hooks
   - Use MUI components for UI
   - Handle loading and error states
   - Use React Query for server state

### Naming Conventions

**Backend:**
- Files: `camelCase.js` (e.g., `chatController.js`)
- Classes: `PascalCase` (e.g., `ChatbotService`)
- Functions: `camelCase` (e.g., `processMessage`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_VERSION`)
- Models: `PascalCase` singular (e.g., `User`, `Resume`)

**Frontend:**
- Components: `PascalCase.jsx` (e.g., `ChatInterface.jsx`)
- Hooks: `useCamelCase.js` (e.g., `useAPI.js`)
- Services: `camelCase.js` (e.g., `api.js`)
- Context: `PascalCaseContext.jsx` (e.g., `AuthContext.jsx`)

**Database:**
- Collections: `camelCase` plural (Mongoose auto-pluralizes: `User` → `users`)
- Fields: `camelCase` (e.g., `firstName`, `createdAt`)

### Common Mistakes to Avoid

1. **❌ Modifying Core Middleware Without Testing**
   - Auth middleware changes affect all routes
   - Test thoroughly before deploying

2. **❌ Direct Database Queries**
   - Use Mongoose models, not raw MongoDB queries
   - Raw queries bypass validation and hooks

3. **❌ Blocking the Event Loop**
   - Don't use synchronous operations in request handlers
   - Use async/await for I/O operations

4. **❌ Ignoring Error Handling**
   - Always handle errors in async functions
   - Don't let errors crash the server

5. **❌ Hardcoding Configuration**
   - Use environment variables, not hardcoded values
   - Don't commit secrets to git

6. **❌ Modifying Existing Models Without Migration**
   - Schema changes require careful migration
   - Test with existing data

7. **❌ Creating Circular Dependencies**
   - Be careful with service imports
   - Use dependency injection where needed

8. **❌ Not Validating User Input**
   - Always validate and sanitize user input
   - Don't trust client-side validation alone

9. **❌ Not Handling Loading States**
   - Show loading indicators during API calls
   - Handle timeout and network errors

10. **❌ Not Testing New Features**
    - Write tests for new functionality
    - Test edge cases and error scenarios

---

## 13. Dependency Map

### Critical Internal Dependencies

```
server.js
├── routes/index.js
│   ├── routes/auth.js → controllers/authController.js
│   ├── routes/chat.js → controllers/chatController.js
│   ├── routes/resumes.js → controllers/resumeController.js
│   └── routes/users.js → controllers/userController.js
│
├── services/SocketIOService.js
│   └── models/User.js (for auth)
│   └── models/ChatSession.js (for sessions)
│
└── controllers/externalJobsController.js
    └── services/jobSources/JobSourceManager.js
        ├── services/jobSources/IndeedJobSource.js
        └── services/jobSources/GitHubJobSource.js

controllers/chatController.js
├── models/ChatSession.js
├── models/User.js
├── services/chatbotService.js
│   ├── services/groqAIService.js
│   │   └── services/groqService.js
│   ├── services/chatbots/ATSScoringBot.js
│   ├── services/chatbots/ResumeBuilderBot.js
│   ├── services/chatbots/MockInterviewBot.js
│   ├── services/chatbots/JobSuggesterBot.js
│   └── services/chatbots/JobSearchBot.js
└── services/SocketIOService.js

controllers/resumeController.js
├── models/Resume.js
├── models/User.js
├── services/DocumentParser.js
└── services/PDFGenerator.js
```

### External Service Dependencies

1. **Groq AI API**
   - **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
   - **Required:** `GROQ_API_KEY`
   - **Used By:** All chatbot services
   - **Failure Impact:** All AI features unavailable

2. **MongoDB**
   - **Connection:** `MONGODB_URI`
   - **Used By:** All models
   - **Failure Impact:** Server continues but database operations fail

3. **Indeed API** (Optional)
   - **Used By:** `IndeedJobSource`
   - **Required:** `INDEED_PUBLISHER_ID`
   - **Failure Impact:** Job search from Indeed unavailable

4. **GitHub Jobs API** (Optional)
   - **Used By:** `GitHubJobSource`
   - **No Auth Required**
   - **Failure Impact:** Job search from GitHub unavailable

5. **LinkedIn API** (Optional, Not Implemented)
   - **Configuration Present:** But no implementation found
   - **Failure Impact:** None (not used)

### Dependency Risks

1. **Single Point of Failure: Groq AI**
   - All AI features depend on Groq API
   - No fallback AI provider
   - **Recommendation:** Implement AI provider abstraction

2. **Database Dependency**
   - All features require MongoDB
   - Server continues without DB, but features fail
   - **Recommendation:** Implement graceful degradation

3. **External Job APIs**
   - Job search depends on external APIs
   - No caching of results
   - **Recommendation:** Implement result caching

---

## 14. Quick Reference

### If You Want to Add a New Feature, Here is the Exact Process Step-by-Step

#### Example: Adding a "Cover Letter Builder" Feature

**Step 1: Backend - Create Model**
```bash
# Create model file
touch backend/src/models/CoverLetter.js
```

```javascript
// backend/src/models/CoverLetter.js
import mongoose from 'mongoose';

const coverLetterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  jobId: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

coverLetterSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model('CoverLetter', coverLetterSchema);
```

**Step 2: Backend - Create Controller**
```bash
touch backend/src/controllers/coverLetterController.js
```

```javascript
// backend/src/controllers/coverLetterController.js
import CoverLetter from '../models/CoverLetter.js';
import { logger } from '../utils/logger.js';

export const createCoverLetter = async (req, res) => {
  try {
    const { title, content, resumeId, jobId } = req.body;
    const userId = req.user.userId;

    const coverLetter = new CoverLetter({
      userId,
      title,
      content,
      resumeId,
      jobId
    });

    await coverLetter.save();

    res.status(201).json({
      success: true,
      data: coverLetter
    });
  } catch (error) {
    logger.error('Create cover letter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cover letter'
    });
  }
};

// Add more controller functions...
```

**Step 3: Backend - Create Routes**
```bash
touch backend/src/routes/coverLetters.js
```

```javascript
// backend/src/routes/coverLetters.js
import express from 'express';
import { verifyToken } from '../middleware/index.js';
import {
  createCoverLetter,
  getCoverLetters,
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter
} from '../controllers/coverLetterController.js';

const router = express.Router();

router.use(verifyToken); // All routes require auth

router.get('/', getCoverLetters);
router.post('/', createCoverLetter);
router.get('/:id', getCoverLetter);
router.put('/:id', updateCoverLetter);
router.delete('/:id', deleteCoverLetter);

export default router;
```

**Step 4: Backend - Register Route**
```javascript
// backend/src/routes/index.js
import coverLetterRoutes from './coverLetters.js';

// Add to route handlers:
router.use(`${API_VERSION}/cover-letters`, coverLetterRoutes);
```

**Step 5: Backend - Create Specialized Bot (Optional)**
```bash
touch backend/src/services/chatbots/CoverLetterBot.js
```

```javascript
// backend/src/services/chatbots/CoverLetterBot.js
import GroqAIService from '../groqAIService.js';

class CoverLetterBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'Cover Letter Assistant';
  }

  async processMessage(message, userId, sessionContext) {
    // Implement cover letter generation logic
    const systemPrompt = "You are a cover letter writing assistant...";
    const response = await this.openai.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);

    return {
      content: response.content,
      metadata: { chatbotType: 'cover-letter' }
    };
  }
}

export default CoverLetterBot;
```

**Step 6: Backend - Register Bot**
```javascript
// backend/src/services/chatbotService.js
import CoverLetterBot from './chatbots/CoverLetterBot.js';

// In constructor:
this.subBots['cover-letter'] = new CoverLetterBot();
```

**Step 7: Backend - Update ChatSession Model**
```javascript
// backend/src/models/ChatSession.js
// Update sessionType enum:
sessionType: {
  type: String,
  enum: ['main', 'ats-score', 'resume-builder', 'mock-interview', 
         'job-suggest', 'job-search', 'cover-letter'], // Add new type
  // ...
}
```

**Step 8: Frontend - Create Component**
```bash
touch frontend/src/components/Bots/CoverLetterBuilder.jsx
```

```javascript
// frontend/src/components/Bots/CoverLetterBuilder.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import api from '../../services/api';

const CoverLetterBuilder = () => {
  const [content, setContent] = useState('');

  const handleSave = async () => {
    try {
      await api.post('/cover-letters', { title: 'New Cover Letter', content });
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Box>
      <Typography variant="h6">Cover Letter Builder</Typography>
      <TextField
        multiline
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleSave}>Save</Button>
    </Box>
  );
};

export default CoverLetterBuilder;
```

**Step 9: Frontend - Register in BotRouter**
```javascript
// frontend/src/components/BotRouter.jsx
import CoverLetterBuilder from './Bots/CoverLetterBuilder.jsx';

// In BotRouter component:
{activeBot === 'cover-letter' ? (
  <CoverLetterBuilder />
) : (
  // ... other bots
)}
```

**Step 10: Test**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test API endpoints with Postman/curl
4. Test UI in browser
5. Verify database records

**Step 11: Document**
- Update README.md with new feature
- Add API documentation
- Update this audit document if architecture changes

---

## Summary

This technical audit provides a comprehensive overview of the AI Resume Assistant codebase. Key findings:

- **Architecture:** Well-structured MERN stack with clear separation of concerns
- **AI Integration:** Groq AI service with specialized chatbot architecture
- **Real-time:** Socket.IO for live chat functionality
- **Database:** MongoDB with Mongoose ODM, well-defined schemas
- **Frontend:** React with Material-UI, component-based architecture

**Critical Gaps:**
- No tests (0% coverage)
- No database migrations
- Limited error recovery
- Security improvements needed
- No caching layer

**Strengths:**
- Clean code organization
- Modular bot architecture
- Comprehensive data models
- Good separation of concerns

Use this document as a reference when adding features, fixing bugs, or refactoring code. Always test thoroughly and update this document if architecture changes significantly.

---

**End of Technical Audit Report**
