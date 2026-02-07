// file: backend/src/models/CodingProblem.js
import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true }
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    javascript: { type: String, required: true },
    python: { type: String, required: true }
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    starterCode: { type: starterCodeSchema, required: true },
    publicTests: { type: [testCaseSchema], default: [] },
    hiddenTests: { type: [testCaseSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('CodingProblem', codingProblemSchema);
