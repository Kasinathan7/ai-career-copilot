// file: backend/src/models/AptitudeQuestion.js
import mongoose from 'mongoose';

const AptitudeQuestionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      enum: ['logical', 'quantitative', 'verbal'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    },
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: (v) => v.length === 4
    },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.models.AptitudeQuestion ||
  mongoose.model('AptitudeQuestion', AptitudeQuestionSchema);
