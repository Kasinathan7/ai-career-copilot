import GroqAIService from '../groqAIService.js';
class ATSScoringBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'ATS Scoring Assistant';
  }

  async processMessage(message, userId, sessionContext) {
    try {
      const intent = await this.classifyATSIntent(message);
      
      switch (intent) {
        case 'analyze-resume':
          return await this.analyzeResume(message, sessionContext);
        case 'compare-job':
          return await this.compareWithJob(message, sessionContext);
        case 'suggest-improvements':
          return await this.suggestImprovements(message, sessionContext);
        case 'explain-score':
          return await this.explainScore(message, sessionContext);
        default:
          return await this.handleGeneralATSQuery(message, sessionContext);
      }
    } catch (error) {
      console.error('ATS Bot error:', error);
      throw error;
    }
  }

  async classifyATSIntent(message) {
    const messages = [
      {
        role: 'system',
        content: `Classify the user's ATS-related message into one of these categories:
        - "analyze-resume": Request to analyze a resume for ATS compatibility
        - "compare-job": Compare resume against a specific job description
        - "suggest-improvements": Ask for specific improvement suggestions
        - "explain-score": Explain ATS scoring or results
        - "general": General ATS questions or conversation
        
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

  async analyzeResume(message, sessionContext) {
    // Get resume content from context
    const resumeContent = sessionContext.resumeContent || sessionContext.resume;
    
    if (!resumeContent) {
      return {
        content: "I'd be happy to analyze your resume for ATS compatibility! However, I don't see a resume attached to our conversation. Could you please upload your resume or provide the resume content you'd like me to analyze?",
        metadata: {
          intent: 'analyze-resume',
          requiresResume: true,
          suggestions: [
            "Upload your resume file",
            "Paste your resume content",
            "Connect to an existing resume"
          ]
        }
      };
    }

    // Perform ATS analysis
    const analysis = await this.performATSAnalysis(resumeContent, sessionContext.jobDescription);
    
    const response = await this.generateATSAnalysisResponse(analysis, resumeContent);
    
    return {
      content: response,
      metadata: {
        intent: 'analyze-resume',
        atsScore: analysis.overall,
        breakdown: analysis.breakdown,
        confidence: 0.9
      }
    };
  }

  async performATSAnalysis(resumeContent, jobDescription = null) {
    const analysis = {
      overall: 0,
      breakdown: {
        keywords: 0,
        formatting: 0,
        content: 0,
        skills: 0
      },
      suggestions: [],
      strengths: [],
      weaknesses: []
    };

    // Analyze keywords
    analysis.breakdown.keywords = await this.analyzeKeywords(resumeContent, jobDescription);
    
    // Analyze formatting
    analysis.breakdown.formatting = await this.analyzeFormatting(resumeContent);
    
    // Analyze content quality
    analysis.breakdown.content = await this.analyzeContent(resumeContent);
    
    // Analyze skills alignment
    analysis.breakdown.skills = await this.analyzeSkills(resumeContent, jobDescription);

    // Calculate overall score
    analysis.overall = Math.round(
      (analysis.breakdown.keywords * 0.3) +
      (analysis.breakdown.formatting * 0.25) +
      (analysis.breakdown.content * 0.25) +
      (analysis.breakdown.skills * 0.2)
    );

    // Generate suggestions
    analysis.suggestions = await this.generateImprovementSuggestions(analysis);
    analysis.strengths = await this.identifyStrengths(analysis, resumeContent);
    analysis.weaknesses = await this.identifyWeaknesses(analysis, resumeContent);

    return analysis;
  }

  async analyzeKeywords(resumeContent, jobDescription) {
    if (!jobDescription) {
      // General keyword analysis without job description
      const messages = [
        {
          role: 'system',
          content: `Analyze this resume for ATS keyword optimization. Rate the keyword density and relevance on a scale of 0-100. Consider:
          - Industry-specific keywords
          - Technical skills and tools
          - Action verbs and achievement language
          - Job titles and certifications
          
          Provide only a numeric score.`
        },
        {
          role: 'user',
          content: resumeContent
        }
      ];

      try {
        const result = await this.openai.generateCompletion(messages, {
          temperature: 0.1,
          maxTokens: 10
        });
        return Math.min(100, Math.max(0, parseInt(result.content) || 60));
      } catch (error) {
        return 60; // Default score
      }
    }

    // Keyword matching against job description
    const messages = [
      {
        role: 'system',
        content: `Compare this resume against the job description for keyword matching. Rate the match on a scale of 0-100 based on:
        - How many job requirements are mentioned in the resume
        - Relevance of skills and experience
        - Industry terminology alignment
        
        Job Description: ${jobDescription}
        
        Provide only a numeric score.`
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 10
      });
      return Math.min(100, Math.max(0, parseInt(result.content) || 70));
    } catch (error) {
      return 70; // Default score
    }
  }

  async analyzeFormatting(resumeContent) {
    const messages = [
      {
        role: 'system',
        content: `Analyze this resume's formatting for ATS compatibility. Rate on a scale of 0-100 based on:
        - Clear section headers (Experience, Education, Skills, etc.)
        - Consistent formatting and structure
        - Proper use of bullet points
        - No complex tables, graphics, or unusual formatting
        - Standard date formats
        - Contact information clearly presented
        
        Provide only a numeric score.`
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 10
      });
      return Math.min(100, Math.max(0, parseInt(result.content) || 80));
    } catch (error) {
      return 80; // Default score - formatting is usually good
    }
  }

  async analyzeContent(resumeContent) {
    const messages = [
      {
        role: 'system',
        content: `Analyze this resume's content quality for ATS scoring. Rate on a scale of 0-100 based on:
        - Quantified achievements and results
        - Strong action verbs
        - Relevant work experience
        - Complete sections (summary, experience, education, skills)
        - Professional language and tone
        - Appropriate length and detail
        
        Provide only a numeric score.`
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 10
      });
      return Math.min(100, Math.max(0, parseInt(result.content) || 70));
    } catch (error) {
      return 70; // Default score
    }
  }

  async analyzeSkills(resumeContent, jobDescription) {
    const basePrompt = `Analyze the skills section and overall skills mentioned in this resume. Rate on a scale of 0-100 based on:
    - Relevance of technical and soft skills
    - Industry-appropriate skill levels
    - Balance of technical and soft skills
    - Skill organization and presentation`;

    let prompt = basePrompt;
    if (jobDescription) {
      prompt += `\n\nJob Requirements: ${jobDescription}\n\nAlso consider how well the resume skills align with the job requirements.`;
    }

    const messages = [
      {
        role: 'system',
        content: prompt + '\n\nProvide only a numeric score.'
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.1,
        maxTokens: 10
      });
      return Math.min(100, Math.max(0, parseInt(result.content) || 75));
    } catch (error) {
      return 75; // Default score
    }
  }

  async generateImprovementSuggestions(analysis) {
    const suggestions = [];

    if (analysis.breakdown.keywords < 70) {
      suggestions.push("Add more industry-specific keywords and technical terms");
      suggestions.push("Include relevant action verbs and achievement language");
    }

    if (analysis.breakdown.formatting < 80) {
      suggestions.push("Use clear, standard section headers");
      suggestions.push("Ensure consistent formatting throughout");
      suggestions.push("Remove any tables, graphics, or complex formatting");
    }

    if (analysis.breakdown.content < 70) {
      suggestions.push("Quantify achievements with specific numbers and results");
      suggestions.push("Use stronger action verbs to describe accomplishments");
      suggestions.push("Provide more detailed descriptions of relevant experience");
    }

    if (analysis.breakdown.skills < 75) {
      suggestions.push("Expand your skills section with relevant technical skills");
      suggestions.push("Include both hard and soft skills");
      suggestions.push("Organize skills by category (Technical, Languages, etc.)");
    }

    return suggestions;
  }

  async identifyStrengths(analysis, resumeContent) {
    const strengths = [];

    if (analysis.breakdown.keywords >= 80) strengths.push("Strong keyword optimization");
    if (analysis.breakdown.formatting >= 85) strengths.push("Excellent ATS-friendly formatting");
    if (analysis.breakdown.content >= 80) strengths.push("High-quality content with quantified achievements");
    if (analysis.breakdown.skills >= 80) strengths.push("Comprehensive and relevant skills section");
    if (analysis.overall >= 85) strengths.push("Overall excellent ATS compatibility");

    return strengths;
  }

  async identifyWeaknesses(analysis, resumeContent) {
    const weaknesses = [];

    if (analysis.breakdown.keywords < 60) weaknesses.push("Limited keyword optimization");
    if (analysis.breakdown.formatting < 70) weaknesses.push("Formatting issues may cause ATS parsing problems");
    if (analysis.breakdown.content < 60) weaknesses.push("Content needs more quantified achievements");
    if (analysis.breakdown.skills < 65) weaknesses.push("Skills section needs expansion and organization");

    return weaknesses;
  }

  async generateATSAnalysisResponse(analysis, resumeContent) {
    const scoreCategory = this.getScoreCategory(analysis.overall);
    
    const messages = [
      {
        role: 'system',
        content: `You are an ATS expert providing detailed resume analysis. Create a comprehensive response that includes:
        1. Overall assessment of the ATS score (${analysis.overall}/100 - ${scoreCategory})
        2. Breakdown of the four main areas with specific feedback
        3. Top 3 prioritized improvement suggestions
        4. Positive highlights about what's working well
        
        Be encouraging but specific. Provide actionable advice.
        
        Analysis Data:
        - Keywords: ${analysis.breakdown.keywords}/100
        - Formatting: ${analysis.breakdown.formatting}/100
        - Content: ${analysis.breakdown.content}/100
        - Skills: ${analysis.breakdown.skills}/100
        
        Strengths: ${analysis.strengths.join(', ')}
        Suggestions: ${analysis.suggestions.join(', ')}`
      },
      {
        role: 'user',
        content: "Please provide my ATS analysis results."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 800
      });
      return result.content;
    } catch (error) {
      return this.getFallbackAnalysisResponse(analysis);
    }
  }

  getScoreCategory(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Needs Improvement';
  }

  getFallbackAnalysisResponse(analysis) {
    const category = this.getScoreCategory(analysis.overall);
    
    return `## ATS Analysis Results

**Overall Score: ${analysis.overall}/100 (${category})**

### Breakdown:
- **Keywords**: ${analysis.breakdown.keywords}/100
- **Formatting**: ${analysis.breakdown.formatting}/100
- **Content Quality**: ${analysis.breakdown.content}/100
- **Skills Alignment**: ${analysis.breakdown.skills}/100

### Key Recommendations:
${analysis.suggestions.slice(0, 3).map(s => `• ${s}`).join('\n')}

### What's Working Well:
${analysis.strengths.length > 0 ? analysis.strengths.map(s => `• ${s}`).join('\n') : '• Your resume shows good potential for optimization'}

Would you like me to focus on any specific area for improvement?`;
  }

  async compareWithJob(message, sessionContext) {
    const jobDescription = this.extractJobDescription(message) || sessionContext.jobDescription;
    
    if (!jobDescription) {
      return {
        content: "I'd be happy to compare your resume against a specific job description! Please provide the job description you'd like me to analyze against, or paste the job posting details.",
        metadata: {
          intent: 'compare-job',
          requiresJobDescription: true
        }
      };
    }

    const resumeContent = sessionContext.resumeContent || sessionContext.resume;
    if (!resumeContent) {
      return {
        content: "I need your resume content to compare against the job description. Could you please upload your resume or provide the resume content?",
        metadata: {
          intent: 'compare-job',
          requiresResume: true
        }
      };
    }

    const comparison = await this.performJobComparison(resumeContent, jobDescription);
    const response = await this.generateJobComparisonResponse(comparison);

    return {
      content: response,
      metadata: {
        intent: 'compare-job',
        matchPercentage: comparison.overall,
        confidence: 0.9
      }
    };
  }

  extractJobDescription(message) {
    // Simple extraction - look for job description in message
    const lines = message.split('\n');
    const jobDescStart = lines.findIndex(line => 
      line.toLowerCase().includes('job description') || 
      line.toLowerCase().includes('job posting') ||
      line.toLowerCase().includes('requirements')
    );
    
    if (jobDescStart !== -1 && lines.length > jobDescStart + 1) {
      return lines.slice(jobDescStart + 1).join('\n');
    }
    
    return null;
  }

  async performJobComparison(resumeContent, jobDescription) {
    const messages = [
      {
        role: 'system',
        content: `Compare this resume against the job description and provide a detailed analysis. Return a JSON object with:
        {
          "overall": <match percentage 0-100>,
          "skills_match": <percentage>,
          "experience_match": <percentage>,
          "requirements_met": [list of requirements the candidate meets],
          "missing_requirements": [list of missing requirements],
          "keyword_matches": [list of important matching keywords],
          "suggested_additions": [list of keywords/skills to add]
        }
        
        Job Description:
        ${jobDescription}`
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.2,
        maxTokens: 1000
      });
      
      return JSON.parse(result.content);
    } catch (error) {
      console.error('Job comparison error:', error);
      return {
        overall: 70,
        skills_match: 65,
        experience_match: 75,
        requirements_met: ['General qualifications'],
        missing_requirements: ['Specific technical requirements'],
        keyword_matches: ['Common industry terms'],
        suggested_additions: ['Add more relevant keywords']
      };
    }
  }

  async generateJobComparisonResponse(comparison) {
    return `## Job Match Analysis

**Overall Match: ${comparison.overall}%**

### Skills & Experience Match:
- **Skills Alignment**: ${comparison.skills_match}%
- **Experience Match**: ${comparison.experience_match}%

### Requirements Analysis:
**✅ Requirements You Meet:**
${comparison.requirements_met.map(req => `• ${req}`).join('\n')}

**❌ Missing Requirements:**
${comparison.missing_requirements.map(req => `• ${req}`).join('\n')}

### Keyword Optimization:
**Matching Keywords:** ${comparison.keyword_matches.join(', ')}

**Suggested Additions:**
${comparison.suggested_additions.map(add => `• ${add}`).join('\n')}

### Recommendations:
${this.generateJobMatchRecommendations(comparison)}`;
  }

  generateJobMatchRecommendations(comparison) {
    const recommendations = [];

    if (comparison.overall < 70) {
      recommendations.push("Consider significant resume modifications to better align with this role");
    }
    
    if (comparison.skills_match < 80) {
      recommendations.push("Add more relevant technical skills and experience");
    }
    
    if (comparison.missing_requirements.length > 3) {
      recommendations.push("Focus on highlighting transferable skills for missing requirements");
    }

    recommendations.push("Incorporate the suggested keywords naturally throughout your resume");
    
    return recommendations.join('\n• ');
  }

  async suggestImprovements(message, sessionContext) {
    const resumeContent = sessionContext.resumeContent || sessionContext.resume;
    
    if (!resumeContent) {
      return {
        content: "To provide specific improvement suggestions, I'll need to see your resume content. Could you please upload your resume or provide the content you'd like me to review?",
        metadata: {
          intent: 'suggest-improvements',
          requiresResume: true
        }
      };
    }

    const improvements = await this.generateDetailedImprovements(resumeContent, message);
    
    return {
      content: improvements,
      metadata: {
        intent: 'suggest-improvements',
        confidence: 0.9
      }
    };
  }

  async generateDetailedImprovements(resumeContent, specificArea = '') {
    const messages = [
      {
        role: 'system',
        content: `Provide specific, actionable improvement suggestions for this resume to enhance ATS compatibility and overall effectiveness. Focus on:
        
        1. **ATS Optimization**:
           - Keyword density and relevance
           - Standard formatting and section headers
           - File format and parsing compatibility
        
        2. **Content Enhancement**:
           - Quantified achievements
           - Strong action verbs
           - Relevant experience highlighting
        
        3. **Skills Optimization**:
           - Technical skills alignment
           - Skill organization and presentation
        
        4. **Professional Presentation**:
           - Language and tone
           - Structure and flow
           - Length and relevance
        
        Provide specific examples and actionable steps. Be encouraging but direct.
        
        ${specificArea ? `User is particularly interested in: ${specificArea}` : ''}`
      },
      {
        role: 'user',
        content: resumeContent
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1200
      });
      return result.content;
    } catch (error) {
      return "I'd be happy to provide improvement suggestions! Please ensure your resume content is properly formatted and try again.";
    }
  }

  async explainScore(message, sessionContext) {
    const lastScore = sessionContext.atsAnalysis?.lastScore || sessionContext.lastATSScore;
    
    if (!lastScore) {
      return {
        content: "I don't see a recent ATS score to explain. Would you like me to analyze your resume first to generate an ATS score?",
        metadata: {
          intent: 'explain-score',
          requiresAnalysis: true
        }
      };
    }

    const explanation = await this.generateScoreExplanation(lastScore, message);
    
    return {
      content: explanation,
      metadata: {
        intent: 'explain-score',
        confidence: 0.9
      }
    };
  }

  async generateScoreExplanation(scoreData, specificQuestion = '') {
    const messages = [
      {
        role: 'system',
        content: `Explain this ATS score in detail, helping the user understand what each component means and how ATS systems work. Be educational and specific.
        
        Score Data: ${JSON.stringify(scoreData)}
        
        ${specificQuestion ? `User's specific question: ${specificQuestion}` : ''}
        
        Cover:
        - What ATS systems look for
        - How each score component is calculated
        - Why these factors matter
        - What employers see in the results`
      },
      {
        role: 'user',
        content: "Please explain my ATS score results."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 800
      });
      return result.content;
    } catch (error) {
      return `## Understanding Your ATS Score

ATS (Applicant Tracking System) scores help predict how well your resume will perform when scanned by automated systems used by employers.

### Score Components:
- **Keywords (30%)**: How well your resume matches job-relevant terms
- **Formatting (25%)**: Whether your resume can be properly parsed
- **Content (25%)**: Quality and relevance of your experience
- **Skills (20%)**: Alignment of your skills with industry standards

A score of 70+ generally indicates good ATS compatibility, while 85+ is excellent.

Would you like me to analyze your resume to provide a detailed score breakdown?`;
    }
  }

  async handleGeneralATSQuery(message, sessionContext) {
    const systemPrompt = await this.openai.createSystemPrompt('ats-score', sessionContext);
    
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
          "Analyze my resume",
          "Compare with job description",
          "Get improvement suggestions"
        ]
      }
    };
  }
}

export default ATSScoringBot;