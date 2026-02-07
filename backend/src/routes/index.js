// backend/src/routes/index.js

import express from 'express';

import authRoutes from './auth.js';
import userRoutes from './users.js';
import resumeRoutes from './resumes.js';
import chatRoutes from './chat.js';
import jobRoutes from './jobs.js';
import externalJobRoutes from './externalJobs.js';
import interviewRoutes from './interview.js';
import interviewLiveRoutes from './interviewLive.js'; // ✅ ADD
import codingRoutes from './coding.js';
import aptitudeRoutes from './aptitude.js';

const router = express.Router();

// API version
const API_VERSION = '/v1';

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route handlers
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/resumes`, resumeRoutes);
router.use(`${API_VERSION}/chat`, chatRoutes);
router.use(`${API_VERSION}/jobs`, jobRoutes);
router.use(`${API_VERSION}/external-jobs`, externalJobRoutes);
router.use(`${API_VERSION}/interview`, interviewRoutes);       // existing mock interview
router.use(`${API_VERSION}/interview`, interviewLiveRoutes);   // ✅ live interview
router.use(`${API_VERSION}/coding`, codingRoutes);
router.use(`${API_VERSION}/aptitude`, aptitudeRoutes);

export default router;
