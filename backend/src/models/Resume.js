import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Resume title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    personalInfo: {
      name: {
        type: String,
        required: [true, 'Name is required']
      },
      email: {
        type: String,
        required: [true, 'Email is required']
      },
      phone: {
        type: String,
        trim: true
      },
      location: {
        type: String,
        trim: true
      },
      summary: {
        type: String,
        maxlength: [500, 'Summary cannot exceed 500 characters']
      },
      linkedinUrl: String,
      githubUrl: String,
      portfolioUrl: String
    },
    experience: [{
      company: {
        type: String,
        required: [true, 'Company name is required']
      },
      position: {
        type: String,
        required: [true, 'Position is required']
      },
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
      },
      achievements: [{
        type: String,
        maxlength: [200, 'Achievement cannot exceed 200 characters']
      }],
      location: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      }
    }],
    education: [{
      institution: {
        type: String,
        required: [true, 'Institution name is required']
      },
      degree: {
        type: String,
        required: [true, 'Degree is required']
      },
      field: {
        type: String,
        required: [true, 'Field of study is required']
      },
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      gpa: {
        type: Number,
        min: [0, 'GPA cannot be negative'],
        max: [4.0, 'GPA cannot exceed 4.0']
      },
      location: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      }
    }],
    skills: {
      technical: [{
        name: String,
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate'
        }
      }],
      soft: [String],
      languages: [{
        name: String,
        proficiency: {
          type: String,
          enum: ['basic', 'conversational', 'fluent', 'native'],
          default: 'conversational'
        }
      }]
    },
    certifications: [{
      name: {
        type: String,
        required: [true, 'Certification name is required']
      },
      issuer: {
        type: String,
        required: [true, 'Issuer is required']
      },
      date: {
        type: Date,
        required: [true, 'Issue date is required']
      },
      expiryDate: {
        type: Date
      },
      credentialId: String,
      verificationUrl: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      }
    }],
    projects: [{
      name: {
        type: String,
        required: [true, 'Project name is required']
      },
      description: {
        type: String,
        required: [true, 'Project description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
      },
      technologies: [String],
      url: String,
      githubUrl: String,
      startDate: Date,
      endDate: Date,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      }
    }]
  },
  atsScore: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    breakdown: {
      keywords: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      formatting: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      content: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      skills: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    suggestions: [String],
    lastAnalyzed: {
      type: Date
    },
    jobDescription: String
  },
  versions: [{
    versionName: {
      type: String,
      required: [true, 'Version name is required']
    },
    content: {
      type: mongoose.Schema.Types.Mixed
    },
    targetJob: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    }
  }],
  template: {
    type: String,
    enum: ['classic', 'modern', 'creative', 'minimal', 'professional'],
    default: 'classic'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating total experience
resumeSchema.virtual('totalExperience').get(function() {
  if (!this.content.experience || this.content.experience.length === 0) return 0;
  
  let totalMonths = 0;
  this.content.experience.forEach(exp => {
    const endDate = exp.current ? new Date() : exp.endDate;
    if (exp.startDate && endDate) {
      const months = (endDate.getFullYear() - exp.startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - exp.startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // years with 1 decimal
});

// Virtual for ATS score status
resumeSchema.virtual('atsScoreStatus').get(function() {
  const score = this.atsScore.overall;
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'needs-improvement';
});

// Index for faster queries
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ userId: 1, isActive: 1 });
resumeSchema.index({ 'atsScore.overall': -1 });
resumeSchema.index({ title: 'text', 'content.personalInfo.summary': 'text' });

// Method to calculate ATS score
resumeSchema.methods.calculateATSScore = function(jobDescription = '') {
  let keywordScore = 0;
  let formattingScore = 80; // Default good formatting score
  let contentScore = 0;
  let skillsScore = 0;

  // Calculate keyword matching if job description provided
  if (jobDescription) {
    const jobKeywords = jobDescription.toLowerCase().split(/\s+/);
    const resumeText = JSON.stringify(this.content).toLowerCase();
    const matchingKeywords = jobKeywords.filter(keyword => 
      resumeText.includes(keyword) && keyword.length > 3
    );
    keywordScore = Math.min(100, (matchingKeywords.length / Math.max(1, jobKeywords.length)) * 100);
  }

  // Calculate content score
  const hasPersonalInfo = this.content.personalInfo && this.content.personalInfo.summary;
  const hasExperience = this.content.experience && this.content.experience.length > 0;
  const hasEducation = this.content.education && this.content.education.length > 0;
  const hasSkills = this.content.skills && (this.content.skills.technical.length > 0 || this.content.skills.soft.length > 0);
  
  contentScore = (hasPersonalInfo ? 25 : 0) + (hasExperience ? 35 : 0) + 
                 (hasEducation ? 20 : 0) + (hasSkills ? 20 : 0);

  // Calculate skills score
  if (this.content.skills) {
    const totalSkills = this.content.skills.technical.length + this.content.skills.soft.length;
    skillsScore = Math.min(100, totalSkills * 10);
  }

  const overall = Math.round((keywordScore + formattingScore + contentScore + skillsScore) / 4);

  this.atsScore = {
    overall,
    breakdown: {
      keywords: Math.round(keywordScore),
      formatting: formattingScore,
      content: Math.round(contentScore),
      skills: Math.round(skillsScore)
    },
    lastAnalyzed: new Date(),
    jobDescription
  };

  return this.atsScore;
};

// Method to create a new version
resumeSchema.methods.createVersion = function(versionName, targetJob = '') {
  const newVersion = {
    versionName,
    content: JSON.parse(JSON.stringify(this.content)),
    targetJob,
    createdAt: new Date()
  };
  
  this.versions.push(newVersion);
  return this.save();
};

// Method to restore from version
resumeSchema.methods.restoreFromVersion = function(versionId) {
  const version = this.versions.id(versionId);
  if (!version) {
    throw new Error('Version not found');
  }
  
  this.content = version.content;
  return this.save();
};

// Static method to find user's resumes
resumeSchema.statics.findByUserId = function(userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find primary resume by user
resumeSchema.statics.findPrimaryByUserId = function(userId) {
  return this.findOne({ userId, isPrimary: true, isActive: true });
};

export default mongoose.model('Resume', resumeSchema);
