// backend/src/services/interviewSeedService.js

import InterviewQuestion from '../models/InterviewQuestion.js';
import * as logger from '../utils/logger.js'; // ✅ FIX

const DEFAULT_QUESTIONS = [
  { question: 'Tell me about yourself.', category: 'general', difficulty: 'easy' },
  { question: 'What are your biggest strengths?', category: 'behavioral', difficulty: 'easy' },
  { question: 'What is your biggest weakness?', category: 'behavioral', difficulty: 'easy' },
  { question: 'Why do you want to work for our company?', category: 'company', difficulty: 'medium' },
  { question: 'Describe a challenging situation and how you handled it.', category: 'behavioral', difficulty: 'medium' },
  { question: 'Where do you see yourself in 5 years?', category: 'career', difficulty: 'medium' },
  { question: 'Explain a project you are proud of.', category: 'technical', difficulty: 'medium' },
  { question: 'How do you handle tight deadlines?', category: 'behavioral', difficulty: 'medium' },
  { question: 'Describe a conflict you had at work and how you resolved it.', category: 'behavioral', difficulty: 'medium' },
  { question: 'What motivates you at work?', category: 'general', difficulty: 'easy' },
  { question: 'Explain a technical concept to a non-technical person.', category: 'communication', difficulty: 'medium' },
  { question: 'How do you prioritize tasks?', category: 'behavioral', difficulty: 'easy' },
  { question: 'What was your biggest professional failure?', category: 'behavioral', difficulty: 'hard' },
  { question: 'Describe a time you showed leadership.', category: 'behavioral', difficulty: 'medium' },
  { question: 'How do you handle feedback?', category: 'behavioral', difficulty: 'easy' },
  { question: 'What makes you different from other candidates?', category: 'general', difficulty: 'medium' },
  { question: 'Describe a time you had to learn something quickly.', category: 'behavioral', difficulty: 'medium' },
  { question: 'How do you deal with stress at work?', category: 'behavioral', difficulty: 'easy' },
  { question: 'Explain a complex bug you fixed.', category: 'technical', difficulty: 'hard' },
  { question: 'What does success mean to you?', category: 'general', difficulty: 'easy' }
];

export const seedInterviewQuestions = async () => {
  try {
    const count = await InterviewQuestion.countDocuments();

    if (count > 0) {
      logger.info?.('Interview questions already seeded');
      return;
    }

    await InterviewQuestion.insertMany(DEFAULT_QUESTIONS);
    logger.info?.(`Seeded ${DEFAULT_QUESTIONS.length} interview questions`);
  } catch (error) {
    logger.error?.('Failed to seed interview questions', error);
    throw error;
  }
};
