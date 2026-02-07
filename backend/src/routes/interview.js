import express from 'express';
import {
  generateQuestion,
  analyzeAnswer,
  getPersonalizedTips,
  generateMockInterview
} from '../controllers/interviewController.js';
import { optionalAuth } from '../middleware/index.js';

const router = express.Router();

// All routes allow guest access
router.post('/generate-question', optionalAuth, generateQuestion);
router.post('/analyze-answer', optionalAuth, analyzeAnswer);
router.post('/personalized-tips', optionalAuth, getPersonalizedTips);
router.post('/mock-interview', optionalAuth, generateMockInterview);

export default router;
