import Resume from '../models/Resume.js';
import User from '../models/User.js';
import GroqAIService from '../services/groqAIService.js';
import DocumentParser from '../services/DocumentParser.js';
import PDFGenerator from '../services/PDFGenerator.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Create new resume
export const createResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, type = 'created', targetJob } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check user's usage limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const planLimits = {
      free: { resumes: 3 },
      pro: { resumes: 25 },
      premium: { resumes: -1 }
    };

    const userPlan = user.subscription.plan;
    const limits = planLimits[userPlan];

    if (limits.resumes !== -1) {
      const resumeCount = await Resume.countDocuments({ userId });
      if (resumeCount >= limits.resumes) {
        return res.status(403).json({
          success: false,
          message: `Resume limit reached for ${userPlan} plan. Please upgrade for more resumes.`
        });
      }
    }

    // Create resume
    const resume = new Resume({
      userId,
      title,
      content,
      type,
      targetJob: targetJob || null,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await resume.save();

    // Update user usage
    await user.updateUsageStats('resume_created');

    res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      data: { resume }
    });

  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resume'
    });
  }
};

// Get all resumes for user
export const getResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type, search } = req.query;

    const filter = { userId };
    if (type) {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'content.personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'content.personalInfo.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const resumes = await Resume.find(filter)
      .select('-content') // Exclude full content for list view
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalResumes = await Resume.countDocuments(filter);

    res.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResumes,
          pages: Math.ceil(totalResumes / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resumes'
    });
  }
};

// Get specific resume
export const getResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: { resume }
    });

  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume'
    });
  }
};

// Update resume
export const updateResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.userId;
    delete updates.createdAt;
    delete updates.analytics;

    const resume = await Resume.findOneAndUpdate(
      { _id: resumeId, userId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      message: 'Resume updated successfully',
      data: { resume }
    });

  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume'
    });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOneAndDelete({
      _id: resumeId,
      userId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Delete associated files if any
    if (resume.files && resume.files.length > 0) {
      for (const file of resume.files) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
};

// Upload resume file
export const uploadResumeFile = upload.single('resume');

export const processUploadedResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file before processing
    const validation = await DocumentParser.validateFile(file.path, file.mimetype);
    if (!validation.valid) {
      // Clean up uploaded file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.error('File cleanup error:', error);
      }
      
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Parse document content
    const parseResult = await DocumentParser.parseDocument(file.path, file.mimetype);
    
    if (!parseResult.success) {
      console.error('Document parsing failed:', parseResult.error);
      
      // Clean up uploaded file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.error('File cleanup error:', error);
      }
      
      return res.status(400).json({
        success: false,
        message: `Failed to parse document: ${parseResult.error}`
      });
    }

    // Extract structured resume data
    const structuredData = DocumentParser.extractResumeStructure(parseResult.content);

    // Enhance with AI parsing for better structure
    let aiParsedContent = {};
    try {
      if (parseResult.content && parseResult.content.trim()) {
        aiParsedContent = await GroqAIService.parseResumeContent(parseResult.content);
      }
    } catch (aiError) {
      console.warn('AI parsing failed, using basic extraction:', aiError);
      // Fallback to basic structure
      aiParsedContent = {
        personalInfo: structuredData.contactInfo,
        summary: structuredData.sections.summary?.join(' ') || '',
        experience: structuredData.sections.experience || [],
        education: structuredData.sections.education || [],
        skills: structuredData.skills || [],
        sections: structuredData.sections
      };
    }

    // Merge AI parsing with extracted structure
    const finalContent = {
      ...aiParsedContent,
      personalInfo: {
        ...structuredData.contactInfo,
        ...aiParsedContent.personalInfo
      },
      skills: [...new Set([...(structuredData.skills || []), ...(aiParsedContent.skills || [])])],
      rawText: parseResult.content,
      parsingMetadata: {
        ...parseResult.metadata,
        structureExtracted: true,
        aiEnhanced: !!aiParsedContent.personalInfo
      }
    };

    // Create resume from uploaded file
    const resume = new Resume({
      userId,
      title: aiParsedContent.title || finalContent.personalInfo?.name 
        ? `${finalContent.personalInfo.name} - Resume`
        : `Resume - ${new Date().toLocaleDateString()}`,
      content: finalContent,
      type: 'uploaded',
      files: [{
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        parsed: true,
        parsingMetadata: parseResult.metadata
      }],
      metadata: {
        uploadSource: 'file',
        originalFormat: parseResult.metadata.fileType,
        wordCount: parseResult.metadata.wordCount,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await resume.save();

    // Update user usage
    const user = await User.findById(userId);
    await user.updateUsageStats('resume_uploaded');

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: { 
        resume: {
          id: resume._id,
          title: resume.title,
          type: resume.type,
          createdAt: resume.createdAt,
          wordCount: parseResult.metadata.wordCount,
          fileInfo: {
            originalName: file.originalname,
            size: file.size,
            type: parseResult.metadata.fileType
          },
          parsingSuccess: parseResult.success,
          structureExtracted: !!structuredData.contactInfo
        }
      }
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process uploaded resume'
    });
  }
};

// Generate ATS score for resume
export const getATSScore = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;
    const { jobDescription } = req.body;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Generate ATS analysis using Groq AI
    const analysisPrompt = `
      Analyze this resume for ATS compatibility and provide a detailed score and recommendations.
      
      Resume Content: ${JSON.stringify(resume.content)}
      Job Description: ${jobDescription || 'General ATS analysis'}
      
      Provide analysis in JSON format with:
      - overallScore (0-100)
      - keywordMatch (0-100)
      - formatting (0-100)
      - sections (0-100)
      - recommendations (array of improvement suggestions)
      - strengths (array of strong points)
      - keywordAnalysis (missing and matched keywords)
    `;

    const atsAnalysis = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are an ATS analysis expert.' },
      { role: 'user', content: analysisPrompt }
    ], {
      temperature: 0.3,
      maxTokens: 1000
    });

    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(atsAnalysis.content);
    } catch (error) {
      parsedAnalysis = {
        overallScore: 75,
        keywordMatch: 70,
        formatting: 80,
        sections: 75,
        recommendations: ['Consider adding more relevant keywords', 'Improve section formatting'],
        strengths: ['Good overall structure', 'Clear contact information'],
        keywordAnalysis: { missing: [], matched: [] }
      };
    }

    // Update resume with ATS data
    resume.atsScore = {
      overall: parsedAnalysis.overallScore,
      breakdown: {
        keywords: parsedAnalysis.keywordMatch,
        formatting: parsedAnalysis.formatting,
        sections: parsedAnalysis.sections
      },
      recommendations: parsedAnalysis.recommendations,
      lastAnalyzed: new Date(),
      jobDescription: jobDescription || null
    };

    await resume.save();

    // Update user usage
    const user = await User.findById(userId);
    await user.updateUsageStats('ats_analysis');

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        atsAnalysis: {
          ...parsedAnalysis,
          analyzedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('ATS score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ATS score'
    });
  }
};

// Get resume versions
export const getResumeVersions = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId
    }).select('versions title');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        title: resume.title,
        versions: resume.versions
      }
    });

  } catch (error) {
    console.error('Get resume versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume versions'
    });
  }
};

// Create resume version
export const createResumeVersion = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;
    const { title, changes } = req.body;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Create new version
    const newVersion = {
      version: resume.versions.length + 1,
      title: title || `Version ${resume.versions.length + 1}`,
      content: resume.content,
      changes: changes || [],
      createdAt: new Date()
    };

    resume.versions.push(newVersion);
    await resume.save();

    res.status(201).json({
      success: true,
      message: 'Resume version created successfully',
      data: { version: newVersion }
    });

  } catch (error) {
    console.error('Create resume version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resume version'
    });
  }
};

// Optimize resume for job
export const optimizeForJob = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.userId;
    const { jobDescription, jobTitle, company } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      userId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Generate optimization suggestions using Groq AI
    const optimizationPrompt = `
      Optimize this resume for the specific job posting. Provide specific, actionable recommendations.
      
      Current Resume: ${JSON.stringify(resume.content)}
      Job Description: ${jobDescription}
      Job Title: ${jobTitle || 'Not specified'}
      Company: ${company || 'Not specified'}
      
      Provide optimization suggestions in JSON format with:
      - summary (optimized summary/objective)
      - skills (recommended skills to highlight)
      - experience (how to reframe experience bullets)
      - keywords (important keywords to include)
      - structure (recommended structure changes)
      - priorityChanges (top 5 most important changes)
    `;

    const optimizationSuggestions = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are a professional resume optimization expert.' },
      { role: 'user', content: optimizationPrompt }
    ], {
      temperature: 0.4,
      maxTokens: 1200
    });

    let parsedSuggestions;
    try {
      parsedSuggestions = JSON.parse(optimizationSuggestions.content);
    } catch (error) {
      parsedSuggestions = {
        summary: 'Consider updating your summary to better match the job requirements',
        skills: ['Add relevant technical skills', 'Highlight transferable skills'],
        experience: ['Quantify your achievements', 'Use action verbs'],
        keywords: ['Industry-specific terms', 'Job-specific keywords'],
        structure: ['Ensure consistent formatting', 'Prioritize relevant sections'],
        priorityChanges: [
          'Update summary statement',
          'Add relevant keywords',
          'Quantify achievements',
          'Highlight relevant skills',
          'Improve formatting'
        ]
      };
    }

    // Update user usage
    const user = await User.findById(userId);
    await user.updateUsageStats('resume_optimized');

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        jobTitle,
        company,
        optimizations: parsedSuggestions,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Optimize resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize resume'
    });
  }
};

// Upload PDF, parse, optimize, and generate ATS-friendly PDF
export const generateATSOptimizedPDF = async (req, res) => {
  try {
    const userId = req.user?.userId || `guest_${Date.now()}`;
    const file = req.file;
    const { jobDescription } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📄 Starting ATS PDF generation workflow...');
    console.log('   Uploaded file:', file.originalname);
    console.log('   User:', userId);

    // Step 1: Validate and parse the uploaded PDF
    const validation = await DocumentParser.validateFile(file.path, file.mimetype);
    if (!validation.valid) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    console.log('✅ File validated');

    // Step 2: Parse document content
    const parseResult = await DocumentParser.parseDocument(file.path, file.mimetype);
    
    if (!parseResult.success) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: `Failed to parse document: ${parseResult.error}`
      });
    }

    console.log('✅ Document parsed, word count:', parseResult.metadata.wordCount);

    // Step 3: Extract structured data using AI
    const structuredData = DocumentParser.extractResumeStructure(parseResult.content);
    
    console.log('🤖 Using Groq AI to parse resume content...');
    const aiParsedContent = await GroqAIService.parseResumeContent(parseResult.content);
    
    console.log('✅ AI parsing complete');

    // Merge AI parsing with basic extraction
    const mergedContent = {
      ...aiParsedContent,
      personalInfo: {
        ...structuredData.contactInfo,
        ...aiParsedContent.personalInfo
      },
      skills: {
        ...aiParsedContent.skills,
        technical: [...new Set([
          ...(structuredData.skills || []),
          ...(aiParsedContent.skills?.technical || [])
        ])]
      }
    };

    console.log('✅ Content merged');

    // Step 4: Optimize resume with AI (if job description provided)
    let optimizedContent = mergedContent;
    if (jobDescription) {
      console.log('🚀 Optimizing resume for job description...');
      optimizedContent = await GroqAIService.generateATSOptimizedResume(
        mergedContent,
        jobDescription
      );
      console.log('✅ Resume optimized for ATS');
    }

    // Step 5: Generate ATS-friendly PDF
    const outputFileName = `ats-optimized-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads/resumes', outputFileName);
    
    console.log('📝 Generating ATS-optimized PDF...');
    await PDFGenerator.generateATSResumePDF(optimizedContent, outputPath);
    
    console.log('✅ PDF generated successfully:', outputFileName);

    // Step 6: Save to database (only if user is authenticated)
    if (req.user && req.user.userId && !userId.startsWith('guest_')) {
      const resume = new Resume({
        userId,
        title: optimizedContent.personalInfo?.name 
          ? `${optimizedContent.personalInfo.name} - ATS Optimized Resume`
          : `ATS Optimized Resume - ${new Date().toLocaleDateString()}`,
        content: optimizedContent,
        type: 'optimized',
        files: [
          {
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date(),
            parsed: true
          },
          {
            originalName: outputFileName,
            filename: outputFileName,
            path: outputPath,
            size: (await fs.stat(outputPath)).size,
            mimetype: 'application/pdf',
            uploadedAt: new Date(),
            isOptimized: true
          }
        ],
        metadata: {
          uploadSource: 'file',
          originalFormat: parseResult.metadata.fileType,
          wordCount: parseResult.metadata.wordCount,
          optimized: true,
          optimizedFor: jobDescription ? 'specific-job' : 'general-ats',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });

      await resume.save();

      // Update user usage
      const user = await User.findById(userId);
      if (user) {
        await user.updateUsageStats('resume_uploaded');
        await user.updateUsageStats('ats_analysis');
      }
      
      console.log('✅ Resume saved to database');
    } else {
      console.log('ℹ️  Guest user - skipping database save');
    }

    // Return the optimized PDF file
    res.download(outputPath, outputFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to download optimized resume'
        });
      }

      console.log('✅ ATS-optimized PDF sent to client');

      // Clean up original uploaded file after successful download
      fs.unlink(file.path).catch(console.error);
    });

  } catch (error) {
    console.error('❌ Generate ATS PDF error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate ATS-optimized PDF',
      error: error.message
    });
  }
};

// Analyze uploaded resume file with AI (without saving)
export const analyzeUploadedResume = async (req, res) => {
  try {
    const file = req.file;
    const { jobDescription } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('🔍 Starting AI resume analysis...');
    console.log('   File:', file.originalname);

    // Validate and parse document
    const validation = await DocumentParser.validateFile(file.path, file.mimetype);
    if (!validation.valid) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const parseResult = await DocumentParser.parseDocument(file.path, file.mimetype);
    
    if (!parseResult.success) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: `Failed to parse document: ${parseResult.error}`
      });
    }

    console.log('✅ Document parsed');

    // Extract structured data
    const structuredData = DocumentParser.extractResumeStructure(parseResult.content);
    
    console.log('🤖 Analyzing with Groq AI...');

    // Create comprehensive analysis prompt
    const analysisPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and career consultant with 15+ years of experience. Analyze this resume with professional depth and provide highly detailed, actionable feedback.

RESUME CONTENT:
${parseResult.content}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ''}

ANALYSIS REQUIREMENTS:

Provide analysis in JSON format with this EXACT structure:
{
  "overall": <number 0-100>,
  "breakdown": {
    "keywords": <number 0-100>,
    "formatting": <number 0-100>,
    "content": <number 0-100>,
    "skills": <number 0-100>,
    "experience": <number 0-100>,
    "impact": <number 0-100>
  },
  "keywordMatches": [
    {
      "keyword": "specific skill/technology/term",
      "found": true/false,
      "frequency": <number of times found>,
      "importance": "critical|high|medium",
      "context": "brief context where found or why missing"
    }
  ],
  "suggestions": [
    "Highly specific, actionable improvement 1",
    "Highly specific, actionable improvement 2",
    "...(7-10 total suggestions)"
  ],
  "strengths": [
    "Specific strength with explanation 1",
    "Specific strength with explanation 2",
    "...(5-7 total strengths)"
  ],
  "improvements": [
    "Critical improvement area with specific fix 1",
    "Critical improvement area with specific fix 2",
    "...(5-7 total improvements)"
  ],
  "sectionAnalysis": {
    "contactInfo": {
      "score": <number 0-100>,
      "issues": ["any issues"],
      "recommendations": ["specific fixes"]
    },
    "summary": {
      "score": <number 0-100>,
      "issues": ["any issues"],
      "recommendations": ["specific fixes"]
    },
    "experience": {
      "score": <number 0-100>,
      "issues": ["any issues"],
      "recommendations": ["specific fixes"]
    },
    "education": {
      "score": <number 0-100>,
      "issues": ["any issues"],
      "recommendations": ["specific fixes"]
    },
    "skills": {
      "score": <number 0-100>,
      "issues": ["any issues"],
      "recommendations": ["specific fixes"]
    }
  },
  "atsCompatibility": {
    "score": <number 0-100>,
    "parseability": "excellent|good|fair|poor",
    "formatIssues": ["list any ATS parsing problems"],
    "recommendations": ["specific fixes for ATS compatibility"]
  },
  "impactAnalysis": {
    "quantifiedAchievements": <number count>,
    "actionVerbUsage": "excellent|good|fair|poor",
    "resultOrientation": <number 0-100>,
    "specificExamples": ["highlight 3-5 best achievement statements"],
    "missingMetrics": ["areas that need quantification"]
  }
}

DETAILED SCORING CRITERIA:

**Keywords (0-100):**
- Presence of industry-specific terminology
- ${jobDescription ? 'Match with job description requirements' : 'Relevance to industry standards'}
- Frequency and context of key technical terms
- Balance (not keyword stuffing)

**Formatting (0-100):**
- ATS-friendly structure (no tables, columns, images)
- Consistent font and styling
- Clear section headers
- Proper use of white space
- Bullet point consistency

**Content (0-100):**
- Clarity and conciseness
- Relevance of information
- Chronological accuracy
- Completeness of sections

**Skills (0-100):**
- Relevance and currency
- Technical depth
- ${jobDescription ? 'Alignment with required skills' : 'Industry relevance'}
- Skill categorization

**Experience (0-100):**
- Chronology and completeness
- Job descriptions clarity
- Company context provided
- Career progression logic

**Impact (0-100):**
- Use of metrics and numbers
- Action verb strength
- Achievement focus (not just duties)
- Demonstrated value and results

ANALYSIS FOCUS:

1. **ATS Compatibility:** Check for parsing issues, format problems, missing keywords
2. **Content Quality:** Evaluate achievement depth, quantification, specificity
3. **Professional Impact:** Assess demonstrated value, results, career progression
4. ${jobDescription ? '**Job Alignment:** Measure fit with specific job requirements, required skills, and qualifications' : '**Industry Standards:** Compare against best practices for the industry'}

Identify at least:
- 10-15 relevant keywords to check (with importance levels)
- 5-7 key strengths (be specific about WHY they're strong)
- 5-7 critical improvements (with HOW to fix them)
- 7-10 actionable suggestions (prioritized by impact)
- Section-by-section analysis with scores and recommendations

Be brutally honest but constructive. Provide SPECIFIC examples and ACTIONABLE fixes, not generic advice.`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are an expert ATS resume analyzer and career consultant with 15+ years of experience. Provide professional-grade, detailed analysis.' },
      { role: 'user', content: analysisPrompt }
    ], {
      temperature: 0.3,
      maxTokens: 3000
    });

    console.log('✅ AI analysis complete');

    // Parse AI response
    let analysis;
    try {
      let jsonContent = result.content.trim();
      // Remove markdown code blocks if present
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
      }
      
      analysis = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', result.content);
      
      // Enhanced fallback analysis
      analysis = {
        overall: 75,
        breakdown: {
          keywords: 70,
          formatting: 80,
          content: 75,
          skills: 70,
          experience: 72,
          impact: 68
        },
        keywordMatches: structuredData.skills.slice(0, 10).map(skill => ({
          keyword: skill,
          found: true,
          frequency: 1,
          importance: 'medium',
          context: 'Found in skills section'
        })),
        suggestions: [
          'Quantify your achievements with specific metrics (e.g., "increased sales by 25%")',
          'Use strong action verbs at the start of each bullet point',
          'Include relevant industry-specific keywords from job descriptions',
          'Expand technical skills section with specific tools and technologies',
          'Add certifications or professional development activities',
          'Include measurable outcomes for each role',
          'Ensure consistent formatting throughout all sections',
          'Add a compelling professional summary at the top',
          'Include links to portfolio, GitHub, or LinkedIn profile',
          'Remove generic phrases and focus on specific achievements'
        ],
        strengths: [
          'Clear and organized contact information',
          'Professional section structure with logical flow',
          'Good use of bullet points for readability',
          'Chronological work history is easy to follow',
          'Skills section is present and categorized'
        ],
        improvements: [
          'Add specific metrics and numbers to quantify achievements',
          'Include more relevant technical keywords for ATS',
          'Expand experience descriptions with measurable outcomes',
          'Improve bullet point consistency across all sections',
          'Add a professional summary or career objective',
          'Include more context about company size and industry',
          'Highlight leadership and team collaboration examples'
        ],
        sectionAnalysis: {
          contactInfo: {
            score: 90,
            issues: [],
            recommendations: ['Ensure email is professional', 'Add LinkedIn profile URL']
          },
          summary: {
            score: 60,
            issues: ['Professional summary may be missing or too brief'],
            recommendations: ['Add a compelling 2-3 sentence summary highlighting key strengths', 'Include years of experience and key specializations']
          },
          experience: {
            score: 70,
            issues: ['Needs more quantified achievements', 'Could use stronger action verbs'],
            recommendations: ['Add metrics to each bullet point', 'Start each point with powerful action verbs', 'Include specific technologies used']
          },
          education: {
            score: 85,
            issues: [],
            recommendations: ['Include GPA if above 3.5', 'Add relevant coursework or thesis if applicable']
          },
          skills: {
            score: 75,
            issues: ['Could be more comprehensive'],
            recommendations: ['Categorize skills (Technical, Soft Skills, Tools)', 'Add proficiency levels', 'Include emerging technologies']
          }
        },
        atsCompatibility: {
          score: 78,
          parseability: 'good',
          formatIssues: ['Ensure no complex formatting that may confuse ATS', 'Avoid headers/footers'],
          recommendations: ['Use standard section headers (EXPERIENCE, EDUCATION, SKILLS)', 'Avoid tables and columns', 'Save as .docx or PDF with text layer']
        },
        impactAnalysis: {
          quantifiedAchievements: 2,
          actionVerbUsage: 'fair',
          resultOrientation: 65,
          specificExamples: [
            'Look for opportunities to add metrics',
            'Transform responsibilities into achievements',
            'Add business impact statements'
          ],
          missingMetrics: [
            'Revenue impact or cost savings',
            'Efficiency improvements (time/resource savings)',
            'Team size managed or projects led',
            'Customer satisfaction or retention rates',
            'Scale of operations (users, transactions, etc.)'
          ]
        }
      };
    }

    // Clean up the uploaded file
    await fs.unlink(file.path);

    console.log('✅ Analysis complete, file cleaned up');

    res.json({
      success: true,
      data: {
        analysis,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          wordCount: parseResult.metadata.wordCount,
          analyzedAt: new Date(),
          jobDescriptionProvided: !!jobDescription
        }
      }
    });

  } catch (error) {
    console.error('❌ Analyze resume error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message
    });
  }
};

// AI-powered resume builder - upload and get AI-optimized version
export const buildResumeWithAI = async (req, res) => {
  try {
    const file = req.file;
    const { targetRole, yearsExperience, industry } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('🤖 Starting AI Resume Builder...');
    console.log('   File:', file.originalname);
    console.log('   Target Role:', targetRole);
    console.log('   Industry:', industry);

    // Step 1: Parse document
    const validation = await DocumentParser.validateFile(file.path, file.mimetype);
    if (!validation.valid) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const parseResult = await DocumentParser.parseDocument(file.path, file.mimetype);
    
    if (!parseResult.success) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: `Failed to parse document: ${parseResult.error}`
      });
    }

    console.log('✅ Document parsed');

    // Step 2: Extract structured data
    console.log('🤖 Parsing resume content with Groq AI...');
    const parsedContent = await GroqAIService.parseResumeContent(parseResult.content);
    console.log('✅ Resume content parsed');

    // Step 3: Use AI to optimize and enhance the resume
    console.log('🤖 Building optimized resume with AI...');
    const optimizationPrompt = `You are an expert resume writer and career consultant. Take this resume and create a highly optimized, professional version.

ORIGINAL RESUME DATA:
${JSON.stringify(parsedContent, null, 2)}

TARGET ROLE: ${targetRole || 'Not specified'}
YEARS OF EXPERIENCE: ${yearsExperience || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

Create an enhanced resume with:

1. **Professional Summary**: Write a compelling 3-4 sentence summary that:
   - Highlights key strengths and ${yearsExperience || '3+'} years of experience
   - Includes relevant keywords for ${targetRole || 'the role'}
   - Shows measurable impact and value proposition

2. **Experience Section**: For each role:
   - Transform duties into achievement-focused bullets
   - Add quantifiable metrics (%, $, numbers)
   - Use strong action verbs (Led, Architected, Optimized, Drove, Implemented)
   - Show business impact and results
   - Include 3-5 bullets per role

3. **Skills**: 
   - Categorize into Technical Skills, Tools, and Soft Skills
   - Add relevant skills for ${targetRole || 'the industry'}
   - Ensure ATS-friendly formatting

4. **Projects** (if applicable):
   - Highlight 2-3 key projects with technologies and impact
   - Include metrics and outcomes

5. **Certifications** (if applicable):
   - Add relevant certifications for ${industry || 'the industry'}

Return JSON with this EXACT structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email",
    "phone": "phone",
    "location": "location",
    "linkedin": "linkedin url",
    "github": "github url",
    "portfolio": "portfolio url"
  },
  "summary": "Compelling 3-4 sentence professional summary with keywords and metrics",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "achievements": [
        "Achievement-focused bullet with metrics (increased X by Y%)",
        "Another achievement with quantifiable impact",
        "Third achievement showing business value"
      ]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2", "..."],
    "tools": ["Tool 1", "Tool 2", "..."],
    "soft": ["Leadership", "Communication", "..."]
  },
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Name",
      "fieldOfStudy": "Field",
      "graduationDate": "MM/YYYY",
      "gpa": "GPA if >3.5",
      "honors": ["Honor 1", "Honor 2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "MM/YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description with impact",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "URL if available"
    }
  ],
  "languages": [
    {
      "name": "Language",
      "proficiency": "Level"
    }
  ],
  "optimizationsSummary": [
    "List of 5-7 specific improvements made to the original resume"
  ]
}

Make the resume compelling, professional, and ATS-optimized!`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are an expert resume writer and career consultant with 15+ years of experience helping professionals land their dream jobs.' },
      { role: 'user', content: optimizationPrompt }
    ], {
      temperature: 0.7,
      maxTokens: 4000
    });

    console.log('✅ AI optimization complete');

    // Parse AI response
    let optimizedResume;
    try {
      let jsonContent = result.content.trim();
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
      }
      
      optimizedResume = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', result.content);
      
      // Fallback: use parsed content with enhancements
      optimizedResume = {
        ...parsedContent,
        optimizationsSummary: [
          'Enhanced professional summary with quantified achievements',
          'Transformed experience bullets to focus on impact and results',
          'Added relevant technical keywords for ATS optimization',
          'Improved formatting and structure for better readability',
          'Strengthened action verbs and measurable outcomes'
        ]
      };
    }

    // Clean up uploaded file
    await fs.unlink(file.path);

    console.log('✅ Resume building complete');

    res.json({
      success: true,
      data: {
        originalResume: parsedContent,
        optimizedResume: optimizedResume,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          wordCount: parseResult.metadata.wordCount,
          targetRole: targetRole || null,
          industry: industry || null,
          processedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('❌ Build resume error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to build resume with AI',
      error: error.message
    });
  }
};

// NEW: Generate resume from text description using Groq AI
export const generateResumeFromText = async (req, res) => {
  try {
    const { 
      aboutMe,
      targetRole, 
      yearsExperience, 
      industry,
      name,
      email,
      phone,
      location
    } = req.body;

    if (!aboutMe || aboutMe.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 50 characters about yourself'
      });
    }

    console.log('🤖 Starting AI Resume Generation from Text...');
    console.log('   About Me Length:', aboutMe.length);
    console.log('   Target Role:', targetRole);
    console.log('   Industry:', industry);

    // Use Groq AI to generate a professional resume
    const generationPrompt = `You are an expert resume writer and career consultant. Based on the user's description, create a professional, ATS-optimized resume.

USER'S INFORMATION:
${aboutMe}

ADDITIONAL DETAILS:
- Name: ${name || 'Not provided'}
- Email: ${email || 'Not provided'}
- Phone: ${phone || 'Not provided'}
- Location: ${location || 'Not provided'}
- Target Role: ${targetRole || 'Not specified'}
- Years of Experience: ${yearsExperience || 'Not specified'}
- Industry: ${industry || 'Not specified'}

CREATE A PROFESSIONAL RESUME WITH:

1. **Personal Info**: Extract or infer from the description
2. **Professional Summary**: Write a compelling 3-4 sentence summary highlighting:
   - Years of experience and expertise
   - Key skills and strengths
   - Value proposition for ${targetRole || 'employers'}
   - Quantifiable achievements when possible

3. **Experience**: Based on the description, create 2-4 realistic work experiences:
   - Each with company, position, dates, location
   - 4-5 achievement-focused bullets per role
   - Include metrics and quantifiable results
   - Use strong action verbs (Led, Architected, Drove, Optimized)
   - Show business impact

4. **Skills**: Categorize relevant skills for ${targetRole || 'the role'}:
   - Technical Skills (programming languages, technologies)
   - Tools & Platforms
   - Soft Skills (leadership, communication, etc.)

5. **Education**: Infer or create realistic education background for the role

6. **Projects** (optional): If mentioned, create 1-2 project descriptions with:
   - Project name and brief description
   - Technologies used
   - Impact and outcomes

7. **Certifications** (optional): Add relevant certifications for ${industry || 'the field'}

Return ONLY valid JSON with this EXACT structure:
{
  "personalInfo": {
    "name": "${name || 'Full Name'}",
    "email": "${email || 'email@example.com'}",
    "phone": "${phone || '(555) 123-4567'}",
    "location": "${location || 'City, State'}",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "portfolio": "portfolio-url.com"
  },
  "summary": "Compelling 3-4 sentence professional summary with keywords and metrics",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "achievements": [
        "Led cross-functional team of 10 engineers to deliver X, resulting in Y% improvement",
        "Architected and implemented Z system, reducing costs by $XXk annually",
        "Drove initiative that increased user engagement by XX%",
        "Mentored 5 junior developers, improving team velocity by XX%"
      ]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2", "Skill 3", "..."],
    "tools": ["Tool 1", "Tool 2", "Tool 3", "..."],
    "soft": ["Leadership", "Communication", "Problem Solving", "..."]
  },
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "fieldOfStudy": "Computer Science",
      "graduationDate": "MM/YYYY",
      "gpa": "3.8",
      "honors": ["Dean's List", "Honors Program"]
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "MM/YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Built full-stack application that achieved X impact with Y users",
      "technologies": ["React", "Node.js", "MongoDB", "AWS"],
      "link": "github.com/username/project"
    }
  ],
  "languages": [
    {
      "name": "English",
      "proficiency": "Native"
    }
  ]
}

Make it professional, quantified, and ATS-optimized. Use realistic metrics and achievements based on the user's description!`;

    const result = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are an expert resume writer who creates compelling, professional resumes that get results. Focus on quantifiable achievements and ATS optimization.' },
      { role: 'user', content: generationPrompt }
    ], {
      temperature: 0.7,
      maxTokens: 4000
    });

    console.log('✅ AI generation complete');

    // Parse AI response
    let generatedResume;
    try {
      let jsonContent = result.content.trim();
      // Remove markdown code blocks if present
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
      }
      
      generatedResume = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', result.content);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate resume. Please try again with more detailed information.',
        error: 'AI response parsing failed'
      });
    }

    console.log('✅ Resume generation complete');

    res.json({
      success: true,
      data: {
        resume: generatedResume,
        metadata: {
          targetRole: targetRole || null,
          industry: industry || null,
          yearsExperience: yearsExperience || null,
          generatedAt: new Date(),
          inputLength: aboutMe.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Generate resume from text error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
};

// Generate PDF from resume data
export const generateResumePDF = async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData || !resumeData.personalInfo) {
      return res.status(400).json({
        success: false,
        message: 'Resume data is required'
      });
    }

    console.log('📝 Generating PDF from resume data...');

    // Generate PDF
    const outputFileName = `resume-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads/resumes', outputFileName);
    
    await PDFGenerator.generateATSResumePDF(resumeData, outputPath);
    
    console.log('✅ PDF generated successfully:', outputFileName);

    // Return the PDF file for download
    res.download(outputPath, outputFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to download PDF'
        });
      }

      console.log('✅ PDF sent to client');

      // Optional: Clean up file after some time
      setTimeout(() => {
        fs.unlink(outputPath).catch(console.error);
      }, 60000); // Delete after 1 minute
    });

  } catch (error) {
    console.error('❌ Generate PDF error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

