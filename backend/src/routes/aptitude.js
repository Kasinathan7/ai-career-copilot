// file: backend/src/routes/aptitude.js
import express from 'express';
import {
  startSession,
  getNextQuestion,
  submitAnswer,
  endAssessment
} from '../controllers/aptitudeController.js';

const router = express.Router();

router.post('/start', startSession);
router.get('/next/:sessionId', getNextQuestion);
router.post('/answer', submitAnswer);
router.post('/end/:sessionId', endAssessment);

export default router;
