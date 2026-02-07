# AI Resume Assistant - Backend

Express.js API server with MongoDB and OpenAI integration for the AI Resume Assistant platform.

## 🚀 Features

- **Multi-Bot AI System** with OpenAI GPT-4
- **JWT Authentication** with refresh tokens
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time chat
- **File Upload** with resume parsing (PDF/DOC/DOCX)
- **Job Search Integration** with external APIs
- **Rate Limiting** and security middleware
- **Comprehensive Testing** with Jest

## 🛠️ Technology Stack

- Node.js + Express.js
- MongoDB + Mongoose
- OpenAI GPT-4 API
- Socket.io
- JWT Authentication
- Multer (file uploads)
- Winston (logging)
- Jest (testing)

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key
- `RAPIDAPI_KEY` - RapidAPI key for job search

## 🚀 Development

```bash
npm run dev
```

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure

```
src/
├── controllers/      # Route controllers
├── models/          # Database models
├── services/        # Business logic services
├── middleware/      # Custom middleware
├── routes/          # API routes
├── utils/           # Utility functions
└── scripts/         # Database scripts
```

## 🤖 AI Chatbots

1. **Main Assistant** - Orchestrates other bots
2. **ATS Scorer** - Resume analysis and optimization
3. **Resume Builder** - Interactive resume creation
4. **Mock Interviewer** - Practice interviews
5. **Job Suggester** - Career recommendations
6. **Job Searcher** - Find job opportunities

## 🔒 Security

- JWT authentication with refresh tokens
- Input validation with Joi
- Rate limiting per endpoint
- File upload restrictions
- CORS protection
- Helmet security headers

Built with ❤️ using Node.js and Express
