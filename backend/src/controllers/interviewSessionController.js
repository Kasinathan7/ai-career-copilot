import InterviewSession from '../models/InterviewSession.js';
import InterviewQuestion from '../models/InterviewQuestion.js';
import crypto from 'crypto';

import * as evaluationService from '../services/interviewEvaluationService.js';

const MAX_QUESTIONS_PER_SESSION = 3;

const generateSessionId = () => crypto.randomUUID();

/* ================================
   CREATE SESSION
================================ */

export const createSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.create({
      sessionId: generateSessionId(),
      userId: req.user?.id || 'guest',
      status: 'active',
      questions: [],
      totalQuestions: 0,
      answers: [],
      finalReport: null
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/* ================================
   NEXT QUESTION
================================ */

export const getNextQuestions = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.json({ success: true, completed: true });
    }

    if (session.answers.length >= MAX_QUESTIONS_PER_SESSION) {
      await finalizeSession(session);
      return res.json({ success: true, completed: true });
    }

    const answeredIds = session.answers.map(a => a.questionId.toString());

    const question = await InterviewQuestion.findOne({
      _id: { $nin: answeredIds },
      isActive: true
    });

    if (!question) {
      await finalizeSession(session);
      return res.json({ success: true, completed: true });
    }

    session.questions.push(question._id);
    session.totalQuestions = session.questions.length;
    await session.save();

    res.json({
      success: true,
      data: {
        questionId: question._id.toString(),
        question: question.question,
        category: question.category,
        difficulty: question.difficulty
      }
    });
  } catch (err) {
    console.error('getNextQuestions failed:', err);
    next(err);
  }
};

/* ================================
   SUBMIT ANSWER
================================ */

export const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, transcript, answerText, durationSeconds, behaviorMetrics } = req.body;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    let aiEvaluation = null;

    try {
      const questionDoc = await InterviewQuestion.findById(questionId);

aiEvaluation = await evaluationService.evaluateAnswer({
  question: questionDoc?.question || '',
  answer: transcript || '',
  behaviorMetrics
});
    } catch (err) {
      console.warn('Per-answer evaluation failed');
    }

    session.answers.push({
      questionId,
      transcript: transcript || '',
      answerText: answerText || transcript || '',
      durationSeconds: durationSeconds || 0,
      behaviorMetrics: behaviorMetrics || {},
      aiEvaluation
    });

    await session.save();

    if (session.answers.length >= MAX_QUESTIONS_PER_SESSION) {
      await finalizeSession(session);
      return res.json({ success: true, completed: true });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Submit answer failed:', err);
    next(err);
  }
};

/* ================================
   FINALIZE SESSION
================================ */

async function finalizeSession(session) {
  if (session.status === 'completed') return;

  let finalReport;

  try {
    finalReport = await evaluationService.generateFinalReport(session.answers);
  } catch (err) {
    console.error('Final report generation failed:', err);

    finalReport = {
      overallScore: 0,
      strengths: [],
      weaknesses: ['Evaluation failed'],
      suggestions: ['Try again later'],
      communicationRating: 0,
      confidenceRating: 0,
      facialScores: {},
      facialAnalysis: {},
      behaviorMetrics: {},
      answerEvaluation: {}
    };
  }

  session.status = 'completed';
  session.completedAt = new Date();

  session.finalReport = {
    ...finalReport,
    aiModel: 'llama-3.3-70b-versatile',
    generatedAt: new Date()
  };

  await session.save();
}

/* ================================
   GET SESSION
================================ */

export const getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/* ================================
   DEFAULT EXPORT (required by router)
================================ */

export default {
  createSession,
  getNextQuestions,
  submitAnswer,
  getSessionById
};
