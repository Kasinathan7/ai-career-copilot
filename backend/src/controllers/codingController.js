// file: backend/src/controllers/codingController.js
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import { executeLocally } from '../services/codeExecutionService.js';

export const getProblems = async (req, res) => {
  const problems = await CodingProblem.find().lean();
  res.json({ success: true, data: problems });
};

export const submitCode = async (req, res) => {
  const { problemId, language, code } = req.body;

  const problem = await CodingProblem.findById(problemId);
  if (!problem) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }

  const tests = [...problem.publicTests, ...problem.hiddenTests];

  const result = await executeLocally(language, code, tests);

  await CodingSubmission.create({
    userId: 'guest',
    problemId,
    language,
    code,
    result
  });

  res.json({ success: true, data: result });
};
