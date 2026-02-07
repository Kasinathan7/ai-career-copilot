// backend/src/models/InterviewQuestion.js

import mongoose from 'mongoose';

const InterviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['general', 'behavioral', 'technical', 'company', 'career', 'communication'],
      default: 'general',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

InterviewQuestionSchema.index({ category: 1, difficulty: 1 });

export default mongoose.model('InterviewQuestion', InterviewQuestionSchema);
