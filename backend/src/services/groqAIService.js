import groqService from './groqService.js';

class GroqAIService {
  constructor() {
    this.defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.secondaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    console.log('✅ Groq AI service initialized');
    console.log(`   🤖 Primary model: ${this.defaultModel}`);
  }

  async generateCompletion(messages, options = {}) {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
    } = options;
    try {
      const startTime = Date.now();
      const content = await groqService.chat(messages, {
        model,
        temperature,
        max_tokens: maxTokens
      });
      const processingTime = Date.now() - startTime;
      return {
        content,
        usage: {},
        processingTime,
        model
      };
    } catch (error) {
      console.error('❌ Groq API Error:', error);
      throw new Error(`Groq API Error: ${error.message}`);
    }
  }

  async generateEmbedding(text) {
    // Groq API does not support embeddings yet; return random fallback
    console.warn('Embeddings not supported by Groq, using fallback');
    return Array(1536).fill(0).map(() => Math.random());
  }

  async classifyIntent(message) {
    const systemPrompt = `You are an intent classifier for an AI Resume Assistant. Classify user messages into these categories:
        
1. "ats-score" - Questions about resume scoring, ATS optimization, resume analysis
2. "resume-builder" - Requests to create, modify, or improve resumes
3. "mock-interview" - Interview practice, questions, feedback, interview preparation
4. "job-suggest" - Career advice, role recommendations, career path guidance
5. "job-search" - Finding jobs, job applications, job market information
6. "general" - General conversation, greetings, help requests, unclear intent

Respond with ONLY the category name, nothing else.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        model: this.secondaryModel,
        temperature: 0.1,
        maxTokens: 50
      });

      const intent = result.content.trim().toLowerCase();
      const validIntents = ['ats-score', 'resume-builder', 'mock-interview', 'job-suggest', 'job-search', 'general'];
      
      return validIntents.includes(intent) ? intent : 'general';
    } catch (error) {
      console.error('Intent classification error:', error);
      return 'general';
    }
  }

  async extractEntities(message) {
    const systemPrompt = `Extract key entities from the user message. Return a JSON array of entities with type, value, and confidence (0-1).
        
Entity types:
- JOB_TITLE: Job positions, roles
- COMPANY: Company names
- SKILL: Technical or soft skills
- LOCATION: Cities, states, countries
- EXPERIENCE: Years of experience
- EDUCATION: Degrees, certifications
- SALARY: Salary amounts or ranges

Example response: [{"type": "JOB_TITLE", "value": "Software Engineer", "confidence": 0.9}]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        model: this.secondaryModel,
        temperature: 0.1,
        maxTokens: 200
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Entity extraction error:', error);
      return [];
    }
  }

  async generateSummary(text, maxLength = 100) {
    const messages = [
      {
        role: 'system',
        content: `Summarize the following text in ${maxLength} words or less. Keep it concise and informative.`
      },
      { role: 'user', content: text }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        model: this.secondaryModel,
        temperature: 0.3,
        maxTokens: Math.ceil(maxLength * 1.5)
      });

      return result.content;
    } catch (error) {
      console.error('Summary generation error:', error);
      throw error;
    }
  }

  async improveText(text, context = 'general writing') {
    const messages = [
      {
        role: 'system',
        content: `Improve the following text for ${context}. Make it more professional, clear, and engaging while maintaining the original meaning.`
      },
      { role: 'user', content: text }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: Math.ceil(text.length * 2)
      });

      return result.content;
    } catch (error) {
      console.error('Text improvement error:', error);
      throw error;
    }
  }

  async translateText(text, targetLanguage = 'en') {
    const messages = [
      {
        role: 'system',
        content: `Translate the following text to ${targetLanguage}. Maintain professional tone and context.`
      },
      { role: 'user', content: text }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        model: this.secondaryModel,
        temperature: 0.3
      });

      return result.content;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async generateKeywords(text, count = 10) {
    const messages = [
      {
        role: 'system',
        content: `Extract the ${count} most important keywords from the following text. Return them as a comma-separated list.`
      },
      { role: 'user', content: text }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        model: this.secondaryModel,
        temperature: 0.1,
        maxTokens: 100
      });

      return result.content.split(',').map(keyword => keyword.trim());
    } catch (error) {
      console.error('Keyword generation error:', error);
      return [];
    }
  }

  async checkGrammar(text) {
    const messages = [
      {
        role: 'system',
        content: `Check the following text for grammar, spelling, and style issues. Provide specific corrections and suggestions.`
      },
      { role: 'user', content: text }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        temperature: 0.1
      });

      return result.content;
    } catch (error) {
      console.error('Grammar check error:', error);
      throw error;
    }
  }

  async parseResumeContent(resumeText) {
    const systemPrompt = `You are an expert resume parser. Extract ALL information from the resume text and structure it into JSON format. Be thorough and capture every detail.

Extract and return a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "portfolio": "Portfolio URL",
    "website": "Personal website"
  },
  "title": "Professional title or desired position",
  "summary": "Professional summary or objective statement",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "Brief overview",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "location": "City, State",
      "graduationDate": "MM/YYYY",
      "gpa": "GPA if mentioned",
      "honors": ["Honor 1", "Honor 2"]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "languages": ["Language 1", "Language 2"],
    "tools": ["Tool 1", "Tool 2"],
    "soft": ["Soft skill 1", "Soft skill 2"]
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "MM/YYYY",
      "credentialId": "ID if available"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "URL if available"
    }
  ],
  "awards": ["Award 1", "Award 2"],
  "publications": ["Publication 1", "Publication 2"],
  "languages": [
    {
      "name": "Language Name",
      "proficiency": "Native/Fluent/Professional/Basic"
    }
  ],
  "volunteer": [
    {
      "organization": "Organization Name",
      "role": "Role",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "What you did"
    }
  ]
}

Extract EVERYTHING you find. If a section is not present, use an empty array [] or empty string "". Be precise with dates, names, and details.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Parse this resume and extract all information:\n\n${resumeText}` }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 4000
      });

      // Try to parse the JSON response
      let parsedData;
      try {
        // Extract JSON from markdown code blocks if present
        let jsonContent = result.content.trim();
        if (jsonContent.includes('```json')) {
          jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
        } else if (jsonContent.includes('```')) {
          jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
        }
        
        parsedData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        // Return a basic structure with the raw text
        parsedData = {
          personalInfo: {},
          summary: '',
          experience: [],
          education: [],
          skills: { technical: [], languages: [], tools: [], soft: [] },
          certifications: [],
          projects: [],
          awards: [],
          rawParseError: true
        };
      }

      return parsedData;
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  async generateATSOptimizedResume(parsedResume, jobDescription = null) {
    const systemPrompt = `You are an expert resume writer specializing in ATS optimization. Given a parsed resume, create an ATS-friendly version that:

1. Uses clear, standard section headers
2. Incorporates relevant keywords naturally
3. Uses strong action verbs
4. Quantifies achievements where possible
5. Follows ATS-friendly formatting rules
6. Maintains professional language
${jobDescription ? `7. Optimizes for this specific job: ${jobDescription}` : ''}

Return a JSON object with the optimized resume content maintaining the same structure as the input.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Optimize this resume for ATS:\n\n${JSON.stringify(parsedResume, null, 2)}` }
    ];

    try {
      const result = await this.generateCompletion(messages, {
        temperature: 0.4,
        maxTokens: 4000
      });

      // Parse the optimized resume
      let optimizedData;
      try {
        let jsonContent = result.content.trim();
        if (jsonContent.includes('```json')) {
          jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
        } else if (jsonContent.includes('```')) {
          jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
        }
        
        optimizedData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.warn('Failed to parse optimized resume, using original');
        optimizedData = parsedResume;
      }

      return optimizedData;
    } catch (error) {
      console.error('Resume optimization error:', error);
      throw new Error(`Failed to optimize resume: ${error.message}`);
    }
  }

  async createSystemPrompt(chatbotType, context = {}) {
    const prompts = {
      'main': `You are an AI Resume Assistant, a helpful and friendly AI companion. While your primary expertise is helping with:
        - Resume creation and optimization
        - Job search strategies
        - Interview preparation
        - Career advice
        - ATS (Applicant Tracking System) optimization
        
        You can also help with general questions and casual conversation. If someone asks you a question outside your main expertise (like math, general knowledge, etc.), answer it helpfully and then gently guide the conversation back to how you can help with their career goals.
        
        Always be encouraging, friendly, and helpful. Provide clear, accurate answers to any question asked.`,
        
      'ats-score': `You are an ATS (Applicant Tracking System) Resume Analyzer. You specialize in:
        - Analyzing resumes for ATS compatibility
        - Providing specific keyword suggestions
        - Identifying formatting issues
        - Scoring resumes against job descriptions
        - Suggesting improvements for better ATS performance
        
        Always provide specific, actionable feedback with scores and clear improvement steps.`,
        
      'resume-builder': `You are a Resume Builder Assistant. You help users create professional, ATS-friendly resumes by:
        - Gathering information about their experience, education, and skills
        - Suggesting optimal resume formats and sections
        - Writing compelling bullet points and summaries
        - Tailoring resumes for specific job applications
        - Ensuring proper formatting and structure
        
        Ask clarifying questions and provide specific suggestions for improvement.`,
        
      'mock-interview': `You are a Mock Interview Coach. You conduct realistic interview simulations by:
        - Asking relevant interview questions based on the user's target role
        - Providing detailed feedback on answers
        - Suggesting improvements for communication and content
        - Covering behavioral, technical, and situational questions
        - Building confidence through practice
        
        Be supportive but honest in your feedback. Provide specific examples and improvement tips.`,
        
      'job-suggest': `You are a Career Advisor specializing in job role recommendations. You help by:
        - Analyzing skills, experience, and interests
        - Suggesting suitable career paths and roles
        - Providing insights about different industries
        - Recommending skill development opportunities
        - Explaining career progression options
        
        Provide personalized, realistic advice based on the user's background and goals.`,
        
      'job-search': `You are a Job Search Specialist. You assist with:
        - Finding relevant job opportunities
        - Optimizing job search strategies
        - Analyzing job market trends
        - Providing application tips and strategies
        - Connecting users with relevant opportunities
        
        Be practical and specific in your job search guidance.`
    };

    return prompts[chatbotType] || prompts['main'];
  }
}
// At the end of groqAIService.js
export default new GroqAIService();
