import GroqAIService from '../groqAIService.js';
class MockInterviewBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'Mock Interview Coach';
  }

  async processMessage(message, userId, sessionContext) {
    try {
      const intent = await this.classifyInterviewIntent(message);
      
      switch (intent) {
        case 'start-interview':
          return await this.startInterview(message, sessionContext);
        case 'answer-question':
          return await this.handleAnswer(message, sessionContext);
        case 'skip-question':
          return await this.skipQuestion(message, sessionContext);
        case 'get-feedback':
          return await this.provideFeedback(message, sessionContext);
        case 'practice-type':
          return await this.practiceSpecificType(message, sessionContext);
        case 'end-interview':
          return await this.endInterview(message, sessionContext);
        default:
          return await this.handleGeneralInterviewQuery(message, sessionContext);
      }
    } catch (error) {
      console.error('Mock Interview Bot error:', error);
      throw error;
    }
  }

  async classifyInterviewIntent(message) {
    const messages = [
      {
        role: 'system',
        content: `Classify the user's interview-related message into one of these categories:
        - "start-interview": Want to begin mock interview session
        - "answer-question": Responding to an interview question
        - "skip-question": Want to skip current question
        - "get-feedback": Asking for feedback on answers
        - "practice-type": Want specific type of questions (behavioral, technical, etc.)
        - "end-interview": Want to end the interview session
        - "general": General interview questions or preparation advice
        
        Respond with only the category name.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 50
      });
      return result.content.trim().toLowerCase();
    } catch (error) {
      return 'general';
    }
  }

  async startInterview(message, sessionContext) {
    const interviewPrefs = await this.extractInterviewPreferences(message);
    const interviewState = this.initializeInterviewState(interviewPrefs, sessionContext);
    
    const firstQuestion = await this.generateQuestion(interviewState, sessionContext);
    
    return {
      content: `🎯 **Mock Interview Session Started!**

**Session Details:**
- **Type**: ${interviewState.questionType} questions
- **Difficulty**: ${interviewState.difficulty}
- **Target Role**: ${interviewState.targetRole || 'General position'}
- **Total Questions**: ${interviewState.totalQuestions}

---

## Question 1 of ${interviewState.totalQuestions}

**${firstQuestion.question}**

${firstQuestion.context ? `\n**Context**: ${firstQuestion.context}` : ''}

${firstQuestion.tips ? `\n💡 **Tip**: ${firstQuestion.tips}` : ''}

---

Take your time to craft a thoughtful response. When you're ready, share your answer and I'll provide detailed feedback!

**Commands you can use:**
- "Skip question" - Move to next question
- "End interview" - Complete the session
- "Give me a hint" - Get guidance for answering`,
      metadata: {
        intent: 'start-interview',
        interviewState: interviewState,
        currentQuestion: firstQuestion,
        confidence: 0.9
      }
    };
  }

  async extractInterviewPreferences(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract interview preferences from the user's message. Return JSON with:
        {
          "questionType": "behavioral|technical|situational|cultural|mixed",
          "difficulty": "easy|medium|hard",
          "targetRole": "specific job title or field",
          "company": "company name if mentioned",
          "totalQuestions": "number (default 5)",
          "timeLimit": "minutes per question if mentioned",
          "focusAreas": ["specific skills or topics to focus on"]
        }
        
        Use defaults if not specified: mixed questions, medium difficulty, 5 questions.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 300
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        questionType: 'mixed',
        difficulty: 'medium',
        totalQuestions: 5
      };
    }
  }

  initializeInterviewState(preferences, sessionContext) {
    return {
      currentQuestion: 0,
      questionType: preferences.questionType || 'mixed',
      difficulty: preferences.difficulty || 'medium',
      targetRole: preferences.targetRole || sessionContext.targetRole || 'Professional role',
      company: preferences.company || null,
      totalQuestions: preferences.totalQuestions || 5,
      timeLimit: preferences.timeLimit || null,
      focusAreas: preferences.focusAreas || [],
      scores: [],
      startTime: new Date(),
      questions: []
    };
  }

  async generateQuestion(interviewState, sessionContext) {
    const questionPrompt = this.buildQuestionPrompt(interviewState, sessionContext);
    
    const messages = [
      {
        role: 'system',
        content: questionPrompt
      },
      {
        role: 'user',
        content: "Generate the next interview question."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 400
      });
      
      const questionData = JSON.parse(result.content);
      
      // Store the question in interview state
      interviewState.questions.push(questionData);
      
      return questionData;
    } catch (error) {
      console.error('Question generation error:', error);
      return this.getFallbackQuestion(interviewState);
    }
  }

  buildQuestionPrompt(interviewState, sessionContext) {
    const userBackground = this.extractUserBackground(sessionContext);
    
    return `Generate a ${interviewState.questionType} interview question for a ${interviewState.targetRole} position.

    **Interview Details:**
    - Question Type: ${interviewState.questionType}
    - Difficulty: ${interviewState.difficulty}
    - Question Number: ${interviewState.currentQuestion + 1} of ${interviewState.totalQuestions}
    - Target Role: ${interviewState.targetRole}
    ${interviewState.company ? `- Company: ${interviewState.company}` : ''}
    ${interviewState.focusAreas.length > 0 ? `- Focus Areas: ${interviewState.focusAreas.join(', ')}` : ''}

    **User Background:**
    ${userBackground}

    **Question Types Guide:**
    - **Behavioral**: Past experiences, STAR method questions
    - **Technical**: Role-specific skills, problem-solving
    - **Situational**: Hypothetical scenarios, decision-making
    - **Cultural**: Company fit, values, motivation
    - **Mixed**: Combination of above types

    Return JSON with:
    {
      "question": "The interview question",
      "type": "specific type (behavioral, technical, etc.)",
      "context": "additional context or scenario if needed",
      "tips": "brief guidance for answering well",
      "keywords": ["key concepts the answer should address"],
      "difficulty": "easy|medium|hard"
    }

    Make questions realistic, relevant, and appropriately challenging.`;
  }

  extractUserBackground(sessionContext) {
    const background = [];
    
    if (sessionContext.userProfile) {
      const profile = sessionContext.userProfile;
      if (profile.preferences?.experienceLevel) {
        background.push(`Experience Level: ${profile.preferences.experienceLevel}`);
      }
      if (profile.preferences?.industries?.length > 0) {
        background.push(`Industries: ${profile.preferences.industries.join(', ')}`);
      }
    }
    
    if (sessionContext.resumeContent) {
      background.push('User has provided resume content');
    }
    
    if (sessionContext.skills) {
      background.push(`Skills focus: ${Object.keys(sessionContext.skills).join(', ')}`);
    }
    
    return background.length > 0 ? background.join('; ') : 'General professional background';
  }

  getFallbackQuestion(interviewState) {
    const fallbackQuestions = {
      behavioral: {
        question: "Tell me about a time when you had to overcome a significant challenge at work. How did you handle it?",
        type: "behavioral",
        tips: "Use the STAR method: Situation, Task, Action, Result",
        keywords: ["challenge", "problem-solving", "results"]
      },
      technical: {
        question: "How would you approach solving a complex problem in your field? Walk me through your process.",
        type: "technical",
        tips: "Demonstrate your analytical thinking and methodology",
        keywords: ["process", "methodology", "problem-solving"]
      },
      situational: {
        question: "If you were given a project with a tight deadline and limited resources, how would you prioritize and manage it?",
        type: "situational",
        tips: "Show your project management and prioritization skills",
        keywords: ["prioritization", "project management", "efficiency"]
      }
    };

    const questionType = interviewState.questionType === 'mixed' ? 'behavioral' : interviewState.questionType;
    return fallbackQuestions[questionType] || fallbackQuestions.behavioral;
  }

  async handleAnswer(message, sessionContext) {
    const currentState = sessionContext.interviewState;
    if (!currentState || currentState.questions.length === 0) {
      return {
        content: "It looks like we haven't started an interview yet. Would you like to begin a mock interview session?",
        metadata: {
          intent: 'answer-question',
          requiresInterviewStart: true
        }
      };
    }

    const currentQuestion = currentState.questions[currentState.questions.length - 1];
    const feedback = await this.evaluateAnswer(message, currentQuestion, sessionContext);
    
    // Store the answer and feedback
    const answerData = {
      question: currentQuestion.question,
      answer: message,
      score: feedback.score,
      feedback: feedback.feedback,
      timestamp: new Date()
    };
    
    currentState.scores.push(answerData);
    currentState.currentQuestion += 1;

    // Check if interview is complete
    if (currentState.currentQuestion >= currentState.totalQuestions) {
      return await this.completeInterview(currentState, sessionContext);
    }

    // Generate next question
    const nextQuestion = await this.generateQuestion(currentState, sessionContext);
    
    return {
      content: `## Feedback on Your Answer

${feedback.feedback}

**Score: ${feedback.score}/10**

### Strengths:
${feedback.strengths.map(s => `• ${s}`).join('\n')}

### Areas for Improvement:
${feedback.improvements.map(i => `• ${i}`).join('\n')}

---

## Question ${currentState.currentQuestion + 1} of ${currentState.totalQuestions}

**${nextQuestion.question}**

${nextQuestion.context ? `\n**Context**: ${nextQuestion.context}` : ''}

${nextQuestion.tips ? `\n💡 **Tip**: ${nextQuestion.tips}` : ''}

---

Take your time and provide your best answer!`,
      metadata: {
        intent: 'answer-question',
        feedback: feedback,
        nextQuestion: nextQuestion,
        progress: `${currentState.currentQuestion}/${currentState.totalQuestions}`,
        confidence: 0.9
      }
    };
  }

  async evaluateAnswer(answer, question, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Evaluate this interview answer comprehensively. Provide constructive feedback as an experienced interviewer.

        **Question**: ${question.question}
        **Question Type**: ${question.type}
        **Expected Keywords**: ${question.keywords?.join(', ') || 'N/A'}

        **Evaluation Criteria:**
        1. **Relevance** (0-3): How well does the answer address the question?
        2. **Structure** (0-2): Is the answer well-organized and clear?
        3. **Examples** (0-2): Are specific examples or experiences provided?
        4. **Impact** (0-2): Are results and outcomes mentioned?
        5. **Communication** (0-1): Is the answer professionally communicated?

        Return JSON with:
        {
          "score": <total score 0-10>,
          "breakdown": {
            "relevance": <score 0-3>,
            "structure": <score 0-2>,
            "examples": <score 0-2>,
            "impact": <score 0-2>,
            "communication": <score 0-1>
          },
          "feedback": "detailed constructive feedback (3-4 sentences)",
          "strengths": ["2-3 specific strengths"],
          "improvements": ["2-3 specific improvement suggestions"],
          "followUp": "potential follow-up question an interviewer might ask"
        }

        Be encouraging but honest. Provide specific, actionable feedback.`
      },
      {
        role: 'user',
        content: answer
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 600
      });
      
      return JSON.parse(result.content);
    } catch (error) {
      console.error('Answer evaluation error:', error);
      return {
        score: 6,
        feedback: "Thank you for your answer. You provided relevant information and showed good understanding of the question.",
        strengths: ["Clear communication", "Relevant examples"],
        improvements: ["Add more specific details", "Include quantified results"],
        followUp: "Can you tell me more about the outcome of this situation?"
      };
    }
  }

  async skipQuestion(message, sessionContext) {
    const currentState = sessionContext.interviewState;
    if (!currentState) {
      return {
        content: "No active interview session found. Would you like to start a mock interview?",
        metadata: {
          intent: 'skip-question',
          requiresInterviewStart: true
        }
      };
    }

    currentState.currentQuestion += 1;

    if (currentState.currentQuestion >= currentState.totalQuestions) {
      return await this.completeInterview(currentState, sessionContext);
    }

    const nextQuestion = await this.generateQuestion(currentState, sessionContext);
    
    return {
      content: `Question skipped! Let's move on to the next one.

## Question ${currentState.currentQuestion + 1} of ${currentState.totalQuestions}

**${nextQuestion.question}**

${nextQuestion.context ? `\n**Context**: ${nextQuestion.context}` : ''}

${nextQuestion.tips ? `\n💡 **Tip**: ${nextQuestion.tips}` : ''}

---

Remember, it's better to attempt an answer rather than skip, but I understand some questions might not be relevant to your experience.`,
      metadata: {
        intent: 'skip-question',
        nextQuestion: nextQuestion,
        progress: `${currentState.currentQuestion}/${currentState.totalQuestions}`,
        confidence: 0.9
      }
    };
  }

  async completeInterview(interviewState, sessionContext) {
    const summary = await this.generateInterviewSummary(interviewState, sessionContext);
    
    return {
      content: `🎉 **Mock Interview Complete!**

${summary.overview}

## Performance Summary

**Overall Score: ${summary.averageScore}/10** (${summary.performanceLevel})

### Question-by-Question Results:
${summary.questionResults.map((result, index) => 
  `**Q${index + 1}**: ${result.score}/10 - ${result.type} question`
).join('\n')}

### Key Strengths:
${summary.strengths.map(s => `• ${s}`).join('\n')}

### Areas for Improvement:
${summary.improvements.map(i => `• ${i}`).join('\n')}

### Recommended Next Steps:
${summary.nextSteps.map(step => `• ${step}`).join('\n')}

---

**Interview Statistics:**
- Duration: ${summary.duration}
- Questions Answered: ${summary.questionsAnswered}/${interviewState.totalQuestions}
- Question Types: ${summary.questionTypes.join(', ')}

Would you like to:
- Start another interview with different question types?
- Review specific answers in detail?
- Get tips for improving in specific areas?`,
      metadata: {
        intent: 'complete-interview',
        summary: summary,
        confidence: 0.9
      }
    };
  }

  async generateInterviewSummary(interviewState, sessionContext) {
    const scores = interviewState.scores;
    const averageScore = scores.length > 0 ? 
      Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10 : 0;
    
    const duration = Math.round((new Date() - interviewState.startTime) / 60000); // minutes
    
    const messages = [
      {
        role: 'system',
        content: `Generate a comprehensive interview summary and recommendations.

        **Interview Data:**
        - Average Score: ${averageScore}/10
        - Total Questions: ${interviewState.totalQuestions}
        - Questions Answered: ${scores.length}
        - Duration: ${duration} minutes
        - Question Types: ${interviewState.questionType}
        - Target Role: ${interviewState.targetRole}

        **Individual Scores:**
        ${scores.map((score, index) => 
          `Q${index + 1} (${score.score}/10): ${score.question.substring(0, 100)}...`
        ).join('\n')}

        Return JSON with:
        {
          "overview": "2-3 sentence overall assessment",
          "averageScore": ${averageScore},
          "performanceLevel": "Excellent|Good|Fair|Needs Work",
          "questionResults": [{"score": score, "type": "question type"}],
          "strengths": ["top 3-4 strengths shown"],
          "improvements": ["top 3-4 areas for improvement"],
          "nextSteps": ["specific actionable recommendations"],
          "duration": "${duration} minutes",
          "questionsAnswered": ${scores.length},
          "questionTypes": ["types covered"]
        }

        Be constructive and encouraging while providing honest assessment.`
      },
      {
        role: 'user',
        content: "Generate interview summary."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 800
      });
      
      return JSON.parse(result.content);
    } catch (error) {
      console.error('Summary generation error:', error);
      return {
        overview: `You completed ${scores.length} questions with an average score of ${averageScore}/10. This shows solid interview preparation and communication skills.`,
        averageScore: averageScore,
        performanceLevel: averageScore >= 8 ? 'Excellent' : averageScore >= 6 ? 'Good' : 'Needs Work',
        questionResults: scores.map(s => ({ score: s.score, type: 'interview question' })),
        strengths: ['Clear communication', 'Relevant examples', 'Professional demeanor'],
        improvements: ['Add more quantified results', 'Practice concise answers', 'Prepare more examples'],
        nextSteps: ['Practice behavioral questions', 'Research company-specific questions', 'Work on storytelling skills'],
        duration: `${duration} minutes`,
        questionsAnswered: scores.length,
        questionTypes: [interviewState.questionType]
      };
    }
  }

  async provideFeedback(message, sessionContext) {
    const feedbackRequest = await this.extractFeedbackRequest(message);
    const detailedFeedback = await this.generateDetailedFeedback(feedbackRequest, sessionContext);
    
    return {
      content: detailedFeedback,
      metadata: {
        intent: 'get-feedback',
        confidence: 0.9
      }
    };
  }

  async extractFeedbackRequest(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract what specific feedback the user is requesting. Return JSON with:
        {
          "type": "overall|specific-question|skill-area|improvement",
          "specific": "what specifically they want feedback on",
          "questionNumber": "if asking about specific question"
        }`
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 200
      });
      return JSON.parse(result.content);
    } catch (error) {
      return { type: 'overall', specific: 'general feedback' };
    }
  }

  async generateDetailedFeedback(feedbackRequest, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Provide detailed interview feedback as an experienced career coach.

        Request: ${JSON.stringify(feedbackRequest)}
        Session Context: ${JSON.stringify(sessionContext.interviewState || {})}

        Provide comprehensive, actionable feedback that includes:
        - Specific observations about performance
        - Concrete improvement suggestions
        - Practice recommendations
        - Industry-specific advice when relevant

        Be encouraging but honest, and focus on actionable steps.`
      },
      {
        role: 'user',
        content: "Please provide the requested feedback."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 600
      });
      return result.content;
    } catch (error) {
      return `## Interview Feedback

Based on your interview performance, here are some key observations:

### Strengths:
• You demonstrate good communication skills and professionalism
• Your answers show relevant experience and knowledge
• You maintain a positive, engaged demeanor throughout

### Areas for Improvement:
• Consider using the STAR method (Situation, Task, Action, Result) for behavioral questions
• Practice incorporating specific metrics and quantified results
• Work on keeping answers concise while still providing sufficient detail

### Practice Recommendations:
• Record yourself answering common interview questions
• Research the company and role thoroughly before interviews
• Prepare 5-7 specific examples that demonstrate different skills

Would you like to practice specific types of questions or work on any particular area?`;
    }
  }

  async practiceSpecificType(message, sessionContext) {
    const practiceRequest = await this.extractPracticeRequest(message);
    
    return {
      content: `Great! Let's focus on **${practiceRequest.type}** questions for **${practiceRequest.role || 'your target role'}**.

## ${practiceRequest.type.charAt(0).toUpperCase() + practiceRequest.type.slice(1)} Interview Practice

${this.getTypeSpecificGuidance(practiceRequest.type)}

**Ready to start?** I'll ask you ${practiceRequest.questionCount || 3} ${practiceRequest.type} questions. Just say "start" or "begin" when you're ready!

**Optional Setup:**
- Mention your target company for company-specific questions
- Let me know your experience level for appropriate difficulty
- Share any specific skills you want to focus on`,
      metadata: {
        intent: 'practice-type',
        practiceRequest: practiceRequest,
        confidence: 0.9
      }
    };
  }

  async extractPracticeRequest(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract practice preferences from the message. Return JSON with:
        {
          "type": "behavioral|technical|situational|cultural",
          "role": "target job role",
          "questionCount": "number of questions (default 3)",
          "specificFocus": "any specific areas mentioned"
        }`
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 200
      });
      return JSON.parse(result.content);
    } catch (error) {
      return { type: 'behavioral', questionCount: 3 };
    }
  }

  getTypeSpecificGuidance(type) {
    const guidance = {
      behavioral: `**Behavioral questions** explore your past experiences and how you handled specific situations. 

**Key Tips:**
• Use the STAR method (Situation, Task, Action, Result)
• Choose examples that show growth and learning
• Quantify results whenever possible
• Be honest about challenges and what you learned

**Common themes:** Leadership, teamwork, conflict resolution, problem-solving, adaptability`,

      technical: `**Technical questions** assess your job-specific knowledge and problem-solving abilities.

**Key Tips:**
• Think out loud to show your reasoning process
• Ask clarifying questions if needed
• Break down complex problems into steps
• Explain your assumptions and trade-offs

**Common areas:** System design, coding challenges, industry knowledge, tools and technologies`,

      situational: `**Situational questions** present hypothetical scenarios to see how you would handle future challenges.

**Key Tips:**
• Think through the scenario step by step
• Consider multiple stakeholders and perspectives
• Explain your decision-making process
• Show awareness of potential consequences

**Common themes:** Prioritization, decision-making, leadership, ethics, crisis management`,

      cultural: `**Cultural questions** help assess if you're a good fit for the company's values and work environment.

**Key Tips:**
• Research the company's mission and values
• Share authentic examples of your work style
• Show enthusiasm for the company and role
• Demonstrate alignment with company culture

**Common themes:** Motivation, values, work style, career goals, company interest`
    };

    return guidance[type] || guidance.behavioral;
  }

  async endInterview(message, sessionContext) {
    const currentState = sessionContext.interviewState;
    
    if (!currentState || currentState.scores.length === 0) {
      return {
        content: "No active interview session to end. Would you like to start a new mock interview?",
        metadata: {
          intent: 'end-interview',
          requiresInterviewStart: true
        }
      };
    }

    // Generate partial summary
    const partialSummary = await this.generatePartialSummary(currentState);
    
    return {
      content: `## Interview Session Ended

${partialSummary}

Thank you for practicing with me! Even though we didn't complete all questions, this practice was valuable.

**What we covered:**
- **Questions answered**: ${currentState.scores.length} of ${currentState.totalQuestions}
- **Average score**: ${Math.round((currentState.scores.reduce((sum, s) => sum + s.score, 0) / currentState.scores.length) * 10) / 10}/10
- **Question types**: ${currentState.questionType}

### Quick Tips for Next Time:
• Complete the full interview for comprehensive feedback
• Practice with different question types
• Focus on specific skills you want to improve

Would you like to:
- Start a new interview session?
- Review your answers from this session?
- Get tips for specific interview scenarios?`,
      metadata: {
        intent: 'end-interview',
        partialResults: true,
        confidence: 0.9
      }
    };
  }

  async generatePartialSummary(interviewState) {
    if (interviewState.scores.length === 0) {
      return "You ended the interview before answering any questions.";
    }

    const averageScore = Math.round((interviewState.scores.reduce((sum, s) => sum + s.score, 0) / interviewState.scores.length) * 10) / 10;
    
    return `Based on the ${interviewState.scores.length} question(s) you answered, you're showing ${
      averageScore >= 7 ? 'strong' : averageScore >= 5 ? 'good' : 'developing'
    } interview skills with an average score of ${averageScore}/10.`;
  }

  async handleGeneralInterviewQuery(message, sessionContext) {
    const systemPrompt = await this.openai.createSystemPrompt('mock-interview', sessionContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const result = await this.openai.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 600
    });

    return {
      content: result.content,
      metadata: {
        intent: 'general',
        confidence: 0.8,
        suggestions: [
          "Start a mock interview",
          "Practice behavioral questions",
          "Get interview tips",
          "Practice for specific company"
        ]
      }
    };
  }
}

export default MockInterviewBot;