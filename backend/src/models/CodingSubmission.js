// file: backend/src/models/CodingSubmission.js
import mongoose from 'mongoose';

const codingSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  language: { type: String, enum: ['javascript', 'python'], required: true },
  code: { type: String, required: true },
  result: {
    passed: Boolean,
    output: String,
    error: String
  }
}, { timestamps: true });

export default mongoose.model('CodingSubmission', codingSubmissionSchema);
