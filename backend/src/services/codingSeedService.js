// file: backend/src/services/codingSeedService.js
import CodingProblem from '../models/CodingProblem.js';

export const seedCodingProblems = async () => {
  const count = await CodingProblem.countDocuments();
  if (count > 0) return;

  await CodingProblem.insertMany([
    {
      title: 'Max Number',
      description: 'Return the maximum number from the array.',
      starterCode: {
        javascript: 'function max_number(arr) {\n  // your code here\n}\n',
        python: 'def max_number(arr):\n    # your code here\n    pass\n'
      },
      publicTests: [
        { input: '[1,5,3]', output: '5' }
      ],
      hiddenTests: [
        { input: '[10,2,8]', output: '10' }
      ]
    }
  ]);
};
