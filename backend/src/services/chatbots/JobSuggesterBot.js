import GroqAIService from '../groqAIService.js';
class JobSuggesterBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'Career Advisor';
  }

  async processMessage(message, userId, sessionContext) {
    try {
      const intent = await this.classifyCareerIntent(message);
      
      switch (intent) {
        case 'analyze-skills':
          return await this.analyzeSkills(message, sessionContext);
        case 'suggest-roles':
          return await this.suggestRoles(message, sessionContext);
        case 'career-path':
          return await this.suggestCareerPath(message, sessionContext);
        case 'skill-gap':
          return await this.analyzeSkillGaps(message, sessionContext);
        case 'industry-insight':
          return await this.provideIndustryInsights(message, sessionContext);
        case 'salary-info':
          return await this.provideSalaryInfo(message, sessionContext);
        default:
          return await this.handleGeneralCareerQuery(message, sessionContext);
      }
    } catch (error) {
      console.error('Job Suggester Bot error:', error);
      throw error;
    }
  }

  async classifyCareerIntent(message) {
    const messages = [
      {
        role: 'system',
        content: `Classify the user's career-related message into one of these categories:
        - "analyze-skills": Want skills analysis or skills assessment
        - "suggest-roles": Looking for job role recommendations
        - "career-path": Seeking career progression advice
        - "skill-gap": Want to identify missing skills for target roles
        - "industry-insight": Questions about industries or market trends
        - "salary-info": Salary expectations or market rates
        - "general": General career advice or guidance
        
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

  async analyzeSkills(message, sessionContext) {
    const userSkills = await this.extractUserSkills(message, sessionContext);
    
    if (!userSkills.technical.length && !userSkills.soft.length && !userSkills.experience.length) {
      return {
        content: `I'd love to analyze your skills and suggest career opportunities! To provide the most accurate recommendations, please share:

**Your Skills & Experience:**
- Technical skills (programming languages, software, tools)
- Soft skills (leadership, communication, problem-solving)
- Work experience (roles, industries, years)
- Education and certifications
- Interests and career goals

**Example:**
"I have 3 years of experience in Python, JavaScript, and React. I've worked in fintech and enjoy problem-solving and team collaboration. I have a Computer Science degree and am interested in machine learning."

The more details you provide, the better I can analyze your strengths and suggest matching career paths!`,
        metadata: {
          intent: 'analyze-skills',
          requiresMoreInfo: true,
          confidence: 0.8
        }
      };
    }

    const skillsAnalysis = await this.performSkillsAnalysis(userSkills, sessionContext);
    
    return {
      content: `## Your Skills Analysis 🎯

### Skill Profile Summary:
${skillsAnalysis.summary}

### Technical Skills Assessment:
${skillsAnalysis.technical.map(skill => `• **${skill.name}**: ${skill.level} (${skill.marketValue})`).join('\n')}

### Soft Skills Strengths:
${skillsAnalysis.softSkills.map(skill => `• **${skill.name}**: ${skill.impact}`).join('\n')}

### Experience Profile:
- **Total Experience**: ${skillsAnalysis.totalExperience}
- **Industry Focus**: ${skillsAnalysis.industries.join(', ')}
- **Career Stage**: ${skillsAnalysis.careerStage}

### Skill Categorization:
🔥 **High-Demand Skills**: ${skillsAnalysis.highDemand.join(', ')}
📈 **Growing Skills**: ${skillsAnalysis.growing.join(', ')}
🎯 **Specialized Skills**: ${skillsAnalysis.specialized.join(', ')}

### Recommended Role Categories:
${skillsAnalysis.roleCategories.map(cat => `• **${cat.category}**: ${cat.fit}% match - ${cat.reason}`).join('\n')}

### Next Steps:
${skillsAnalysis.nextSteps.map(step => `• ${step}`).join('\n')}

Would you like me to:
- Suggest specific job roles based on these skills?
- Identify skill gaps for target positions?
- Provide career progression recommendations?`,
      metadata: {
        intent: 'analyze-skills',
        skillsAnalysis: skillsAnalysis,
        confidence: 0.9
      }
    };
  }

  async extractUserSkills(message, sessionContext) {
    // Try to extract from message first
    const skillsFromMessage = await this.parseSkillsFromMessage(message);
    
    // Combine with context data
    const contextSkills = {
      technical: sessionContext.skills?.technical || [],
      soft: sessionContext.skills?.soft || [],
      experience: sessionContext.experience || [],
      education: sessionContext.education || []
    };

    return {
      technical: [...new Set([...skillsFromMessage.technical, ...contextSkills.technical])],
      soft: [...new Set([...skillsFromMessage.soft, ...contextSkills.soft])],
      experience: [...skillsFromMessage.experience, ...contextSkills.experience],
      education: [...skillsFromMessage.education, ...contextSkills.education]
    };
  }

  async parseSkillsFromMessage(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract skills and experience information from the user's message. Return JSON with:
        {
          "technical": ["technical skills, programming languages, tools"],
          "soft": ["soft skills, interpersonal skills"],
          "experience": [{"role": "job title", "company": "company", "years": "duration", "industry": "industry"}],
          "education": [{"degree": "degree", "field": "field", "institution": "school"}],
          "interests": ["career interests and goals"],
          "totalYears": "total years of experience"
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
        maxTokens: 500
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        technical: [],
        soft: [],
        experience: [],
        education: []
      };
    }
  }

  async performSkillsAnalysis(userSkills, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Perform a comprehensive skills analysis for career guidance. Analyze the user's skills and provide insights.

        User Skills Data: ${JSON.stringify(userSkills)}

        Return JSON with:
        {
          "summary": "2-3 sentence overall skills profile",
          "technical": [{"name": "skill", "level": "beginner/intermediate/advanced/expert", "marketValue": "high/medium/low demand"}],
          "softSkills": [{"name": "skill", "impact": "description of career impact"}],
          "totalExperience": "X years",
          "industries": ["industries they've worked in"],
          "careerStage": "entry-level/mid-level/senior/executive",
          "highDemand": ["skills that are in high market demand"],
          "growing": ["emerging/growing skills"],
          "specialized": ["unique or specialized skills"],
          "roleCategories": [{"category": "role type", "fit": percentage, "reason": "why it's a good fit"}],
          "nextSteps": ["actionable recommendations for career development"]
        }

        Consider current market trends, skill demand, and career progression paths.`
      },
      {
        role: 'user',
        content: "Analyze these skills for career guidance."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 1000
      });
      return JSON.parse(result.content);
    } catch (error) {
      return this.getFallbackSkillsAnalysis(userSkills);
    }
  }

  getFallbackSkillsAnalysis(userSkills) {
    return {
      summary: "You have a diverse skill set with both technical and interpersonal capabilities that open up multiple career paths.",
      technical: userSkills.technical.map(skill => ({
        name: skill,
        level: "intermediate",
        marketValue: "medium demand"
      })),
      softSkills: userSkills.soft.map(skill => ({
        name: skill,
        impact: "Valuable for leadership and collaboration"
      })),
      totalExperience: "Multiple years",
      industries: ["Technology", "Professional Services"],
      careerStage: "mid-level",
      highDemand: userSkills.technical.slice(0, 3),
      growing: [],
      specialized: [],
      roleCategories: [
        { category: "Technical Roles", fit: 75, reason: "Strong technical foundation" },
        { category: "Management Roles", fit: 60, reason: "Good combination of technical and soft skills" }
      ],
      nextSteps: [
        "Consider specializing in high-demand technical areas",
        "Develop leadership skills for career advancement",
        "Explore emerging technologies in your field"
      ]
    };
  }

  async suggestRoles(message, sessionContext) {
    const roleRequirements = await this.extractRoleRequirements(message);
    const userProfile = this.buildUserProfile(sessionContext);
    
    const roleSuggestions = await this.generateRoleSuggestions(roleRequirements, userProfile);
    
    return {
      content: `## Personalized Job Role Recommendations 🎯

Based on your skills, experience, and preferences, here are the best role matches:

### 🌟 Top Recommendations (90%+ Match)

${roleSuggestions.topTier.map(role => `**${role.title}**
- **Match Score**: ${role.matchScore}%
- **Salary Range**: ${role.salaryRange}
- **Why it fits**: ${role.reason}
- **Key Requirements**: ${role.requirements.join(', ')}
- **Growth Potential**: ${role.growth}
`).join('\n')}

### 🎯 Strong Matches (75-89% Match)

${roleSuggestions.strongMatches.map(role => `**${role.title}** (${role.matchScore}%)
- ${role.reason}
- Salary: ${role.salaryRange}
`).join('\n')}

### 🔄 Transition Opportunities (60-74% Match)

${roleSuggestions.transitionRoles.map(role => `**${role.title}** (${role.matchScore}%)
- ${role.reason}
- **Skills to develop**: ${role.skillGaps.join(', ')}
`).join('\n')}

### 🚀 Future Growth Paths

${roleSuggestions.futureRoles.map(role => `**${role.title}**
- **Timeline**: ${role.timeline}
- **Steps needed**: ${role.steps.join(' → ')}
`).join('\n')}

### 📈 Industry Insights

${roleSuggestions.industryInsights.map(insight => `• ${insight}`).join('\n')}

Would you like me to:
- Dive deeper into any specific role?
- Analyze skill gaps for a target position?
- Provide career progression strategies?`,
      metadata: {
        intent: 'suggest-roles',
        roleSuggestions: roleSuggestions,
        confidence: 0.9
      }
    };
  }

  async extractRoleRequirements(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract role preferences and requirements from the user's message. Return JSON with:
        {
          "targetRoles": ["specific roles mentioned"],
          "industries": ["preferred industries"],
          "location": "location preferences",
          "remoteWork": "preference for remote work",
          "salaryRange": {"min": number, "max": number},
          "careerGoals": ["short and long-term goals"],
          "workEnvironment": "startup/corporate/non-profit/etc",
          "mustHave": ["non-negotiable requirements"],
          "niceToHave": ["preferred but flexible requirements"]
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
        maxTokens: 400
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {};
    }
  }

  buildUserProfile(sessionContext) {
    return {
      skills: sessionContext.skills || {},
      experience: sessionContext.experience || [],
      education: sessionContext.education || [],
      preferences: sessionContext.userProfile?.preferences || {},
      currentRole: sessionContext.currentRole || null,
      careerGoals: sessionContext.careerGoals || []
    };
  }

  async generateRoleSuggestions(requirements, userProfile) {
    const messages = [
      {
        role: 'system',
        content: `Generate personalized job role recommendations based on user profile and preferences.

        User Profile: ${JSON.stringify(userProfile)}
        Requirements: ${JSON.stringify(requirements)}

        Consider:
        - Current job market trends
        - Skill transferability
        - Career progression paths
        - Salary expectations
        - Growth opportunities

        Return JSON with:
        {
          "topTier": [{"title": "role", "matchScore": 90-100, "reason": "why it fits", "salaryRange": "$X-Y", "requirements": ["key skills"], "growth": "growth potential"}],
          "strongMatches": [{"title": "role", "matchScore": 75-89, "reason": "fit explanation", "salaryRange": "$X-Y"}],
          "transitionRoles": [{"title": "role", "matchScore": 60-74, "reason": "fit with development", "skillGaps": ["skills to learn"]}],
          "futureRoles": [{"title": "role", "timeline": "X years", "steps": ["progression steps"]}],
          "industryInsights": ["market trends and opportunities"]
        }

        Provide realistic, actionable recommendations.`
      },
      {
        role: 'user',
        content: "Generate role recommendations."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1200
      });
      return JSON.parse(result.content);
    } catch (error) {
      return this.getFallbackRoleSuggestions();
    }
  }

  getFallbackRoleSuggestions() {
    return {
      topTier: [
        {
          title: "Senior Professional",
          matchScore: 92,
          reason: "Strong alignment with your experience and skills",
          salaryRange: "$70k-120k",
          requirements: ["Relevant experience", "Strong communication"],
          growth: "High potential for advancement"
        }
      ],
      strongMatches: [
        {
          title: "Team Lead",
          matchScore: 85,
          reason: "Good fit based on leadership potential",
          salaryRange: "$80k-130k"
        }
      ],
      transitionRoles: [
        {
          title: "Consultant",
          matchScore: 70,
          reason: "Leverages existing skills with some development needed",
          skillGaps: ["Consulting methodologies", "Client management"]
        }
      ],
      futureRoles: [
        {
          title: "Director",
          timeline: "3-5 years",
          steps: ["Gain management experience", "Develop strategic thinking", "Build leadership skills"]
        }
      ],
      industryInsights: [
        "Growing demand for professionals with your skill set",
        "Remote work opportunities increasing in this field",
        "Continuous learning important for career advancement"
      ]
    };
  }

  async handleGeneralCareerQuery(message, sessionContext) {
    const systemPrompt = await this.openai.createSystemPrompt('job-suggest', sessionContext);
    
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
          "Analyze my skills",
          "Suggest job roles",
          "Career path advice",
          "Skill gap analysis"
        ]
      }
    };
  }
}

export default JobSuggesterBot;