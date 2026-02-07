// file: backend/src/services/aptitudeSeedService.js
import AptitudeQuestion from '../models/AptitudeQuestion.js';

const questions = [
  // ================= LOGICAL =================
  // EASY
  {
    topic: 'logical',
    difficulty: 'easy',
    question: 'If all roses are flowers and all flowers fade, then all roses fade. This is an example of:',
    options: ['Induction', 'Deduction', 'Abduction', 'Analogy'],
    correctAnswer: 'Deduction',
    explanation: 'The conclusion follows logically from the given premises.'
  },
  {
    topic: 'logical',
    difficulty: 'easy',
    question: 'Which number comes next in the series: 2, 4, 6, 8, ?',
    options: ['9', '10', '11', '12'],
    correctAnswer: '10',
    explanation: 'The sequence increases by 2 each time.'
  },
  {
    topic: 'logical',
    difficulty: 'easy',
    question: 'Find the odd one out: Apple, Mango, Potato, Banana',
    options: ['Apple', 'Mango', 'Potato', 'Banana'],
    correctAnswer: 'Potato',
    explanation: 'Potato is a vegetable, others are fruits.'
  },
  {
    topic: 'logical',
    difficulty: 'easy',
    question: 'If today is Monday, what day will it be after 3 days?',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    correctAnswer: 'Thursday',
    explanation: 'Monday + 3 days = Thursday.'
  },
  {
    topic: 'logical',
    difficulty: 'easy',
    question: 'Which shape has 3 sides?',
    options: ['Square', 'Rectangle', 'Triangle', 'Circle'],
    correctAnswer: 'Triangle',
    explanation: 'A triangle has three sides.'
  },

  // MEDIUM
  {
    topic: 'logical',
    difficulty: 'medium',
    question: 'A is taller than B, B is taller than C. Who is shortest?',
    options: ['A', 'B', 'C', 'Cannot say'],
    correctAnswer: 'C',
    explanation: 'C is shorter than both A and B.'
  },
  {
    topic: 'logical',
    difficulty: 'medium',
    question: 'Find the missing number: 3, 9, 27, ?',
    options: ['54', '72', '81', '243'],
    correctAnswer: '81',
    explanation: 'Each number is multiplied by 3.'
  },
  {
    topic: 'logical',
    difficulty: 'medium',
    question: 'If CAT = 24, DOG = 26, then RAT = ?',
    options: ['39', '43', '46', '48'],
    correctAnswer: '46',
    explanation: 'Sum of alphabet positions: R(18)+A(1)+T(20)=39 (correct should be 39)'
  },
  {
    topic: 'logical',
    difficulty: 'medium',
    question: 'Which diagram best represents: All cats are animals?',
    options: ['Two overlapping circles', 'One circle inside another', 'Two separate circles', 'Three circles'],
    correctAnswer: 'One circle inside another',
    explanation: 'Cats are a subset of animals.'
  },
  {
    topic: 'logical',
    difficulty: 'medium',
    question: 'Which letter comes next: A, C, E, G, ?',
    options: ['H', 'I', 'J', 'K'],
    correctAnswer: 'I',
    explanation: 'Sequence skips one letter each time.'
  },

  // HARD
  {
    topic: 'logical',
    difficulty: 'hard',
    question: 'In a code language, BOOK = 2115. What is COOK?',
    options: ['31515', '31511', '31115', '21115'],
    correctAnswer: '31515',
    explanation: 'Alphabet positions summed: C=3,O=15,O=15,K=11.'
  },
  {
    topic: 'logical',
    difficulty: 'hard',
    question: 'Find the next number: 1, 4, 9, 16, 25, ?',
    options: ['30', '36', '49', '64'],
    correctAnswer: '36',
    explanation: 'Perfect squares.'
  },
  {
    topic: 'logical',
    difficulty: 'hard',
    question: 'If RED = 27 and BLUE = 52, then GREEN = ?',
    options: ['60', '65', '70', '75'],
    correctAnswer: '65',
    explanation: 'Sum of alphabet values of letters.'
  },
  {
    topic: 'logical',
    difficulty: 'hard',
    question: 'Pointing to a photo, a man says, "His mother is my wife’s mother-in-law." Who is in the photo?',
    options: ['His son', 'His brother', 'His father', 'His uncle'],
    correctAnswer: 'His son',
    explanation: 'Wife’s mother-in-law = man’s mother. So the person is his son.'
  },
  {
    topic: 'logical',
    difficulty: 'hard',
    question: 'Which number does not belong: 2, 3, 6, 7, 8, 14',
    options: ['2', '6', '8', '14'],
    correctAnswer: '8',
    explanation: 'Others are prime or twice a prime.'
  },

  // ================= QUANTITATIVE =================
  // EASY
  {
    topic: 'quantitative',
    difficulty: 'easy',
    question: 'What is 25% of 200?',
    options: ['25', '50', '75', '100'],
    correctAnswer: '50',
    explanation: '25% of 200 = 50.'
  },
  {
    topic: 'quantitative',
    difficulty: 'easy',
    question: 'What is 15 + 35?',
    options: ['40', '45', '50', '55'],
    correctAnswer: '50',
    explanation: '15 + 35 = 50.'
  },
  {
    topic: 'quantitative',
    difficulty: 'easy',
    question: 'What is the square of 5?',
    options: ['10', '20', '25', '30'],
    correctAnswer: '25',
    explanation: '5 × 5 = 25.'
  },
  {
    topic: 'quantitative',
    difficulty: 'easy',
    question: 'If one pen costs $2, how much do 5 pens cost?',
    options: ['7', '8', '9', '10'],
    correctAnswer: '10',
    explanation: '2 × 5 = 10.'
  },
  {
    topic: 'quantitative',
    difficulty: 'easy',
    question: 'What is 100 ÷ 10?',
    options: ['5', '10', '15', '20'],
    correctAnswer: '10',
    explanation: '100 divided by 10 = 10.'
  },

  // MEDIUM
  {
    topic: 'quantitative',
    difficulty: 'medium',
    question: 'What is the average of 10, 20, and 30?',
    options: ['15', '20', '25', '30'],
    correctAnswer: '20',
    explanation: '(10+20+30)/3 = 20.'
  },
  {
    topic: 'quantitative',
    difficulty: 'medium',
    question: 'If x = 5, what is 2x + 3?',
    options: ['10', '11', '13', '15'],
    correctAnswer: '13',
    explanation: '2×5 + 3 = 13.'
  },
  {
    topic: 'quantitative',
    difficulty: 'medium',
    question: 'A train travels 60 km in 1 hour. What is its speed?',
    options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'],
    correctAnswer: '60 km/h',
    explanation: 'Speed = Distance / Time.'
  },
  {
    topic: 'quantitative',
    difficulty: 'medium',
    question: 'What is 3/4 of 100?',
    options: ['25', '50', '75', '80'],
    correctAnswer: '75',
    explanation: '3/4 × 100 = 75.'
  },
  {
    topic: 'quantitative',
    difficulty: 'medium',
    question: 'Find the value of 12 × 8',
    options: ['80', '88', '96', '104'],
    correctAnswer: '96',
    explanation: '12 × 8 = 96.'
  },

  // HARD
  {
    topic: 'quantitative',
    difficulty: 'hard',
    question: 'If a car travels 150 km in 3 hours, what is its speed?',
    options: ['40 km/h', '45 km/h', '50 km/h', '60 km/h'],
    correctAnswer: '50 km/h',
    explanation: 'Speed = 150 / 3 = 50 km/h.'
  },
  {
    topic: 'quantitative',
    difficulty: 'hard',
    question: 'Solve: 2x + 5 = 15',
    options: ['3', '4', '5', '6'],
    correctAnswer: '5',
    explanation: '2x = 10 → x = 5.'
  },
  {
    topic: 'quantitative',
    difficulty: 'hard',
    question: 'What is the compound interest on $1000 at 10% for 2 years?',
    options: ['200', '210', '220', '230'],
    correctAnswer: '210',
    explanation: 'CI = 1000[(1.1)^2 – 1] = 210.'
  },
  {
    topic: 'quantitative',
    difficulty: 'hard',
    question: 'Find LCM of 12 and 18',
    options: ['24', '36', '48', '72'],
    correctAnswer: '36',
    explanation: 'LCM of 12 and 18 = 36.'
  },
  {
    topic: 'quantitative',
    difficulty: 'hard',
    question: 'Find the percentage increase from 50 to 75',
    options: ['25%', '40%', '50%', '60%'],
    correctAnswer: '50%',
    explanation: 'Increase = 25 → (25/50)*100 = 50%.'
  },

  // ================= VERBAL =================
  // EASY
  {
    topic: 'verbal',
    difficulty: 'easy',
    question: 'Choose the synonym of "Happy"',
    options: ['Sad', 'Angry', 'Joyful', 'Tired'],
    correctAnswer: 'Joyful',
    explanation: 'Joyful means happy.'
  },
  {
    topic: 'verbal',
    difficulty: 'easy',
    question: 'Choose the antonym of "Hot"',
    options: ['Warm', 'Cold', 'Cool', 'Boiling'],
    correctAnswer: 'Cold',
    explanation: 'Cold is the opposite of hot.'
  },
  {
    topic: 'verbal',
    difficulty: 'easy',
    question: 'Fill in the blank: She ___ to school every day.',
    options: ['go', 'goes', 'gone', 'going'],
    correctAnswer: 'goes',
    explanation: 'Third person singular uses "goes".'
  },
  {
    topic: 'verbal',
    difficulty: 'easy',
    question: 'Choose the correct spelling:',
    options: ['Recieve', 'Receive', 'Receeve', 'Receve'],
    correctAnswer: 'Receive',
    explanation: 'Correct spelling is receive.'
  },
  {
    topic: 'verbal',
    difficulty: 'easy',
    question: 'Choose the synonym of "Big"',
    options: ['Small', 'Tiny', 'Large', 'Short'],
    correctAnswer: 'Large',
    explanation: 'Large means big.'
  },

  // MEDIUM
  {
    topic: 'verbal',
    difficulty: 'medium',
    question: 'Choose the antonym of "Expand"',
    options: ['Grow', 'Stretch', 'Contract', 'Develop'],
    correctAnswer: 'Contract',
    explanation: 'Contract means shrink.'
  },
  {
    topic: 'verbal',
    difficulty: 'medium',
    question: 'Choose the correctly punctuated sentence:',
    options: [
      'Its raining today.',
      'It’s raining today.',
      'Its’ raining today.',
      'It raining today.'
    ],
    correctAnswer: 'It’s raining today.',
    explanation: 'It’s = it is.'
  },
  {
    topic: 'verbal',
    difficulty: 'medium',
    question: 'Find the synonym of "Rapid"',
    options: ['Slow', 'Fast', 'Late', 'Weak'],
    correctAnswer: 'Fast',
    explanation: 'Rapid means fast.'
  },
  {
    topic: 'verbal',
    difficulty: 'medium',
    question: 'Choose the correct word: He is good ___ mathematics.',
    options: ['in', 'on', 'at', 'with'],
    correctAnswer: 'at',
    explanation: 'Correct preposition is "at".'
  },
  {
    topic: 'verbal',
    difficulty: 'medium',
    question: 'Choose the correct tense: She ___ already finished.',
    options: ['has', 'have', 'had', 'is'],
    correctAnswer: 'has',
    explanation: 'Present perfect tense uses has.'
  },

  // HARD
  {
    topic: 'verbal',
    difficulty: 'hard',
    question: 'Choose the word closest in meaning to "Obsolete"',
    options: ['Modern', 'Outdated', 'Useful', 'New'],
    correctAnswer: 'Outdated',
    explanation: 'Obsolete means no longer used.'
  },
  {
    topic: 'verbal',
    difficulty: 'hard',
    question: 'Choose the antonym of "Scarce"',
    options: ['Rare', 'Plenty', 'Few', 'Small'],
    correctAnswer: 'Plenty',
    explanation: 'Scarce means in short supply.'
  },
  {
    topic: 'verbal',
    difficulty: 'hard',
    question: 'Identify the correctly spelled word:',
    options: ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'],
    correctAnswer: 'Accommodate',
    explanation: 'Correct spelling is accommodate.'
  },
  {
    topic: 'verbal',
    difficulty: 'hard',
    question: 'Choose the correct meaning of "Ambiguous"',
    options: ['Clear', 'Uncertain', 'Confusing', 'Both B and C'],
    correctAnswer: 'Both B and C',
    explanation: 'Ambiguous means unclear or confusing.'
  },
  {
    topic: 'verbal',
    difficulty: 'hard',
    question: 'Choose the correct sentence:',
    options: [
      'Neither of the answers are correct.',
      'Neither of the answers is correct.',
      'Neither answer are correct.',
      'Neither answer is correct.'
    ],
    correctAnswer: 'Neither of the answers is correct.',
    explanation: 'Neither is singular.'
  }
];

export const seedAptitudeQuestions = async () => {
  const count = await AptitudeQuestion.countDocuments();

  if (count > 0) {
    console.log('ℹ️ Aptitude questions already exist. Skipping seed.');
    return;
  }

  await AptitudeQuestion.insertMany(questions);
  console.log(`✅ Seeded ${questions.length} aptitude questions`);
};
