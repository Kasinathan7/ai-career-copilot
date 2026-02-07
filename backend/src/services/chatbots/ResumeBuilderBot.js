import GroqAIService from '../groqAIService.js';
class ResumeBuilderBot {
  constructor() {
    this.openai = GroqAIService;
    this.name = 'Resume Builder Assistant';
  }

  async processMessage(message, userId, sessionContext) {
    try {
      const intent = await this.classifyResumeBuilderIntent(message);
      
      switch (intent) {
        case 'start-new':
          return await this.startNewResume(message, sessionContext);
        case 'add-experience':
          return await this.addExperience(message, sessionContext);
        case 'add-education':
          return await this.addEducation(message, sessionContext);
        case 'add-skills':
          return await this.addSkills(message, sessionContext);
        case 'write-summary':
          return await this.writeSummary(message, sessionContext);
        case 'improve-section':
          return await this.improveSection(message, sessionContext);
        case 'optimize-keywords':
          return await this.optimizeKeywords(message, sessionContext);
        case 'format-resume':
          return await this.formatResume(message, sessionContext);
        default:
          return await this.handleGeneralResumeQuery(message, sessionContext);
      }
    } catch (error) {
      console.error('Resume Builder Bot error:', error);
      throw error;
    }
  }

  async classifyResumeBuilderIntent(message) {
    const messages = [
      {
        role: 'system',
        content: `Classify the user's resume building message into one of these categories:
        - "start-new": Want to create a new resume from scratch
        - "add-experience": Adding or updating work experience
        - "add-education": Adding or updating education information
        - "add-skills": Adding or updating skills section
        - "write-summary": Creating or improving professional summary
        - "improve-section": Improving existing resume sections
        - "optimize-keywords": Optimizing for specific keywords or jobs
        - "format-resume": Questions about formatting and structure
        - "general": General resume building questions
        
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

  async startNewResume(message, sessionContext) {
    const userProfile = sessionContext.userProfile || {};
    
    return {
      content: `Great! I'll help you create a professional resume from scratch. Let's start by gathering some basic information about you.

## Getting Started

I'll guide you through each section step by step:

1. **Personal Information** - Contact details and professional summary
2. **Work Experience** - Your employment history and achievements
3. **Education** - Academic background and qualifications
4. **Skills** - Technical and soft skills
5. **Additional Sections** - Projects, certifications, etc.

Let's begin with your personal information. Please provide:

- Full name
- Email address
- Phone number
- City, State
- LinkedIn profile (optional)
- Professional website/portfolio (optional)

You can share this information in any format, and I'll help organize it properly for your resume.`,
      metadata: {
        intent: 'start-new',
        currentStep: 'personal-info',
        confidence: 0.9,
        nextSteps: ['personal-info', 'experience', 'education', 'skills']
      }
    };
  }

  async addExperience(message, sessionContext) {
    const experienceData = await this.extractExperienceData(message);
    
    if (!experienceData.company || !experienceData.position) {
      return {
        content: `I'd be happy to help you add work experience! To create a strong experience entry, I need some key information:

**Required:**
- Company name
- Job title/position
- Start date (month/year)
- End date (or "Present" if current)

**Recommended:**
- Location (city, state)
- Key responsibilities and achievements
- Specific results and metrics

Please provide the details for the position you'd like to add, and I'll help you craft compelling bullet points that highlight your achievements.

**Example format:**
"I worked at ABC Company as a Software Engineer from January 2020 to Present in San Francisco, CA. I developed web applications, led a team of 3 developers, and increased system performance by 25%."`,
        metadata: {
          intent: 'add-experience',
          requiresMoreInfo: true,
          confidence: 0.8
        }
      };
    }

    const optimizedExperience = await this.optimizeExperienceEntry(experienceData);
    
    return {
      content: `Excellent! I've crafted a professional experience entry for you:

## ${experienceData.position} at ${experienceData.company}
**${experienceData.startDate} - ${experienceData.endDate || 'Present'}** | ${experienceData.location || 'Location'}

${optimizedExperience.bulletPoints.map(point => `• ${point}`).join('\n')}

### Key Improvements Made:
${optimizedExperience.improvements.map(imp => `• ${imp}`).join('\n')}

Would you like me to:
- Add another work experience entry?
- Refine these bullet points further?
- Move on to the next resume section?`,
      metadata: {
        intent: 'add-experience',
        experienceEntry: optimizedExperience,
        confidence: 0.9
      }
    };
  }

  async extractExperienceData(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract work experience information from the user's message. Return a JSON object with:
        {
          "company": "Company name",
          "position": "Job title",
          "startDate": "Start date",
          "endDate": "End date or null if current",
          "location": "City, State",
          "responsibilities": ["List of responsibilities"],
          "achievements": ["List of achievements with metrics"]
        }
        
        If information is missing, use null for that field.`
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
      return { company: null, position: null };
    }
  }

  async optimizeExperienceEntry(experienceData) {
    const messages = [
      {
        role: 'system',
        content: `Create optimized bullet points for this work experience entry. Follow these best practices:

        1. **Start with strong action verbs** (Led, Developed, Implemented, Achieved, etc.)
        2. **Quantify achievements** with specific numbers, percentages, or results
        3. **Focus on impact** rather than just responsibilities
        4. **Use relevant keywords** for the industry
        5. **Keep each bullet point concise** (1-2 lines max)
        6. **Show progression** and increasing responsibility

        Return a JSON object with:
        {
          "bulletPoints": ["Array of 3-5 optimized bullet points"],
          "improvements": ["List of improvements made to the original content"]
        }

        Experience Data: ${JSON.stringify(experienceData)}`
      },
      {
        role: 'user',
        content: "Please optimize this experience entry."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 600
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        bulletPoints: [
          `${experienceData.responsibilities?.[0] || 'Performed key responsibilities'} at ${experienceData.company}`,
          `Contributed to team success and company objectives`,
          `Gained valuable experience in ${experienceData.position?.toLowerCase() || 'the role'}`
        ],
        improvements: ['Structured content with action verbs', 'Added professional formatting']
      };
    }
  }

  async addEducation(message, sessionContext) {
    const educationData = await this.extractEducationData(message);
    
    if (!educationData.institution || !educationData.degree) {
      return {
        content: `I'll help you add your education information! Please provide:

**Required:**
- Institution/University name
- Degree type (Bachelor's, Master's, PhD, etc.)
- Field of study/Major

**Optional but recommended:**
- Graduation date (month/year)
- GPA (if 3.5 or higher)
- Relevant coursework
- Academic honors or achievements
- Location

**Example:**
"I graduated from Stanford University with a Bachelor of Science in Computer Science in May 2020. My GPA was 3.8 and I took courses in Data Structures, Machine Learning, and Software Engineering."`,
        metadata: {
          intent: 'add-education',
          requiresMoreInfo: true,
          confidence: 0.8
        }
      };
    }

    const formattedEducation = await this.formatEducationEntry(educationData);
    
    return {
      content: `Perfect! Here's your formatted education entry:

## Education

**${educationData.degree} in ${educationData.field}**
${educationData.institution} | ${educationData.location || 'Location'} | ${educationData.graduationDate || 'Graduation Date'}

${formattedEducation.additionalInfo ? formattedEducation.additionalInfo : ''}

${formattedEducation.suggestions.length > 0 ? 
  `### Suggestions to strengthen this entry:\n${formattedEducation.suggestions.map(s => `• ${s}`).join('\n')}` : 
  ''}

Would you like to:
- Add another education entry?
- Include relevant coursework or projects?
- Move on to the skills section?`,
      metadata: {
        intent: 'add-education',
        educationEntry: formattedEducation,
        confidence: 0.9
      }
    };
  }

  async extractEducationData(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract education information from the user's message. Return a JSON object with:
        {
          "institution": "School/University name",
          "degree": "Degree type (Bachelor's, Master's, etc.)",
          "field": "Field of study/Major",
          "graduationDate": "Graduation date",
          "gpa": "GPA if mentioned",
          "location": "City, State",
          "coursework": ["Relevant courses"],
          "honors": ["Academic achievements or honors"]
        }
        
        If information is missing, use null for that field.`
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
      return { institution: null, degree: null };
    }
  }

  async formatEducationEntry(educationData) {
    const additionalInfo = [];
    const suggestions = [];

    // Add GPA if provided and good
    if (educationData.gpa && parseFloat(educationData.gpa) >= 3.5) {
      additionalInfo.push(`GPA: ${educationData.gpa}`);
    }

    // Add honors if provided
    if (educationData.honors && educationData.honors.length > 0) {
      additionalInfo.push(`Honors: ${educationData.honors.join(', ')}`);
    }

    // Add relevant coursework if provided
    if (educationData.coursework && educationData.coursework.length > 0) {
      additionalInfo.push(`Relevant Coursework: ${educationData.coursework.join(', ')}`);
    }

    // Generate suggestions
    if (!educationData.gpa || parseFloat(educationData.gpa) < 3.5) {
      suggestions.push("Consider adding GPA if it's 3.5 or higher");
    }
    
    if (!educationData.coursework || educationData.coursework.length === 0) {
      suggestions.push("Add relevant coursework that relates to your target job");
    }
    
    if (!educationData.honors || educationData.honors.length === 0) {
      suggestions.push("Include any academic honors, awards, or leadership roles");
    }

    return {
      additionalInfo: additionalInfo.join(' | '),
      suggestions
    };
  }

  async addSkills(message, sessionContext) {
    const skillsData = await this.extractSkillsData(message);
    const organizedSkills = await this.organizeSkills(skillsData, sessionContext);
    
    return {
      content: `Great! I've organized your skills into categories for maximum impact:

## Technical Skills
${organizedSkills.technical.map(skill => `• ${skill}`).join('\n')}

## Soft Skills
${organizedSkills.soft.map(skill => `• ${skill}`).join('\n')}

${organizedSkills.languages && organizedSkills.languages.length > 0 ? 
  `## Languages\n${organizedSkills.languages.map(lang => `• ${lang}`).join('\n')}\n` : 
  ''}

${organizedSkills.certifications && organizedSkills.certifications.length > 0 ? 
  `## Certifications\n${organizedSkills.certifications.map(cert => `• ${cert}`).join('\n')}\n` : 
  ''}

### Recommendations:
${organizedSkills.recommendations.map(rec => `• ${rec}`).join('\n')}

Would you like me to:
- Add more skills to any category?
- Optimize these skills for a specific job?
- Move on to writing your professional summary?`,
      metadata: {
        intent: 'add-skills',
        skillsData: organizedSkills,
        confidence: 0.9
      }
    };
  }

  async extractSkillsData(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract all skills mentioned in the user's message. Return a JSON object with:
        {
          "technical": ["Technical skills, programming languages, tools, software"],
          "soft": ["Soft skills, interpersonal skills"],
          "languages": ["Spoken languages with proficiency levels"],
          "certifications": ["Professional certifications or licenses"],
          "tools": ["Specific software, platforms, or tools"]
        }
        
        Categorize appropriately. If unsure about a skill's category, default to technical.`
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
      return {
        technical: [],
        soft: [],
        languages: [],
        certifications: [],
        tools: []
      };
    }
  }

  async organizeSkills(skillsData, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Organize and optimize these skills for a professional resume. 

        Guidelines:
        1. **Group similar skills together** (e.g., "JavaScript, Python, Java" instead of scattered)
        2. **Use industry-standard terminology** 
        3. **Prioritize by relevance** to the user's field
        4. **Add proficiency levels** where appropriate
        5. **Suggest missing skills** that would strengthen the profile
        6. **Limit to most relevant skills** (avoid overwhelming)

        Return a JSON object with organized skills and recommendations:
        {
          "technical": ["Organized technical skills"],
          "soft": ["Key soft skills"],
          "languages": ["Languages with proficiency"],
          "certifications": ["Professional certifications"],
          "recommendations": ["Suggestions for improvement"]
        }

        Skills Data: ${JSON.stringify(skillsData)}
        ${sessionContext.targetRole ? `Target Role: ${sessionContext.targetRole}` : ''}`
      },
      {
        role: 'user',
        content: "Please organize these skills."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 600
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        technical: skillsData.technical || [],
        soft: skillsData.soft || [],
        languages: skillsData.languages || [],
        certifications: skillsData.certifications || [],
        recommendations: ['Consider adding more industry-specific skills']
      };
    }
  }

  async writeSummary(message, sessionContext) {
    const summaryRequirements = await this.extractSummaryRequirements(message);
    const profileData = this.gatherProfileData(sessionContext);
    
    const generatedSummary = await this.generateProfessionalSummary(profileData, summaryRequirements);
    
    return {
      content: `Here's a compelling professional summary tailored for you:

## Professional Summary

${generatedSummary.summary}

### Alternative Versions:

**Option 2 (More concise):**
${generatedSummary.shortVersion}

**Option 3 (Achievement-focused):**
${generatedSummary.achievementVersion}

### Key Elements Included:
${generatedSummary.elements.map(elem => `• ${elem}`).join('\n')}

### Tips for Customization:
${generatedSummary.tips.map(tip => `• ${tip}`).join('\n')}

Which version do you prefer, or would you like me to adjust the tone or focus?`,
      metadata: {
        intent: 'write-summary',
        summaryData: generatedSummary,
        confidence: 0.9
      }
    };
  }

  async extractSummaryRequirements(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract requirements for the professional summary from the user's message. Return a JSON object with:
        {
          "targetRole": "Desired position or field",
          "experience": "Years of experience or level",
          "keyStrengths": ["Main skills or qualities to highlight"],
          "industry": "Target industry",
          "tone": "preferred tone (professional, dynamic, technical, etc.)",
          "length": "preferred length (short, medium, long)"
        }
        
        If not specified, use null for that field.`
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

  gatherProfileData(sessionContext) {
    return {
      experience: sessionContext.experience || [],
      education: sessionContext.education || [],
      skills: sessionContext.skills || {},
      userProfile: sessionContext.userProfile || {},
      targetRole: sessionContext.targetRole || null,
      achievements: sessionContext.achievements || []
    };
  }

  async generateProfessionalSummary(profileData, requirements) {
    const messages = [
      {
        role: 'system',
        content: `Create a compelling professional summary for a resume. Generate three versions:

        1. **Main Summary** (3-4 lines): Comprehensive but concise
        2. **Short Version** (2-3 lines): More concise for space-limited resumes
        3. **Achievement Version** (3-4 lines): Focus on quantified achievements

        Guidelines:
        - Start with years of experience and title/field
        - Highlight 2-3 key strengths or specializations
        - Include quantified achievements when possible
        - Use industry-relevant keywords
        - Maintain professional, confident tone
        - Tailor to the target role

        Return JSON with:
        {
          "summary": "Main professional summary",
          "shortVersion": "Concise version",
          "achievementVersion": "Achievement-focused version",
          "elements": ["Key elements included"],
          "tips": ["Customization tips"]
        }

        Profile Data: ${JSON.stringify(profileData)}
        Requirements: ${JSON.stringify(requirements)}`
      },
      {
        role: 'user',
        content: "Please generate my professional summary."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 800
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        summary: "Experienced professional with a proven track record of success and strong technical skills. Passionate about delivering high-quality results and contributing to team success.",
        shortVersion: "Dedicated professional with strong technical skills and proven results.",
        achievementVersion: "Results-driven professional who has consistently delivered exceptional outcomes and exceeded performance goals.",
        elements: ["Professional experience", "Key skills", "Career objectives"],
        tips: ["Customize for each job application", "Add specific metrics when possible"]
      };
    }
  }

  async improveSection(message, sessionContext) {
    const sectionData = await this.identifySection(message);
    
    if (!sectionData.section || !sectionData.content) {
      return {
        content: `I'd be happy to help improve a section of your resume! Please specify:

1. **Which section** you want to improve (Experience, Education, Skills, Summary, etc.)
2. **The current content** you'd like me to enhance

You can paste the existing section content, and I'll provide specific suggestions and improved versions.

**Example:**
"Please improve my experience section: 
• Worked on projects at ABC Company
• Helped with customer service
• Did data analysis"`,
        metadata: {
          intent: 'improve-section',
          requiresMoreInfo: true,
          confidence: 0.8
        }
      };
    }

    const improvements = await this.generateSectionImprovements(sectionData);
    
    return {
      content: `## Improved ${sectionData.section} Section

### Original:
${sectionData.content}

### Improved Version:
${improvements.improved}

### Key Improvements Made:
${improvements.changes.map(change => `• ${change}`).join('\n')}

### Additional Suggestions:
${improvements.suggestions.map(sugg => `• ${sugg}`).join('\n')}

Would you like me to refine this further or work on another section?`,
      metadata: {
        intent: 'improve-section',
        improvements: improvements,
        confidence: 0.9
      }
    };
  }

  async identifySection(message) {
    const messages = [
      {
        role: 'system',
        content: `Identify which resume section the user wants to improve and extract the content. Return JSON:
        {
          "section": "Section name (Experience, Education, Skills, Summary, etc.)",
          "content": "The actual resume content they want improved",
          "specificRequest": "Any specific improvement requests"
        }
        
        If section or content isn't clear, use null.`
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
      return { section: null, content: null };
    }
  }

  async generateSectionImprovements(sectionData) {
    const messages = [
      {
        role: 'system',
        content: `Improve this resume section with professional best practices:

        Section: ${sectionData.section}
        Current Content: ${sectionData.content}
        
        Improvements to make:
        - **Stronger action verbs** and professional language
        - **Quantified achievements** with specific metrics
        - **Better formatting** and structure
        - **Industry keywords** and relevant terminology
        - **Concise but impactful** descriptions
        - **ATS optimization**

        Return JSON with:
        {
          "improved": "The improved section content",
          "changes": ["List of specific improvements made"],
          "suggestions": ["Additional suggestions for enhancement"]
        }`
      },
      {
        role: 'user',
        content: "Please improve this section."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 600
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        improved: sectionData.content,
        changes: ['Enhanced professional language'],
        suggestions: ['Add more specific metrics and achievements']
      };
    }
  }

  async optimizeKeywords(message, sessionContext) {
    const jobDescription = this.extractJobDescription(message) || sessionContext.jobDescription;
    const resumeContent = sessionContext.resumeContent || sessionContext.resume;
    
    if (!jobDescription) {
      return {
        content: `I'll help you optimize your resume keywords for better ATS performance! 

To provide the most relevant keyword suggestions, please share:

1. **Job description** or job posting you're targeting
2. **Current resume content** (if you want to see what to add)

I can help you:
- Identify missing keywords from the job description
- Suggest where to naturally incorporate them
- Optimize existing content for better keyword density
- Maintain natural, professional language

Please paste the job description you're targeting!`,
        metadata: {
          intent: 'optimize-keywords',
          requiresJobDescription: true,
          confidence: 0.8
        }
      };
    }

    const keywordAnalysis = await this.performKeywordOptimization(resumeContent, jobDescription);
    
    return {
      content: `## Keyword Optimization Analysis

### Missing Keywords to Add:
${keywordAnalysis.missingKeywords.map(kw => `• **${kw.keyword}** - ${kw.suggestion}`).join('\n')}

### Current Strong Matches:
${keywordAnalysis.existingMatches.map(match => `• ${match}`).join('\n')}

### Recommended Placements:
${keywordAnalysis.placements.map(place => `• **${place.section}**: ${place.suggestion}`).join('\n')}

### Example Improvements:

**Before:** "${keywordAnalysis.examples.before}"
**After:** "${keywordAnalysis.examples.after}"

### Action Steps:
${keywordAnalysis.actionSteps.map(step => `• ${step}`).join('\n')}

Would you like me to help you incorporate these keywords into specific sections?`,
      metadata: {
        intent: 'optimize-keywords',
        keywordData: keywordAnalysis,
        confidence: 0.9
      }
    };
  }

  extractJobDescription(message) {
    // Extract job description from message
    const jobDescMatch = message.match(/job description[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
    if (jobDescMatch) {
      return jobDescMatch[1].trim();
    }
    
    // If message is mostly a job description
    if (message.length > 200 && (
      message.toLowerCase().includes('requirements') ||
      message.toLowerCase().includes('responsibilities') ||
      message.toLowerCase().includes('qualifications')
    )) {
      return message;
    }
    
    return null;
  }

  async performKeywordOptimization(resumeContent, jobDescription) {
    const messages = [
      {
        role: 'system',
        content: `Analyze the job description and resume for keyword optimization. Return JSON with:
        {
          "missingKeywords": [
            {"keyword": "keyword", "importance": "high/medium/low", "suggestion": "where/how to add it"}
          ],
          "existingMatches": ["keywords already present"],
          "placements": [
            {"section": "section name", "suggestion": "specific placement advice"}
          ],
          "examples": {
            "before": "example of current weak phrasing",
            "after": "improved version with keywords"
          },
          "actionSteps": ["prioritized action items"]
        }

        Job Description: ${jobDescription}
        ${resumeContent ? `Resume Content: ${resumeContent}` : 'No current resume provided'}`
      },
      {
        role: 'user',
        content: "Please analyze for keyword optimization."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.3,
        maxTokens: 800
      });
      return JSON.parse(result.content);
    } catch (error) {
      return {
        missingKeywords: [
          { keyword: "relevant skill", importance: "high", suggestion: "Add to skills section" }
        ],
        existingMatches: ["general skills"],
        placements: [
          { section: "Summary", suggestion: "Include key terms from job description" }
        ],
        examples: {
          before: "Worked on projects",
          after: "Led cross-functional projects using [specific tools]"
        },
        actionSteps: ["Review job description for key terms", "Update skills section"]
      };
    }
  }

  async formatResume(message, sessionContext) {
    const formatRequest = await this.extractFormatRequest(message);
    const formatAdvice = await this.generateFormatAdvice(formatRequest, sessionContext);
    
    return {
      content: formatAdvice,
      metadata: {
        intent: 'format-resume',
        confidence: 0.9
      }
    };
  }

  async extractFormatRequest(message) {
    const messages = [
      {
        role: 'system',
        content: `Extract formatting questions/requests from the user's message. Return JSON with:
        {
          "topic": "specific formatting topic (layout, sections, fonts, length, etc.)",
          "question": "the specific question asked",
          "resumeType": "type if mentioned (entry-level, executive, creative, etc.)"
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
      return { topic: 'general', question: message };
    }
  }

  async generateFormatAdvice(formatRequest, sessionContext) {
    const messages = [
      {
        role: 'system',
        content: `Provide comprehensive resume formatting advice. Be specific and actionable.

        User's Question: ${formatRequest.question}
        Topic: ${formatRequest.topic}
        Resume Type: ${formatRequest.resumeType || 'general'}

        Cover:
        - ATS-friendly formatting requirements
        - Professional design principles
        - Section organization best practices
        - Length and spacing guidelines
        - Font and style recommendations
        - Common formatting mistakes to avoid

        Provide specific, actionable advice with examples.`
      },
      {
        role: 'user',
        content: "Please provide formatting guidance."
      }
    ];

    try {
      const result = await this.openai.generateCompletion(messages, {
        temperature: 0.6,
        maxTokens: 800
      });
      return result.content;
    } catch (error) {
      return `## Resume Formatting Best Practices

### ATS-Friendly Guidelines:
• Use standard fonts (Arial, Calibri, Times New Roman)
• Keep font size between 10-12pt
• Use clear section headers (Experience, Education, Skills)
• Avoid tables, columns, graphics, or unusual formatting
• Save as .docx or .pdf as specified

### Professional Layout:
• 1-inch margins on all sides
• Consistent spacing between sections
• Left-aligned text (avoid centering except for name/contact)
• Use bullet points for achievements
• Keep to 1-2 pages (1 page for entry-level, 2 for experienced)

### Section Order:
1. Contact Information
2. Professional Summary
3. Work Experience (reverse chronological)
4. Education
5. Skills
6. Additional sections as relevant

Would you like specific advice for any particular formatting challenge?`;
    }
  }

  async handleGeneralResumeQuery(message, sessionContext) {
    const systemPrompt = await this.openai.createSystemPrompt('resume-builder', sessionContext);
    
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
          "Start building a new resume",
          "Add work experience",
          "Write a professional summary",
          "Optimize for keywords"
        ]
      }
    };
  }
}

export default ResumeBuilderBot;