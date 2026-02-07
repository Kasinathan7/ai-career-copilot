import { logger } from '../utils/logger.js';
import GroqAIService from '../services/groqAIService.js';

// Generate interview question based on type and level
export const generateQuestion = async (req, res) => {
  try {
    const { type, level, role, company } = req.body;

    if (!type || !level) {
      return res.status(400).json({
        success: false,
        message: 'Interview type and experience level are required'
      });
    }


    const prompt = `You are an expert interview coach. Generate a realistic ${type} interview question specifically for a ${level} level candidate${role ? ` applying for a ${role} position` : ''}${company ? ` at ${company}` : ''}.

  Interview Type: ${type}
  Experience Level: ${level}
  ${role ? `Target Role: ${role}` : ''}
  ${company ? `Company: ${company}` : ''}

  Requirements:
  1. The question MUST be directly relevant to ${role ? `a ${role} role` : 'the candidate\'s target position'}
  2. The question should be appropriate for the ${level} experience level
  3. For behavioral questions, ask about situations specific to ${role ? `${role} responsibilities` : 'their role'}
  4. For technical questions, focus on skills and technologies relevant to ${role || 'the position'}
  5. Make it realistic and commonly asked in actual ${role ? `${role} ` : ''}interviews
  6. ${role ? `Incorporate ${role}-specific scenarios, challenges, or skills` : 'Focus on role-relevant scenarios'}
  7. Return ONLY the question text, nothing else

  Generate ONE highly relevant ${role ? `${role}` : 'role-specific'} interview question:`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: prompt }
    ], { maxTokens: 200 });
    const question = result.content.trim();

    logger.info(`Generated ${type} question for ${level} level`);

    res.json({
      success: true,
      data: {
        question,
        type,
        level,
        role,
        company
      }
    });

  } catch (error) {
    logger.error('Error generating interview question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview question',
      error: error.message
    });
  }
};

// Analyze user's answer and provide feedback
export const analyzeAnswer = async (req, res) => {
  try {
    const { question, answer, type, level, duration } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    if (answer.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Answer is too short. Please provide at least 50 characters'
      });
    }


    const prompt = `You are an expert interview coach providing detailed feedback on interview answers. Analyze the following interview response and provide comprehensive, constructive feedback.

INTERVIEW QUESTION (${type} - ${level} level):
${question}

CANDIDATE'S ANSWER:
${answer}

${duration ? `Time taken: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds` : ''}

Provide a detailed analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "clarity": <number 0-100>,
    "relevance": <number 0-100>,
    "structure": <number 0-100>,
    "depth": <number 0-100>,
    "communication": <number 0-100>
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    "<specific improvement area 1>",
    "<specific improvement area 2>",
    "<specific improvement area 3>"
  ],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ],
  "detailedFeedback": "<2-3 paragraph comprehensive feedback>",
  "starMethodAnalysis": {
    "situation": "<evaluation if behavioral question>",
    "task": "<evaluation if behavioral question>",
    "action": "<evaluation if behavioral question>",
    "result": "<evaluation if behavioral question>"
  },
  "improvedVersion": "<a better version of their answer>"
}

Evaluation Criteria:
1. **Clarity**: Is the answer clear and easy to understand?
2. **Relevance**: Does it directly answer the question?
3. **Structure**: Is it well-organized (STAR method for behavioral)?
4. **Depth**: Does it provide sufficient detail and examples?
5. **Communication**: Is the language professional and confident?

For behavioral questions, specifically evaluate:
- Use of specific examples (not generic or hypothetical)
- Quantifiable results and outcomes
- Clear explanation of their role vs team's role
- Lessons learned or growth demonstrated

For technical questions, evaluate:
- Technical accuracy
- Problem-solving approach
- Consideration of trade-offs
- Depth of understanding

Be constructive, specific, and actionable in your feedback. Return ONLY valid JSON.`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: prompt }
    ], { maxTokens: 1000 });
    let responseText = result.content.trim();

    // Clean up markdown formatting if present
    responseText = responseText.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();

    const feedback = JSON.parse(responseText);

    logger.info(`Analyzed ${type} interview answer, score: ${feedback.overallScore}`);

    res.json({
      success: true,
      data: {
        feedback,
        question,
        type,
        level,
        duration
      }
    });

  } catch (error) {
    logger.error('Error analyzing interview answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze answer',
      error: error.message
    });
  }
};

// Get personalized interview tips based on user's history
export const getPersonalizedTips = async (req, res) => {
  try {
    const { sessionHistory, focusArea } = req.body;


    let prompt = `You are an expert interview coach. Provide personalized interview tips and advice.`;

    if (sessionHistory && sessionHistory.length > 0) {
      const avgScore = sessionHistory.reduce((sum, s) => sum + s.score, 0) / sessionHistory.length;
      const weakAreas = sessionHistory
        .filter(s => s.score < 70)
        .map(s => s.type)
        .filter((v, i, a) => a.indexOf(v) === i);

      prompt += `\n\nBased on the user's practice history:
- Average score: ${avgScore.toFixed(1)}%
- Practice sessions: ${sessionHistory.length}
- Areas needing improvement: ${weakAreas.join(', ') || 'None identified'}
${focusArea ? `- User wants to focus on: ${focusArea}` : ''}`;
    } else {
      prompt += `\n\nThe user is just starting their interview preparation.${focusArea ? ` They want to focus on: ${focusArea}` : ''}`;
    }

    prompt += `\n\nProvide 5-7 personalized, actionable tips in JSON format:
{
  "tips": [
    {
      "title": "<tip title>",
      "description": "<detailed description>",
      "priority": "<high|medium|low>"
    }
  ],
  "focusAreas": ["<area 1>", "<area 2>", "<area 3>"],
  "practiceRecommendation": "<specific recommendation for what to practice next>"
}

Return ONLY valid JSON.`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: prompt }
    ], { maxTokens: 800 });
    let responseText = result.content.trim();
    responseText = responseText.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();

    const tips = JSON.parse(responseText);

    res.json({
      success: true,
      data: tips
    });

  } catch (error) {
    logger.error('Error generating personalized tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tips',
      error: error.message
    });
  }
};

// Generate a full mock interview session
export const generateMockInterview = async (req, res) => {
  try {
    const { role, company, level, numberOfQuestions = 5 } = req.body;

    if (!role || !level) {
      return res.status(400).json({
        success: false,
        message: 'Role and level are required'
      });
    }


    const prompt = `You are an expert interview coach creating a complete mock interview session.

Position: ${role}
${company ? `Company: ${company}` : ''}
Experience Level: ${level}
Number of Questions: ${numberOfQuestions}

Create a realistic interview session with a mix of:
- Behavioral questions (50%)
- Technical questions (30%)
- Situational questions (20%)

Return in JSON format:
{
  "sessionTitle": "<descriptive title>",
  "estimatedDuration": <minutes>,
  "questions": [
    {
      "id": <number>,
      "type": "<behavioral|technical|situational>",
      "question": "<question text>",
      "difficulty": "<easy|medium|hard>",
      "purpose": "<what this question evaluates>",
      "tips": ["<tip 1>", "<tip 2>"]
    }
  ],
  "preparationAdvice": ["<advice 1>", "<advice 2>", "<advice 3>"]
}

Make questions realistic and commonly asked for this role and level. Return ONLY valid JSON.`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: prompt }
    ], { maxTokens: 2000 });
    let responseText = result.content.trim();
    responseText = responseText.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();

    const mockInterview = JSON.parse(responseText);

    logger.info(`Generated mock interview for ${role} (${level} level)`);

    res.json({
      success: true,
      data: mockInterview
    });

  } catch (error) {
    logger.error('Error generating mock interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate mock interview',
      error: error.message
    });
  }
};
