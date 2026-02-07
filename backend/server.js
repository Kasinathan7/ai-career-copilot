// file: server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';
import 'dotenv/config';

import { seedCodingProblems } from './src/services/codingSeedService.js';
import { seedAptitudeQuestions } from './src/services/aptitudeSeedService.js';
import { seedInterviewQuestions } from './src/services/interviewSeedService.js';

import {
  corsMiddleware,
  securityHeaders,
  requestLogger,
  errorHandler,
  notFoundHandler
} from './src/middleware/index.js';

import apiRoutes from './src/routes/index.js';
import SocketIOService from './src/services/SocketIOService.js';
import { initializeJobSources } from './src/controllers/externalJobsController.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

// OpenRouter → OpenAI SDK compatibility
if (process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
  console.log('✅ Using OpenRouter API key (aliased for OpenAI SDK compatibility)');
}

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 5000;

//mongodb+srv://kasinathant46:ktjk@4474@cluster0.senquza.mongodb.net/?appName=Cluster0
// --------------------
// MongoDB Connection
// --------------------
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI;

    logger.info('Attempting to connect to MongoDB');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4,
      maxPoolSize: 10,
      bufferCommands: false
    });

    logger.info('MongoDB Connected successfully');

    await seedCodingProblems();
    await seedAptitudeQuestions();
    await seedInterviewQuestions();

    logger.info('✅ Coding problems seeded (if empty)');
    logger.info('✅ Aptitude questions seeded (if empty)');

    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  } catch (error) {
    logger.error('Database connection failed:', error);
    logger.warn('Server will continue without database connection');
  }
};

connectDB();

// --------------------
// Middleware
// --------------------
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);
app.use(corsMiddleware);
app.use(securityHeaders);

if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// --------------------
// Socket.IO
// --------------------
const io = SocketIOService.initialize(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.set('socketService', SocketIOService);

// --------------------
// Routes
// --------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Resume Assistant API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'AI Resume Assistant API',
    version: '1.0.0',
    description: 'AI-powered resume building and job search assistance platform',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      resumes: '/api/v1/resumes',
      chat: '/api/v1/chat',
      jobs: '/api/v1/jobs',
      coding: '/api/v1/coding',
      aptitude: '/api/v1/aptitude'
    }
  });
});

app.use('/api', apiRoutes);

// --------------------
// Shutdown Handling
// --------------------
const shutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(() => logger.info('HTTP server closed'));

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// --------------------
// Error handlers
// --------------------
app.use(notFoundHandler);
app.use(errorHandler);

// --------------------
// Start Server
// --------------------
server.listen(PORT, async () => {
  logger.info(`🚀 AI Resume Assistant API server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API root: http://localhost:${PORT}/api`);

  await initializeJobSources();
});

export default app;
