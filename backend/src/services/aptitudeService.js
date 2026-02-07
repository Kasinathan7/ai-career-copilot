// file: backend/src/services/aptitudeService.js
import AptitudeQuestion from '../models/AptitudeQuestion.js';

export const getNextDifficulty = (current, correctStreak, wrongStreak) => {
  if (correctStreak >= 2) {
    if (current === 'easy') return 'medium';
    if (current === 'medium') return 'hard';
  }
  if (wrongStreak >= 2) {
    if (current === 'hard') return 'medium';
    if (current === 'medium') return 'easy';
  }
  return current;
};

export const getRandomQuestion = async (difficulty) => {
  const count = await AptitudeQuestion.countDocuments({ difficulty });
  const rand = Math.floor(Math.random() * count);
  const q = await AptitudeQuestion.findOne({ difficulty }).skip(rand);
  return q;
};
