import GroqAIService from './groqAIService.js';
import ATSScoringBot from './chatbots/ATSScoringBot.js';
import ResumeBuilderBot from './chatbots/ResumeBuilderBot.js';
import MockInterviewBot from './chatbots/MockInterviewBot.js';
import JobSuggesterBot from './chatbots/JobSuggesterBot.js';
import JobSearchBot from './chatbots/JobSearchBot.js';

class ChatbotService {
  constructor() {
    this.openai = GroqAIService;
    this.subBots = {
      'main': this,
      'ats-score': new ATSScoringBot(),
      'resume-builder': new ResumeBuilderBot(),
      'mock-interview': new MockInterviewBot(),
      'job-suggest': new JobSuggesterBot(),
      'job-search': new JobSearchBot()
    };
  }

  async processMessage(message, userId, sessionContext = {}) {
    try {
      const startTime = Date.now();
      
      // Get the appropriate chatbot
      const chatbotType = sessionContext.sessionType || 'main';
      const chatbot = this.subBots[chatbotType];

      if (!chatbot) {
        throw new Error(`Unknown chatbot type: ${chatbotType}`);
      }

      // If this is the main orchestrator, classify intent first
      let response;
      if (chatbotType === 'main') {
        response = await this.handleMainChatbot(message, userId, sessionContext);
      } else {
        response = await chatbot.processMessage(message, userId, sessionContext);
      }

      const processingTime = Date.now() - startTime;

      return {
        ...response,
        metadata: {
          ...response.metadata,
          processingTime,
          chatbotType,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Chatbot processing error:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      return {
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        metadata: {
          error: true,
          errorMessage: error.message,
          chatbotType: sessionContext.sessionType || 'main',
          processingTime: 0
        }
      };
    }
  }

  async handleMainChatbot(message, userId, sessionContext) {
    try {
      // Classify the intent
      const intent = await this.openai.classifyIntent(message);
      
      // Extract entities
      const entities = await this.openai.extractEntities(message);

      // Route to appropriate specialized chatbot if needed
      if (intent !== 'main' && intent !== 'general') {
        const specializedBot = this.subBots[intent];
        if (specializedBot) {
          const specializedResponse = await specializedBot.processMessage(message, userId, {
            ...sessionContext,
            sessionType: intent
          });
          
          return {
            ...specializedResponse,
            metadata: {
              ...specializedResponse.metadata,
              intent,
              entities,
              routedTo: intent
            }
          };
        }
      }

      // Handle general conversation with main chatbot
      return await this.generateMainResponse(message, userId, sessionContext, intent, entities);
    } catch (error) {
      console.error('Main chatbot error:', error);
      throw error;
    }
  }

  async generateMainResponse(message, userId, sessionContext, intent, entities) {
    const systemPrompt = await this.openai.createSystemPrompt('main', sessionContext);
    
    // Build conversation history
    const conversationHistory = sessionContext.conversationHistory || [];
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Add context about available features
    const contextMessage = this.buildContextMessage(sessionContext, entities);
    if (contextMessage) {
      messages.splice(-1, 0, { role: 'system', content: contextMessage });
    }

    const response = await this.openai.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1000
    });

    return {
      content: response.content,
      metadata: {
        intent,
        entities,
        confidence: 0.8,
        tokenCount: response.usage?.total_tokens || 0,
        suggestions: this.generateSuggestions(intent, entities)
      }
    };
  }

  buildContextMessage(sessionContext, entities) {
    const contextParts = [];

    // Add user profile context if available
    if (sessionContext.userProfile) {
      const profile = sessionContext.userProfile;
      contextParts.push(`User Profile: ${profile.profile?.firstName} ${profile.profile?.lastName}, Experience: ${profile.preferences?.experienceLevel || 'Not specified'}`);
    }

    // Add resume context if available
    if (sessionContext.resumeId) {
      contextParts.push('User has an active resume in the system');
    }

    // Add job search context if available
    if (sessionContext.jobSearchCriteria) {
      const criteria = sessionContext.jobSearchCriteria;
      contextParts.push(`Looking for ${criteria.jobType || 'any'} positions in ${criteria.location || 'any location'}`);
    }

    // Add entity-specific context
    if (entities.length > 0) {
      const entityTypes = [...new Set(entities.map(e => e.type))];
      contextParts.push(`User mentioned: ${entityTypes.join(', ')}`);
    }

    return contextParts.length > 0 ? contextParts.join('. ') : null;
  }

  generateSuggestions(intent, entities) {
    const suggestions = [];

    switch (intent) {
      case 'ats-score':
        suggestions.push(
          "Would you like me to analyze your resume for ATS compatibility?",
          "I can help you optimize your resume for better ATS scores"
        );
        break;
      case 'resume-builder':
        suggestions.push(
          "Let's create a professional resume together",
          "I can help you tailor your resume for specific jobs"
        );
        break;
      case 'mock-interview':
        suggestions.push(
          "Ready for interview practice?",
          "I can simulate different types of interview questions"
        );
        break;
      case 'job-suggest':
        suggestions.push(
          "Let me suggest some career paths based on your skills",
          "I can help you explore new career opportunities"
        );
        break;
      case 'job-search':
        suggestions.push(
          "I can help you find relevant job opportunities",
          "Let's set up your job search criteria"
        );
        break;
      default:
        suggestions.push(
          "How can I help you with your career today?",
          "I can assist with resumes, interviews, job search, and career advice"
        );
    }

    return suggestions.slice(0, 2); // Return max 2 suggestions
  }

  async generateQuickReplies(sessionType, context = {}) {
    const quickReplies = {
      'main': [
        "Help me build a resume",
        "Analyze my resume's ATS score",
        "Practice interview questions",
        "Find job opportunities",
        "Get career advice"
      ],
      'ats-score': [
        "Analyze my resume",
        "Compare with job description",
        "Suggest improvements",
        "Show detailed breakdown"
      ],
      'resume-builder': [
        "Start new resume",
        "Update existing resume",
        "Add work experience",
        "Optimize for ATS"
      ],
      'mock-interview': [
        "Start behavioral interview",
        "Practice technical questions",
        "Get feedback on answers",
        "Prepare for specific company"
      ],
      'job-suggest': [
        "Analyze my skills",
        "Suggest career paths",
        "Industry recommendations",
        "Skill gap analysis"
      ],
      'job-search': [
        "Find jobs near me",
        "Set up job alerts",
        "Filter by salary",
        "Remote opportunities"
      ]
    };

    return quickReplies[sessionType] || quickReplies['main'];
  }

  async validateInput(message, sessionType) {
    const validation = {
      isValid: true,
      errors: [],
      suggestions: []
    };

    // Basic validation
    if (!message || message.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('Message cannot be empty');
      return validation;
    }

    if (message.length > 10000) {
      validation.isValid = false;
      validation.errors.push('Message is too long (max 10,000 characters)');
      return validation;
    }

    // Check for inappropriate content (basic filter)
    const inappropriatePatterns = [
      /\b(spam|scam|fraud)\b/i,
      /\b(hate|harassment|abuse)\b/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(message)) {
        validation.isValid = false;
        validation.errors.push('Message contains inappropriate content');
        break;
      }
    }

    return validation;
  }

  async getSessionSummary(sessionId, sessionData) {
    if (!sessionData.messages || sessionData.messages.length === 0) {
      return "No conversation yet";
    }

    const conversationText = sessionData.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return await this.openai.generateSummary(conversationText, 50);
  }

  async generateTitle(sessionType, firstMessage) {
    const titles = {
      'main': 'General Chat',
      'ats-score': 'Resume ATS Analysis',
      'resume-builder': 'Resume Building Session',
      'mock-interview': 'Mock Interview Practice',
      'job-suggest': 'Career Guidance',
      'job-search': 'Job Search'
    };

    let baseTitle = titles[sessionType] || 'Chat Session';

    // Try to generate a more specific title based on the first message
    if (firstMessage && firstMessage.length > 10) {
      try {
        const entities = await this.openai.extractEntities(firstMessage);
        const jobTitle = entities.find(e => e.type === 'JOB_TITLE');
        const company = entities.find(e => e.type === 'COMPANY');

        if (jobTitle) {
          baseTitle += ` - ${jobTitle.value}`;
        } else if (company) {
          baseTitle += ` - ${company.value}`;
        }
      } catch (error) {
        console.error('Title generation error:', error);
      }
    }

    return baseTitle;
  }
}

export default new ChatbotService();