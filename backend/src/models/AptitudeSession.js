// file: backend/src/models/AptitudeSession.js
import mongoose from 'mongoose';

const TopicStatsSchema = new mongoose.Schema(
  {
    asked: { type: Number, default: 0 },
    correct: { type: Number, default: 0 }
  },
  { _id: false }
);

const AptitudeSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },

    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      required: true
    },

    score: { type: Number, default: 0 },
    correctStreak: { type: Number, default: 0 },
    wrongStreak: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },

    askedQuestionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' }
    ],

    topicRotationIndex: { type: Number, default: 0 },

    topicStats: {
      logical: { type: TopicStatsSchema, default: () => ({}) },
      quantitative: { type: TopicStatsSchema, default: () => ({}) },
      verbal: { type: TopicStatsSchema, default: () => ({}) }
    }
  },
  { timestamps: true }
);

export default mongoose.model('AptitudeSession', AptitudeSessionSchema);
