// backend/src/routes/interviewLive.js

import express from 'express';
import interviewSessionController from '../controllers/interviewSessionController.js';
import { optionalAuth } from '../middleware/index.js'; // ✅ use optionalAuth for guest access

const router = express.Router();

// Create new interview session (guest or authenticated)
router.post(
  '/sessions',
  optionalAuth,
  interviewSessionController.createSession
);

// Get questions for a session
router.post(
  '/sessions/:sessionId/questions',
  optionalAuth,
  interviewSessionController.getNextQuestions
);

// Submit answer for a question
router.post(
  '/sessions/:sessionId/answers',
  optionalAuth,
  interviewSessionController.submitAnswer
);

// Get full interview session details + final report
router.get(
  '/sessions/:sessionId',
  optionalAuth,
  interviewSessionController.getSessionById
);

export default router;
