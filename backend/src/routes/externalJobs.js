import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/index.js';
import {
  searchExternalJobs,
  getExternalJobDetails,
  getJobSourceStats,
  testJobSourceConnections,
  searchJobsWithAI
} from '../controllers/externalJobsController.js';

const router = express.Router();

// AI-powered job search (with optional auth)
router.post('/search-ai', optionalAuth, searchJobsWithAI);

// Public routes for external job search (with optional auth for personalization)
router.get('/search', searchExternalJobs);
router.get('/job/:source/:jobId', getExternalJobDetails);

// Protected routes for management and stats
router.get('/stats', verifyToken, getJobSourceStats);
router.get('/test-connections', verifyToken, testJobSourceConnections);

export default router;