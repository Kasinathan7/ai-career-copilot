import express from 'express';
import {
  createJobSearch,
  getJobSearches,
  getJobSearch,
  updateJobSearch,
  deleteJobSearch,
  saveJob,
  getSavedJobs,
  updateSavedJob,
  removeSavedJob,
  getJobMatchAnalysis,
  getJobSearchAnalytics
} from '../controllers/jobsController.js';
import { verifyToken, subscriptionRateLimit } from '../middleware/index.js';

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Rate limiting based on subscription
const jobRateLimits = {
  free: { jobSearches: 20 },
  pro: { jobSearches: 200 },
  premium: { jobSearches: -1 }
};

// Job search routes
router.post('/searches', subscriptionRateLimit(jobRateLimits), createJobSearch);
router.get('/searches', getJobSearches);
router.get('/searches/:searchId', getJobSearch);
router.put('/searches/:searchId', updateJobSearch);
router.delete('/searches/:searchId', deleteJobSearch);

// Saved jobs routes
router.post('/saved', saveJob);
router.get('/saved', getSavedJobs);
router.put('/saved/:jobId', updateSavedJob);
router.delete('/saved/:jobId', removeSavedJob);

// Job analysis routes
router.get('/saved/:jobId/match-analysis', getJobMatchAnalysis);

// Analytics routes
router.get('/analytics', getJobSearchAnalytics);

export default router;