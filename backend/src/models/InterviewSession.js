// backend/src/models/InterviewSession.js

import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
    },
    transcript: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    answerText: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    behaviorMetrics: {
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      eyeContact: { type: Number, min: 0, max: 100, default: 0 },
      smile: { type: Number, min: 0, max: 100, default: 0 },
      neutral: { type: Number, min: 0, max: 100, default: 0 },
      nervous: { type: Number, min: 0, max: 100, default: 0 },
      happy: { type: Number, min: 0, max: 100, default: 0 },
      sad: { type: Number, min: 0, max: 100, default: 0 },
      angry: { type: Number, min: 0, max: 100, default: 0 },
      surprised: { type: Number, min: 0, max: 100, default: 0 },
    },
    aiEvaluation: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      suggestions: [{ type: String }],
      communicationRating: { type: Number, min: 0, max: 10 },
      confidenceRating: { type: Number, min: 0, max: 10 },
      rawFeedback: { type: String },
    },
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
      index: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
      },
    ],
    answers: [AnswerSchema],
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    finalReport: {
  overallScore: Number,
  strengths: [String],
  weaknesses: [String],
  suggestions: [String],
  communicationRating: Number,
  confidenceRating: Number,

  facialScores: mongoose.Schema.Types.Mixed,
  facialAnalysis: mongoose.Schema.Types.Mixed,
  behaviorMetrics: mongoose.Schema.Types.Mixed,
  answerEvaluation: mongoose.Schema.Types.Mixed,

  generatedAt: Date,
  aiModel: String
},

  },
  {
    timestamps: true,
  }
);

InterviewSessionSchema.index({ userId: 1, startedAt: -1 });
InterviewSessionSchema.index({ status: 1, startedAt: -1 });

InterviewSessionSchema.methods.markCompleted = function () {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

InterviewSessionSchema.methods.addAnswer = function (answerData) {
  this.answers.push(answerData);
  return this.save();
};

InterviewSessionSchema.methods.setFinalReport = function (report) {
  this.finalReport = {
    ...report,
    generatedAt: new Date(),
  };
  return this.save();
};

export default mongoose.model('InterviewSession', InterviewSessionSchema);
