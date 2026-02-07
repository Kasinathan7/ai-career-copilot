import GroqAIService from '../groqAIService.js';
class JobSearchBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'Job Search Assistant';
  }

  async processMessage(message, userId, sessionContext) {
    try {
      const intent = await this.classifySearchIntent(message);
      
      switch (intent) {
        case 'search-jobs':
          return await this.searchJobs(message, sessionContext);
        case 'save-job':
          return await this.saveJob(message, sessionContext);
        case 'application-status':
          return await this.trackApplications(message, sessionContext);
        case 'search-tips':
          return await this.provideSearchTips(message, sessionContext);
        case 'application-strategy':
          return await this.suggestApplicationStrategy(message, sessionContext);
        case 'networking-advice':
          return await this.provideNetworkingAdvice(message, sessionContext);
        case 'interview-prep':
          return await this.suggestInterviewPrep(message, sessionContext);
        default:
          return await this.handleGeneralSearchQuery(message, sessionContext);
      }
    } catch (error) {
      console.error('Job Search Bot error:', error);
      throw error;
    }
  }

  async classifySearchIntent(message) {
    const messages = [
      {
        role: 'system',
        content: `Classify the user's job search message into one of these categories:
        - "search-jobs": Want to find or search for job openings
        - "save-job": Want to save or bookmark a job posting
        - "application-status": Track application progress or status
        - "search-tips": Need job search strategies and tips
        - "application-strategy": How to apply effectively
        - "networking-advice": Networking strategies and tips
        - "interview-prep": Interview preparation suggestions
        - "general": General job search guidance
        
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

  async searchJobs(message, sessionContext) {
    const searchCriteria = await this.extractSearchCriteria(message);
    const userProfile = this.buildSearchProfile(sessionContext);
    
    // Generate personalized search strategy
    const searchStrategy = await this.generateSearchStrategy(searchCriteria, userProfile);
    
    return {
      content: `## Job Search Results & Strategy 🔍

### Search Parameters:
- **Keywords**: ${searchCriteria.keywords.join(', ')}
- **Location**: ${searchCriteria.location || 'Not specified'}
- **Experience Level**: ${searchCriteria.experienceLevel || 'Any'}
- **Job Type**: ${searchCriteria.jobType || 'Full-time'}
- **Salary Range**: ${searchCriteria.salaryRange || 'Not specified'}

### 🎯 Recommended Job Boards & Platforms:

**Primary Platforms:**
${searchStrategy.primaryPlatforms.map(platform => `• **${platform.name}**: ${platform.reason}`).join('\n')}

**Specialized Platforms:**
${searchStrategy.specializedPlatforms.map(platform => `• **${platform.name}**: ${platform.focus}`).join('\n')}

**Company Direct Applications:**
${searchStrategy.targetCompanies.map(company => `• **${company.name}**: ${company.reason}`).join('\n')}

### 🔍 Optimized Search Queries:

**For General Job Boards:**
${searchStrategy.searchQueries.general.map(query => `\`${query}\``).join('\n')}

**For LinkedIn:**
${searchStrategy.searchQueries.linkedin.map(query => `\`${query}\``).join('\n')}

**For Specialized Platforms:**
${searchStrategy.searchQueries.specialized.map(query => `\`${query}\``).join('\n')}

### 📊 Market Analysis:

**Demand Level**: ${searchStrategy.marketAnalysis.demand}
**Competition**: ${searchStrategy.marketAnalysis.competition}
**Trending Skills**: ${searchStrategy.marketAnalysis.trendingSkills.join(', ')}
**Salary Insights**: ${searchStrategy.marketAnalysis.salaryInsights}

### 📱 Job Alert Setup:

${searchStrategy.jobAlerts.map(alert => `**${alert.platform}**:
- Keywords: ${alert.keywords}
- Frequency: ${alert.frequency}
- Filters: ${alert.filters}`).join('\n\n')}

### 🎯 Application Strategy:

${searchStrategy.applicationStrategy.map(tip => `• ${tip}`).join('\n')}

### 📈 Success Metrics to Track:

${searchStrategy.metrics.map(metric => `• ${metric}`).join('\n')}

Would you like me to:
- Help you save interesting job postings?
- Create a personalized application strategy?
- Provide networking tips for your industry?`,
      metadata: {
        intent: 'search-jobs',
        searchCriteria: searchCriteria,
        searchStrategy: searchStrategy,
        confidence: 0.9
      }
    };
  }

  async extractSearchCriteria(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract job search criteria from the user's message. Return JSON with:
        {
          "keywords": ["job titles, skills, technologies"],
          "location": "location preference",
          "remote": "remote work preference",
          "experienceLevel": "entry/mid/senior/executive",
          "jobType": "full-time/part-time/contract/freelance",
          "salaryRange": {"min": number, "max": number},
          "companySize": "startup/small/medium/large/enterprise",
          "industries": ["preferred industries"],
          "mustHave": ["required criteria"],
          "niceToHave": ["preferred criteria"],
          "dealBreakers": ["things to avoid"]
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
      return { keywords: [], location: null };
    }
  }

  buildSearchProfile(sessionContext) {
    return {
      skills: sessionContext.skills || {},
      experience: sessionContext.experience || [],
      education: sessionContext.education || [],
      currentRole: sessionContext.currentRole || null,
      careerGoals: sessionContext.careerGoals || [],
      preferences: sessionContext.userProfile?.preferences || {},
      savedJobs: sessionContext.savedJobs || [],
      applications: sessionContext.applications || []
    };
  }

  async generateSearchStrategy(criteria, userProfile) {
    const messages = [
      {
        role: 'system',
        content: `Generate a comprehensive job search strategy based on search criteria and user profile.

        Search Criteria: ${JSON.stringify(criteria)}
        User Profile: ${JSON.stringify(userProfile)}

        Return JSON with:
        {
          "primaryPlatforms": [{"name": "platform", "reason": "why recommended"}],
          "specializedPlatforms": [{"name": "platform", "focus": "specialization"}],
          "targetCompanies": [{"name": "company", "reason": "why target"}],
          "searchQueries": {
            "general": ["optimized search terms"],
            "linkedin": ["LinkedIn specific queries"],
            "specialized": ["platform-specific queries"]
          },
          "marketAnalysis": {
            "demand": "high/medium/low",
            "competition": "analysis",
            "trendingSkills": ["in-demand skills"],
            "salaryInsights": "salary market info"
          },
          "jobAlerts": [{"platform": "name", "keywords": "terms", "frequency": "daily/weekly", "filters": "additional filters"}],
          "applicationStrategy": ["actionable application tips"],
          "metrics": ["success tracking metrics"]
        }

        Consider current job market trends and best practices.`
      },
      {
        role: 'user',
        content: "Generate search strategy."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1200
      });
      return JSON.parse(result.content);
    } catch (error) {
      return this.getFallbackSearchStrategy(criteria);
    }
  }

  getFallbackSearchStrategy(criteria) {
    return {
      primaryPlatforms: [
        { name: "LinkedIn", reason: "Largest professional network with good targeting" },
        { name: "Indeed", reason: "Comprehensive job aggregator" },
        { name: "Glassdoor", reason: "Company insights and salary data" }
      ],
      specializedPlatforms: [
        { name: "AngelList", focus: "Startup and tech roles" },
        { name: "Stack Overflow Jobs", focus: "Developer positions" }
      ],
      targetCompanies: [
        { name: "Industry Leaders", reason: "Established companies in your field" },
        { name: "Growing Startups", reason: "High growth potential" }
      ],
      searchQueries: {
        general: criteria.keywords.length ? criteria.keywords : ["Professional opportunities"],
        linkedin: ["#OpenToWork", "Hiring now"],
        specialized: ["Remote friendly", "Growth opportunities"]
      },
      marketAnalysis: {
        demand: "Good demand for skilled professionals",
        competition: "Moderate competition expected",
        trendingSkills: ["Communication", "Problem solving", "Adaptability"],
        salaryInsights: "Competitive salaries available"
      },
      jobAlerts: [
        {
          platform: "LinkedIn",
          keywords: "Relevant keywords",
          frequency: "daily",
          filters: "Experience level and location"
        }
      ],
      applicationStrategy: [
        "Tailor your resume for each application",
        "Write personalized cover letters",
        "Follow up professionally",
        "Leverage your network"
      ],
      metrics: [
        "Applications sent per week",
        "Response rate percentage",
        "Interview conversion rate",
        "Network connections made"
      ]
    };
  }

  async saveJob(message, sessionContext) {
    const jobDetails = await this.extractJobDetails(message);
    
    if (!jobDetails.company && !jobDetails.title) {
      return {
        content: `I'll help you save this job posting! To properly save it, please provide:

**Required Information:**
- Job title
- Company name
- Job posting URL (if available)

**Optional Details:**
- Salary range
- Location
- Application deadline
- Key requirements
- Your interest level (1-10)
- Notes about why you're interested

**Example:**
"Save this job: Senior Software Engineer at TechCorp, located in San Francisco, salary $120k-150k, found on LinkedIn. I'm very interested (9/10) because it matches my React and Node.js experience."

This helps me organize your saved jobs and remind you about deadlines!`,
        metadata: {
          intent: 'save-job',
          requiresMoreInfo: true,
          confidence: 0.8
        }
      };
    }

    const jobAnalysis = await this.analyzeJobFit(jobDetails, sessionContext);
    
    return {
      content: `## ✅ Job Saved Successfully!

### Job Details:
**${jobDetails.title}** at **${jobDetails.company}**
- 📍 Location: ${jobDetails.location || 'Not specified'}
- 💰 Salary: ${jobDetails.salary || 'Not specified'}
- 🔗 Source: ${jobDetails.source || 'Not specified'}
- ⏰ Deadline: ${jobDetails.deadline || 'Not specified'}

### 🎯 Fit Analysis:
**Match Score**: ${jobAnalysis.matchScore}%

**Strong Matches:**
${jobAnalysis.strengths.map(strength => `✅ ${strength}`).join('\n')}

**Potential Concerns:**
${jobAnalysis.concerns.map(concern => `⚠️ ${concern}`).join('\n')}

**Skills Alignment:**
${jobAnalysis.skillsAlignment.map(skill => `• ${skill.name}: ${skill.match}`).join('\n')}

### 📝 Application Strategy:
${jobAnalysis.applicationTips.map(tip => `• ${tip}`).join('\n')}

### 🗓️ Next Steps:
${jobAnalysis.nextSteps.map(step => `• ${step}`).join('\n')}

### 📊 Priority Ranking:
Based on your profile and preferences: **${jobAnalysis.priority}**

Your saved jobs count: **${(sessionContext.savedJobs?.length || 0) + 1}**

Would you like me to:
- Set up application reminders?
- Help with your application materials?
- Find similar job opportunities?`,
      metadata: {
        intent: 'save-job',
        jobDetails: jobDetails,
        jobAnalysis: jobAnalysis,
        saved: true,
        confidence: 0.9
      }
    };
  }

  async extractJobDetails(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract job posting details from the user's message. Return JSON with:
        {
          "title": "job title",
          "company": "company name",
          "location": "job location",
          "salary": "salary range",
          "url": "job posting URL",
          "source": "where found (LinkedIn, Indeed, etc)",
          "deadline": "application deadline",
          "requirements": ["key requirements"],
          "benefits": ["benefits mentioned"],
          "jobType": "full-time/part-time/contract",
          "remote": "remote work options",
          "userInterest": "interest level if mentioned",
          "userNotes": "any personal notes"
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

  async analyzeJobFit(jobDetails, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Analyze how well this job matches the user's profile and provide application strategy.

        Job Details: ${JSON.stringify(jobDetails)}
        User Profile: ${JSON.stringify(sessionContext)}

        Return JSON with:
        {
          "matchScore": 1-100,
          "strengths": ["areas where user is strong match"],
          "concerns": ["potential gaps or concerns"],
          "skillsAlignment": [{"name": "skill", "match": "strong/moderate/weak/missing"}],
          "applicationTips": ["specific tips for this application"],
          "nextSteps": ["immediate actions to take"],
          "priority": "High/Medium/Low",
          "competitionLevel": "assessment of competition",
          "improvementAreas": ["areas to strengthen before applying"]
        }`
      },
      {
        role: 'user',
        content: "Analyze job fit."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 800
      });
      return JSON.parse(result.content);
    } catch (error) {
      return this.getFallbackJobAnalysis(jobDetails);
    }
  }

  getFallbackJobAnalysis(jobDetails) {
    return {
      matchScore: 75,
      strengths: [
        "Good alignment with your career goals",
        "Company reputation matches your preferences"
      ],
      concerns: [
        "May need to highlight relevant experience more clearly"
      ],
      skillsAlignment: [
        { name: "Core Skills", match: "strong" },
        { name: "Industry Knowledge", match: "moderate" }
      ],
      applicationTips: [
        "Tailor your resume to highlight relevant experience",
        "Research the company thoroughly before applying",
        "Prepare specific examples for your cover letter"
      ],
      nextSteps: [
        "Update your resume for this specific role",
        "Draft a personalized cover letter",
        "Research the hiring manager if possible"
      ],
      priority: "Medium",
      competitionLevel: "Moderate competition expected",
      improvementAreas: [
        "Consider strengthening relevant technical skills",
        "Build more specific industry experience"
      ]
    };
  }

  async trackApplications(message, sessionContext) {
    const applicationData = await this.extractApplicationData(message);
    const applications = sessionContext.applications || [];
    
    const trackingAnalysis = await this.analyzeApplicationProgress(applications, applicationData);
    
    return {
      content: `## 📊 Application Tracking Dashboard

### Your Application Status:
**Total Applications**: ${trackingAnalysis.totalApplications}
**Active Applications**: ${trackingAnalysis.activeApplications}
**Success Rate**: ${trackingAnalysis.successRate}%

### 📈 Application Breakdown:
${trackingAnalysis.statusBreakdown.map(status => `${status.icon} **${status.status}**: ${status.count} (${status.percentage}%)`).join('\n')}

### 🎯 Recent Activity:
${trackingAnalysis.recentActivity.map(activity => `• ${activity.date}: ${activity.action} - ${activity.company}`).join('\n')}

### ⏰ Upcoming Actions:
${trackingAnalysis.upcomingActions.map(action => `• ${action.deadline}: ${action.action} - ${action.company}`).join('\n')}

### 📊 Performance Insights:
${trackingAnalysis.insights.map(insight => `• ${insight}`).join('\n')}

### 🔄 Follow-up Recommendations:
${trackingAnalysis.followUpActions.map(action => `• ${action}`).join('\n')}

### 📅 Weekly Goals:
${trackingAnalysis.weeklyGoals.map(goal => `• ${goal}`).join('\n')}

Would you like me to:
- Help you follow up on pending applications?
- Update the status of any applications?
- Suggest new opportunities based on your progress?`,
      metadata: {
        intent: 'application-status',
        trackingData: trackingAnalysis,
        confidence: 0.9
      }
    };
  }

  async extractApplicationData(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract application tracking information from the user's message. Return JSON with:
        {
          "company": "company name",
          "position": "job title",
          "status": "applied/screening/interview/offer/rejected",
          "dateApplied": "application date",
          "lastUpdate": "last status update",
          "nextStep": "what happens next",
          "contactPerson": "recruiter or hiring manager",
          "notes": "any additional notes",
          "priority": "high/medium/low"
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
        maxTokens: 300
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {};
    }
  }

  async analyzeApplicationProgress(applications, newData) {
    const messages = [
      {
        role: 'system',
        content: `Analyze application progress and provide insights.

        Current Applications: ${JSON.stringify(applications)}
        New Data: ${JSON.stringify(newData)}

        Return JSON with:
        {
          "totalApplications": number,
          "activeApplications": number,
          "successRate": percentage,
          "statusBreakdown": [{"status": "name", "count": number, "percentage": number, "icon": "emoji"}],
          "recentActivity": [{"date": "date", "action": "action", "company": "company"}],
          "upcomingActions": [{"deadline": "date", "action": "action", "company": "company"}],
          "insights": ["performance insights and trends"],
          "followUpActions": ["recommended follow-up actions"],
          "weeklyGoals": ["goals for the coming week"]
        }`
      },
      {
        role: 'user',
        content: "Analyze application progress."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 800
      });
      return JSON.parse(result.content);
    } catch (error) {
      return this.getFallbackTrackingAnalysis(applications.length);
    }
  }

  getFallbackTrackingAnalysis(applicationCount) {
    return {
      totalApplications: applicationCount || 0,
      activeApplications: Math.max(0, (applicationCount || 0) - 2),
      successRate: applicationCount > 0 ? Math.round((applicationCount * 0.2)) : 0,
      statusBreakdown: [
        { status: "Applied", count: Math.max(1, Math.floor((applicationCount || 0) * 0.6)), percentage: 60, icon: "📤" },
        { status: "In Review", count: Math.max(0, Math.floor((applicationCount || 0) * 0.3)), percentage: 30, icon: "👀" },
        { status: "Interviews", count: Math.max(0, Math.floor((applicationCount || 0) * 0.1)), percentage: 10, icon: "🗣️" }
      ],
      recentActivity: [
        { date: "This week", action: "Application submitted", company: "Recent Company" }
      ],
      upcomingActions: [
        { deadline: "Next week", action: "Follow up", company: "Pending Company" }
      ],
      insights: [
        "Consistent application activity",
        "Consider following up on older applications",
        "Good response rate compared to industry average"
      ],
      followUpActions: [
        "Send follow-up emails for applications over 2 weeks old",
        "Update your LinkedIn profile",
        "Prepare for upcoming interviews"
      ],
      weeklyGoals: [
        "Apply to 5 new positions",
        "Follow up on 3 pending applications",
        "Network with 2 industry professionals"
      ]
    };
  }

  async handleGeneralSearchQuery(message, sessionContext) {
    const systemPrompt = await this.openai.createSystemPrompt('job-search', sessionContext);
    
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
          "Search for jobs",
          "Save a job posting",
          "Track applications",
          "Get search tips"
        ]
      }
    };
  }
}

export default JobSearchBot;