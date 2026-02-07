import express from 'express';
import {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  uploadResumeFile,
  processUploadedResume,
  getATSScore,
  getResumeVersions,
  createResumeVersion,
  optimizeForJob,
  generateATSOptimizedPDF,
  analyzeUploadedResume,
  buildResumeWithAI,
  generateResumeFromText,
  generateResumePDF
} from '../controllers/resumeController.js';
import { verifyToken, optionalAuth, subscriptionRateLimit } from '../middleware/index.js';

const router = express.Router();

// Rate limiting based on subscription
const resumeRateLimits = {
  free: { resumes: 3, atsAnalyses: 10 },
  pro: { resumes: 25, atsAnalyses: 100 },
  premium: { resumes: -1, atsAnalyses: -1 }
};

// ATS features - Allow guest access
router.post('/analyze', optionalAuth, uploadResumeFile, analyzeUploadedResume);
router.post('/generate-ats-pdf', optionalAuth, uploadResumeFile, generateATSOptimizedPDF);
router.post('/build-with-ai', optionalAuth, uploadResumeFile, buildResumeWithAI);

// NEW: Text-based resume generation (no file upload)
router.post('/generate-from-text', optionalAuth, generateResumeFromText);
router.post('/generate-pdf', optionalAuth, generateResumePDF);

// Apply authentication to remaining routes
router.use(verifyToken);

// Resume CRUD routes
router.post('/', subscriptionRateLimit(resumeRateLimits), createResume);
router.get('/', getResumes);
router.get('/:resumeId', getResume);
router.put('/:resumeId', updateResume);
router.delete('/:resumeId', deleteResume);

// File upload routes
router.post('/upload', uploadResumeFile, processUploadedResume);

// ATS and optimization routes
router.post('/:resumeId/ats-score', subscriptionRateLimit(resumeRateLimits), getATSScore);
router.post('/:resumeId/optimize', subscriptionRateLimit(resumeRateLimits), optimizeForJob);

// Version management routes
router.get('/:resumeId/versions', getResumeVersions);
router.post('/:resumeId/versions', createResumeVersion);

export default router;