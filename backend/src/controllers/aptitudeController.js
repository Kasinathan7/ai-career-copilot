// file: backend/src/controllers/aptitudeController.js
import AptitudeSession from '../models/AptitudeSession.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import mongoose from 'mongoose';

export const startSession = async (req, res) => {
  try {
    const sessionId = new mongoose.Types.ObjectId().toString();

    const session = new AptitudeSession({
      sessionId,
      currentDifficulty: 'medium',
      score: 0,
      correctStreak: 0,
      wrongStreak: 0,
      totalQuestions: 0,
      askedQuestionIds: [],
      topicRotationIndex: 0,
      topicStats: {
        logical: { asked: 0, correct: 0 },
        quantitative: { asked: 0, correct: 0 },
        verbal: { asked: 0, correct: 0 }
      }
    });

    await session.save();

    console.log('Aptitude session created:', sessionId);

    return res.status(200).json({
      success: true,
      sessionId
    });
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getNextQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AptitudeSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const topics = ['logical', 'quantitative', 'verbal'];
    const topic = topics[session.topicRotationIndex % topics.length];

    const question = await AptitudeQuestion.findOne({
      topic,
      difficulty: session.currentDifficulty,
      _id: { $nin: session.askedQuestionIds }
    });

    if (!question) {
      return res.status(200).json({ success: false, message: 'No questions available' });
    }

    session.askedQuestionIds.push(question._id);
    session.topicRotationIndex += 1;
    await session.save();

    return res.status(200).json({
      success: true,
      data: {
        questionId: question._id.toString(),
        topic: question.topic,
        difficulty: question.difficulty,
        question: question.question,
        options: question.options
      }
    });
  } catch (err) {
    console.error('getNextQuestion error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, selectedIndex } = req.body;

    const session = await AptitudeSession.findOne({ sessionId });
    const question = await AptitudeQuestion.findById(questionId);

    if (!session || !question) {
      return res.status(404).json({ success: false, message: 'Invalid session or question' });
    }

    const topic = question.topic;

    if (!session.topicStats[topic]) {
      session.topicStats[topic] = { asked: 0, correct: 0 };
    }

    const correct = question.options[selectedIndex] === question.correctAnswer;

    session.totalQuestions += 1;
    session.topicStats[topic].asked += 1;

    if (correct) {
      session.score += 1;
      session.correctStreak += 1;
      session.wrongStreak = 0;
      session.topicStats[topic].correct += 1;
    } else {
      session.wrongStreak += 1;
      session.correctStreak = 0;
    }

    if (session.correctStreak >= 2 && session.currentDifficulty !== 'hard') {
      session.currentDifficulty =
        session.currentDifficulty === 'easy' ? 'medium' : 'hard';
      session.correctStreak = 0;
    }

    if (session.wrongStreak >= 2 && session.currentDifficulty !== 'easy') {
      session.currentDifficulty =
        session.currentDifficulty === 'hard' ? 'medium' : 'easy';
      session.wrongStreak = 0;
    }

    await session.save();

    return res.status(200).json({
      correct,
      explanation: question.explanation,
      currentDifficulty: session.currentDifficulty,
      score: session.score,
      total: session.totalQuestions
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const endAssessment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AptitudeSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalQuestions: session.totalQuestions,
        score: session.score,
        difficulty: session.currentDifficulty,
        topicStats: session.topicStats
      }
    });
  } catch (err) {
    console.error('endAssessment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
