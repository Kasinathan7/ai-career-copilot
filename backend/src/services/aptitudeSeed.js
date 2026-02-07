// file: backend/src/services/aptitudeSeed.js
import AptitudeQuestion from '../models/AptitudeQuestion.js';

export const seedAptitudeQuestions = async () => {
  const count = await AptitudeQuestion.countDocuments();
  if (count > 0) return;

  const questions = [
    {
      topic: 'logical',
      difficulty: 'easy',
      question: 'If A = 1, B = 2, what is C?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 2,
      explanation: 'Alphabet position'
    },
    {
      topic: 'quantitative',
      difficulty: 'medium',
      question: 'What is 25% of 200?',
      options: ['25', '50', '75', '100'],
      correctAnswer: 1,
      explanation: '25% = 50'
    },
    {
      topic: 'verbal',
      difficulty: 'hard',
      question: 'Choose the synonym of "Obsolete"',
      options: ['Modern', 'New', 'Outdated', 'Fresh'],
      correctAnswer: 2,
      explanation: 'Obsolete means outdated'
    }
  ];

  await AptitudeQuestion.insertMany(questions);
};
