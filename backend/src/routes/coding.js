// file: backend/src/routes/coding.js
import express from 'express';
import { getProblems, submitCode } from '../controllers/codingController.js';

const router = express.Router();

router.get('/problems', getProblems);
router.post('/submit', submitCode);

export default router;
