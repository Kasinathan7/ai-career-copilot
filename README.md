# AI Resume Assistant - Complete MERN Stack Application

A sophisticated AI-driven MERN stack application featuring an intelligent chatbot ecosystem with specialized mini-bots for comprehensive job search assistance. This platform combines advanced AI capabilities with modern web technologies to provide users with ATS scoring, resume optimization, mock interviews, career guidance, and integrated job search functionality.

## 🌟 Key Features Overview

### 1. **ATS Score Checker** 📊
- **Advanced Algorithm Analysis**: Utilizes sophisticated AI algorithms to evaluate resume content
- **Keyword Matching**: Intelligent keyword density analysis and optimization suggestions
- **Formatting Assessment**: Evaluates ATS-friendly formatting and structure
- **Content Quality Scoring**: Analyzes content relevance, clarity, and impact
- **Skills Alignment**: Matches skills with job requirements and industry standards
- **Real-time Scoring**: Instant feedback with detailed improvement recommendations
- **Historical Tracking**: Track score improvements over time with version control

### 2. **ATS-Friendly Resume Builder** ✏️
- **Dynamic Generation**: AI-powered resume creation based on user input and job descriptions
- **Template Optimization**: Multiple ATS-optimized templates with industry-specific layouts
- **Keyword Integration**: Automatic keyword optimization based on target job descriptions
- **Smart Formatting**: Ensures proper formatting for ATS compatibility
- **Content Enhancement**: AI suggestions for improving bullet points and descriptions
- **Multiple Export Formats**: PDF, DOCX, and plain text formats
- **Version Management**: Save and manage multiple resume versions

### 3. **Mock Interview Bot** 🎤
- **Personalized Questions**: AI-generated questions based on resume content and target role
- **Real-time Feedback**: Instant analysis of responses with improvement suggestions
- **Multi-format Support**: Text, voice, and video interview simulations
- **Industry-specific Scenarios**: Tailored questions for different industries and roles
- **Performance Analytics**: Detailed scoring and progress tracking
- **Behavioral & Technical Questions**: Comprehensive question database
- **Interview Preparation Plans**: Structured practice schedules

### 4. **Job Role Suggester** 🎯
- **Skills Analysis**: ML-powered analysis of user skills and experience
- **Career Path Mapping**: Intelligent career progression suggestions
- **Market Trend Integration**: Real-time job market analysis and trending roles
- **Skill Gap Analysis**: Identifies skills needed for target roles
- **Salary Insights**: Market-based salary expectations and ranges
- **Growth Potential Assessment**: Long-term career opportunity analysis
- **Personalized Recommendations**: Customized suggestions based on user preferences

### 5. **Job Search Integration** 🔍
- **LinkedIn Jobs API**: Direct integration with LinkedIn's job database
- **Indeed & GitHub APIs**: Multi-platform job aggregation
- **Automated Matching**: AI-powered job recommendations based on profile
- **Application Tracking**: Comprehensive application management system
- **Real-time Notifications**: Instant alerts for matching job opportunities
- **Company Research**: Automated company profile and culture analysis
- **Salary Benchmarking**: Market rate analysis for target positions

## 🏗️ Sophisticated Architecture

### Chatbot Ecosystem Design

The application features a sophisticated multi-bot architecture where a main orchestrator chatbot intelligently routes user queries to specialized mini-bots:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Main AI Chatbot (Orchestrator)              │
│                  - Intent Classification                        │
│                  - Query Routing                                │
│                  - Context Management                           │
│                  - Session Orchestration                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌───▼────┐   ┌────▼────┐
   │   ATS   │   │Resume  │   │  Mock   │
   │Scoring  │   │Builder │   │Interview│
   │ChatBot  │   │ChatBot │   │ChatBot  │
   └─────────┘   └────────┘   └─────────┘
        │             │             │
   ┌────▼────┐   ┌───▼────┐   ┌────▼────┐
   │   Job   │   │  Job   │   │Enhanced │
   │Suggester│   │Search  │   │Features │
   │ChatBot  │   │  Bot   │   │  Bots   │
   └─────────┘   └────────┘   └─────────┘
```

### Technical Stack

#### Backend Architecture
- **Node.js + Express.js**: RESTful API with robust middleware
- **MongoDB + Mongoose**: Document database with advanced schemas
- **OpenRouter AI**: Access to multiple AI models (Llama 3.1, Gemma 2, etc.) with FREE tier available
- **Socket.io**: Real-time bidirectional communication
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Redis**: Caching layer for improved performance
- **Winston**: Comprehensive logging and monitoring
- **Rate Limiting**: API protection and abuse prevention

> **🎉 Now Using OpenRouter!** This project uses OpenRouter instead of OpenAI, giving you access to FREE AI models like Meta's Llama 3.1 and Google's Gemma 2. See [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) for setup instructions.

#### Frontend Architecture
- **React 18**: Modern React with hooks and context
- **Material-UI v5**: Comprehensive component library
- **React Query**: Advanced state management and caching
- **Socket.io Client**: Real-time chat interface
- **React Router v6**: Client-side routing
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Efficient form handling

#### Database Design
- **Optimized Schemas**: Efficient data modeling for scalability
- **Indexing Strategy**: Proper indexing for query performance
- **Data Relationships**: Well-structured entity relationships
- **Caching Layer**: Redis integration for frequently accessed data

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn
- **OpenRouter API key** (Free tier available! See [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md))
- LinkedIn API credentials (optional)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ai-resume-assistant
```

### 2. Backend Configuration
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

**Environment Variables (.env):**
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/ai-resume-assistant
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# OpenRouter Configuration (FREE Models Available!)
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_MODEL_SECONDARY=google/gemma-2-9b-it:free
OPENROUTER_MAX_TOKENS=2000
APP_URL=http://localhost:5173

# LinkedIn API (Optional)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Indeed API (Optional)
INDEED_PUBLISHER_ID=your-indeed-publisher-id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Cors Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Frontend Configuration
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local
```

**Frontend Environment Variables (.env.local):**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=AI Resume Assistant
VITE_MAX_FILE_SIZE=10485760
VITE_LINKEDIN_CLIENT_ID=your-linkedin-client-id
```

### 4. Database Setup
```bash
# Option 1: Using Docker
docker-compose up -d mongodb redis

# Option 2: Local Installation
# Install MongoDB and Redis locally
# Start MongoDB: mongod
# Start Redis: redis-server
```

### 5. Start Development Servers
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 6. Seed Database (Optional)
```bash
cd backend
npm run db:seed
```

## 📊 Database Schema Design

### User Schema
```javascript
const UserSchema = {
  _id: ObjectId,
  email: String, // unique, required
  password: String, // hashed with bcrypt
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    location: {
      city: String,
      state: String,
      country: String
    },
    professional: {
      title: String,
      experience: Number, // years
      industry: String,
      skills: [String],
      linkedinUrl: String
    }
  },
  preferences: {
    jobTypes: [String], // full-time, part-time, contract
    salaryRange: {
      min: Number,
      max: Number,
      currency: String
    },
    remoteWork: Boolean,
    industries: [String],
    locations: [String]
  },
  subscription: {
    plan: String, // free, premium, enterprise
    status: String,
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date,
  lastActive: Date,
  isVerified: Boolean,
  refreshTokens: [String]
}
```

### Resume Schema
```javascript
const ResumeSchema = {
  _id: ObjectId,
  userId: ObjectId, // reference to User
  title: String,
  content: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedinUrl: String,
      portfolioUrl: String
    },
    summary: String,
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String,
      achievements: [String],
      skills: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number,
      honors: [String]
    }],
    skills: {
      technical: [String],
      soft: [String],
      languages: [{
        name: String,
        proficiency: String
      }]
    },
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      startDate: Date,
      endDate: Date
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }]
  },
  atsScore: {
    overall: Number, // 0-100
    breakdown: {
      keywords: Number,
      formatting: Number,
      content: Number,
      skills: Number
    },
    suggestions: [String],
    lastCalculated: Date
  },
  versions: [{
    version: Number,
    content: Object,
    createdAt: Date,
    note: String
  }],
  targetJob: {
    title: String,
    company: String,
    description: String,
    requirements: [String]
  },
  template: String,
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Session Schema
```javascript
const ChatSessionSchema = {
  _id: ObjectId,
  userId: ObjectId, // reference to User
  type: String, // main, ats-scoring, resume-builder, mock-interview, job-suggester, job-search
  title: String,
  messages: [{
    _id: ObjectId,
    role: String, // user, assistant, system
    content: String,
    metadata: {
      botType: String,
      confidence: Number,
      processingTime: Number,
      tokens: Number
    },
    attachments: [{
      type: String, // file, image, resume
      url: String,
      name: String,
      size: Number
    }],
    timestamp: Date
  }],
  context: {
    currentBot: String,
    resumeId: ObjectId,
    jobSearchCriteria: Object,
    interviewType: String,
    preferences: Object
  },
  status: String, // active, completed, archived
  analytics: {
    messageCount: Number,
    duration: Number, // seconds
    satisfaction: Number, // 1-5 rating
    tags: [String]
  },
  createdAt: Date,
  updatedAt: Date,
  lastActivity: Date
}
```

### Job Search Schema
```javascript
const JobSearchSchema = {
  _id: ObjectId,
  userId: ObjectId, // reference to User
  criteria: {
    keywords: [String],
    location: String,
    radius: Number,
    jobType: String, // full-time, part-time, contract
    experience: String, // entry, mid, senior
    salaryRange: {
      min: Number,
      max: Number
    },
    industry: String,
    company: String,
    remote: Boolean
  },
  results: [{
    jobId: String, // external job ID
    title: String,
    company: String,
    location: String,
    description: String,
    requirements: [String],
    salary: {
      min: Number,
      max: Number,
      currency: String
    },
    source: String, // linkedin, indeed, github
    url: String,
    postedDate: Date,
    matchScore: Number, // 0-100
    status: String, // saved, applied, rejected, interviewing
    appliedDate: Date,
    notes: String
  }],
  alerts: {
    enabled: Boolean,
    frequency: String, // daily, weekly
    lastSent: Date
  },
  analytics: {
    totalResults: Number,
    appliedCount: Number,
    responseRate: Number,
    averageMatchScore: Number
  },
  createdAt: Date,
  updatedAt: Date,
  lastSearched: Date
}
```

## 🔗 API Integration Details

### OpenAI Integration
```javascript
// Main AI Orchestrator
class AIOrchestrator {
  async routeQuery(userMessage, context) {
    const intentClassification = await this.classifyIntent(userMessage);
    const targetBot = this.selectBot(intentClassification);
    return await this.delegateToBot(targetBot, userMessage, context);
  }

  async classifyIntent(message) {
    const prompt = `
      Classify the following user message into one of these categories:
      - ats-scoring: Resume analysis, ATS score, optimization
      - resume-builder: Create, edit, format resume
      - mock-interview: Practice interviews, questions, feedback
      - job-suggester: Career advice, role recommendations
      - job-search: Find jobs, search positions, applications
      - general: General conversation, unclear intent
      
      Message: "${message}"
      Category:
    `;
    
    return await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });
  }
}

// Specialized Bot Example: ATS Scoring
class ATSScoringBot {
  async analyzeResume(resumeText, jobDescription = null) {
    const analysis = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `You are an expert ATS (Applicant Tracking System) analyzer. 
                  Analyze resumes for ATS compatibility and provide detailed scoring.`
      }, {
        role: 'user',
        content: `Analyze this resume for ATS compatibility:
                  
                  Resume: ${resumeText}
                  ${jobDescription ? `Job Description: ${jobDescription}` : ''}
                  
                  Provide:
                  1. Overall ATS score (0-100)
                  2. Keyword matching score
                  3. Formatting score
                  4. Content quality score
                  5. Skills alignment score
                  6. Specific improvement suggestions
                  7. Missing keywords (if job description provided)`
      }],
      max_tokens: 2000
    });

    return this.parseATSResponse(analysis.choices[0].message.content);
  }
}
```

### LinkedIn API Integration
```javascript
class LinkedInIntegration {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.baseURL = 'https://api.linkedin.com/v2';
  }

  async searchJobs(criteria) {
    const params = new URLSearchParams({
      keywords: criteria.keywords.join(' '),
      locationId: await this.getLocationId(criteria.location),
      f_TPR: this.getTimePostedFilter(criteria.timePosted),
      f_JT: this.getJobTypeFilter(criteria.jobType),
      f_E: this.getExperienceFilter(criteria.experience),
      start: criteria.offset || 0,
      count: criteria.limit || 25
    });

    const response = await axios.get(
      `${this.baseURL}/jobSearch?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return this.parseJobResults(response.data);
  }

  async getJobDetails(jobId) {
    const response = await axios.get(
      `${this.baseURL}/jobs/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return this.parseJobDetails(response.data);
  }
}
```

## 🎨 Frontend Component Architecture

### Main Chat Interface
```jsx
// ChatInterface.jsx - Main chat component
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, TextField, IconButton } from '@mui/material';
import { Send, AttachFile, Mic } from '@mui/icons-material';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import BotSelector from './BotSelector';
import FileUpload from './FileUpload';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedBot, setSelectedBot] = useState('main');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const { user } = useAuth();
  const { socket, sendMessage, isConnected } = useSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('message', handleNewMessage);
      socket.on('typing', setIsTyping);
      socket.on('session_created', setSessionId);
      
      return () => {
        socket.off('message');
        socket.off('typing');
        socket.off('session_created');
      };
    }
  }, [socket]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return;

    const message = {
      content: inputValue,
      botType: selectedBot,
      sessionId: sessionId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, { ...message, role: 'user' }]);
    setInputValue('');
    
    await sendMessage(message);
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    setIsTyping(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="h6">AI Resume Assistant</Typography>
        <BotSelector 
          selectedBot={selectedBot} 
          onSelectBot={setSelectedBot} 
        />
      </Paper>

      {/* Message Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList 
          messages={messages} 
          isTyping={isTyping}
          currentUser={user}
        />
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileUpload onFileSelect={handleFileUpload} />
          <TextField
            fullWidth
            placeholder="Ask me anything about your career..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            variant="outlined"
            size="small"
          />
          <IconButton onClick={handleSendMessage} disabled={!inputValue.trim()}>
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
```

### Specialized Bot Components
```jsx
// ATSScoreDisplay.jsx - ATS scoring visualization
import React from 'react';
import { 
  Box, Typography, LinearProgress, Chip, 
  Card, CardContent, List, ListItem, ListItemText 
} from '@mui/material';
import { CheckCircle, Warning, Error } from '@mui/icons-material';

const ATSScoreDisplay = ({ scoreData }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle color="success" />;
    if (score >= 60) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ATS Compatibility Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getScoreIcon(scoreData.overall)}
            <Typography variant="h4" color={getScoreColor(scoreData.overall)}>
              {scoreData.overall}/100
            </Typography>
          </Box>
        </Box>

        {/* Score Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Score Breakdown
          </Typography>
          {Object.entries(scoreData.breakdown).map(([category, score]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {category}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {score}/100
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={score} 
                color={getScoreColor(score)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </Box>

        {/* Improvement Suggestions */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Improvement Suggestions
          </Typography>
          <List dense>
            {scoreData.suggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={suggestion}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ATSScoreDisplay;
```

## 🔐 Security Implementation

### Authentication & Authorization
```javascript
// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Input Validation
const validateResumeUpload = [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('targetJob').optional().isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### Data Protection
```javascript
// Data Encryption for Sensitive Information
const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY;
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('additional data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('additional data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## 🚀 Deployment Strategies

### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]

# Frontend Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ai-resume-assistant
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  mongodb_data:
  redis_data:
```

### Cloud Deployment Options

#### AWS Deployment
```bash
# Using AWS ECS with Fargate
aws ecs create-cluster --cluster-name ai-resume-assistant
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster ai-resume-assistant --service-name app-service

# Using AWS Lambda for serverless functions
serverless deploy --stage production
```

#### Google Cloud Platform
```bash
# Using Google Cloud Run
gcloud run deploy ai-resume-assistant-backend --source ./backend --platform managed
gcloud run deploy ai-resume-assistant-frontend --source ./frontend --platform managed
```

#### Heroku Deployment
```bash
# Heroku deployment
heroku create ai-resume-assistant-backend
heroku create ai-resume-assistant-frontend
git subtree push --prefix backend heroku-backend main
git subtree push --prefix frontend heroku-frontend main
```

## 🧪 Testing Framework

### Backend Testing
```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../server');
const User = require('../../src/models/User');

describe('Authentication', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
    });
  });
});

// tests/unit/atsScoring.test.js
const ATSScoringService = require('../../src/services/ATSScoringService');

describe('ATS Scoring Service', () => {
  const atsService = new ATSScoringService();

  it('should calculate ATS score correctly', async () => {
    const resumeText = 'Sample resume content with JavaScript React Node.js';
    const jobDescription = 'Looking for JavaScript developer with React experience';

    const result = await atsService.calculateScore(resumeText, jobDescription);

    expect(result.overall).toBeGreaterThan(0);
    expect(result.breakdown).toHaveProperty('keywords');
    expect(result.suggestions).toBeInstanceOf(Array);
  });
});
```

### Frontend Testing
```javascript
// tests/components/ChatInterface.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ChatInterface from '../src/components/Chat/ChatInterface';
import { AuthContext } from '../src/context/AuthContext';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient();
  const mockAuthValue = {
    user: { id: '1', email: 'test@example.com' },
    token: 'mock-token'
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthValue}>
        {component}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('ChatInterface', () => {
  it('should send message when enter is pressed', async () => {
    renderWithProviders(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });
});
```

## 📈 Performance Optimization

### Caching Strategy
```javascript
// Redis caching implementation
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

class CacheService {
  static async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Cache ATS scores for 24 hours
  static async cacheATSScore(resumeId, score) {
    const key = `ats_score:${resumeId}`;
    await this.set(key, score, 86400); // 24 hours
  }

  static async getATSScore(resumeId) {
    const key = `ats_score:${resumeId}`;
    return await this.get(key);
  }
}
```

### Database Optimization
```javascript
// Optimized MongoDB queries with aggregation
class ResumeService {
  static async getResumeAnalytics(userId) {
    return await Resume.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalResumes: { $sum: 1 },
          averageScore: { $avg: '$atsScore.overall' },
          highestScore: { $max: '$atsScore.overall' },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ]);
  }

  static async searchResumes(userId, query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return await Resume.find({
      userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { 'content.summary': { $regex: query, $options: 'i' } },
        { 'content.skills.technical': { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Returns plain JavaScript objects for better performance
  }
}
```

## 🔮 Future Enhancement Roadmap

### Phase 1: Core Enhancements (Q1 2025)
- **Advanced AI Models**: Integration with Claude, Gemini, and specialized models
- **Voice Interface**: Speech-to-text and text-to-speech capabilities
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Comprehensive user analytics and insights dashboard
- **A/B Testing**: Built-in A/B testing framework for feature optimization

### Phase 2: Enterprise Features (Q2 2025)
- **Multi-tenant Architecture**: Support for enterprise customers
- **Custom AI Training**: Fine-tuned models for specific industries
- **Advanced Security**: SOC 2 compliance and enterprise security features
- **API Marketplace**: Third-party integrations and API ecosystem
- **White-label Solutions**: Customizable branding for partners

### Phase 3: Advanced Intelligence (Q3 2025)
- **Predictive Analytics**: Career path prediction and market trend analysis
- **Computer Vision**: Resume layout analysis and design optimization
- **Blockchain Integration**: Verified credentials and skill certifications
- **AR/VR Interview**: Virtual reality interview practice environments
- **IoT Integration**: Smart device integrations for seamless experience

### Phase 4: Global Expansion (Q4 2025)
- **Multi-language Support**: Support for 20+ languages
- **Regional Job Markets**: Country-specific job search and requirements
- **Cultural Adaptation**: Region-specific resume formats and practices
- **Global Compliance**: GDPR, CCPA, and other regional privacy regulations
- **Localized AI Models**: Culture-aware AI responses and recommendations

## 📞 Support & Documentation

### Getting Help
- **Documentation**: [docs.airesumeassistant.com](https://docs.airesumeassistant.com)
- **API Reference**: [api.airesumeassistant.com](https://api.airesumeassistant.com)
- **Community Forum**: [community.airesumeassistant.com](https://community.airesumeassistant.com)
- **Support Email**: support@airesumeassistant.com

### Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments
- OpenAI for providing advanced AI capabilities
- LinkedIn for job search API integration
- The MERN stack community for excellent tools and libraries
- Contributors and beta testers who made this project possible

---

**Built with ❤️ by the AI Resume Assistant Team**

*Empowering careers through intelligent technology*
