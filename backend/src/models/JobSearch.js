import mongoose from 'mongoose';

const jobResultSchema = new mongoose.Schema({
  jobId: { type: String, required: true },
  title: { type: String, required: true },
  company: {
    name: { type: String, required: true },
    logo: String,
    description: String,
    size: String,
    industry: String
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: { type: Boolean, default: false }
  },
  description: String,
  requirements: [String],
  responsibilities: [String],
  qualifications: [String],
  benefits: [String],
  skills: [String],
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' }
  },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary'] 
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'executive', 'director']
  },
  source: { type: String, required: true }, // linkedin, indeed, github
  url: { type: String, required: true },
  applicationUrl: String,
  matchScore: { type: Number, min: 0, max: 100 },
  matchReasons: [String],
  postedDate: Date,
  expiryDate: Date,
  status: { 
    type: String, 
    enum: ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'archived'],
    default: 'saved'
  },
  appliedAt: Date,
  notes: String
});

const jobSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  searchQuery: {
    keywords: {
      type: String,
      required: [true, 'Search keywords are required'],
      trim: true,
      maxlength: [200, 'Keywords cannot exceed 200 characters']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'any'],
      default: 'any'
    },
    salaryRange: {
      min: {
        type: Number,
        min: 0,
        default: 0
      },
      max: {
        type: Number,
        min: 0,
        default: 200000
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    experience: {
      type: String,
      enum: ['entry-level', 'mid-level', 'senior-level', 'executive', 'any'],
      default: 'any'
    },
    remote: {
      type: Boolean,
      default: false
    },
    companySize: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'any'],
      default: 'any'
    },
    industry: {
      type: String,
      trim: true
    }
  },
  results: [{
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      maxlength: [10000, 'Description cannot exceed 10000 characters']
    },
    requirements: [{
      type: String,
      maxlength: [200, 'Requirement cannot exceed 200 characters']
    }],
    skills: [{
      name: String,
      required: {
        type: Boolean,
        default: false
      },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    }],
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      type: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly'
      }
    },
    benefits: [String],
    remote: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      enum: ['linkedin', 'indeed', 'github', 'glassdoor', 'monster', 'ziprecruiter', 'manual'],
      required: [true, 'Job source is required']
    },
    url: {
      type: String,
      required: [true, 'Job URL is required']
    },
    postedDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    matchDetails: {
      skillsMatch: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      experienceMatch: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      salaryMatch: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      locationMatch: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    appliedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'phone-screen', 'interviewed', 'offer', 'rejected', 'withdrawn'],
      default: 'saved'
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    }
  }],
  recommendations: [{
    jobId: {
      type: String,
      required: [true, 'Job ID is required']
    },
    reason: {
      type: String,
      required: [true, 'Recommendation reason is required'],
      maxlength: [300, 'Reason cannot exceed 300 characters']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: [true, 'Confidence score is required']
    },
    categories: [{
      type: String,
      enum: ['skills-match', 'experience-match', 'salary-match', 'company-culture', 'growth-opportunity']
    }],
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    }
  }],
  analytics: {
    totalResults: {
      type: Number,
      default: 0
    },
    appliedCount: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    topSources: [{
      source: String,
      count: Number
    }]
  },
  filters: {
    excludeCompanies: [String],
    includeKeywords: [String],
    excludeKeywords: [String],
    minMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSearched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total applications
jobSearchSchema.virtual('totalApplications').get(function() {
  return this.results.filter(job => job.status !== 'saved').length;
});

// Virtual for response rate calculation
jobSearchSchema.virtual('responseRate').get(function() {
  const applied = this.results.filter(job => job.appliedAt).length;
  const responded = this.results.filter(job => 
    ['phone-screen', 'interviewed', 'offer'].includes(job.status)
  ).length;
  
  return applied > 0 ? Math.round((responded / applied) * 100) : 0;
});

// Index for faster queries
jobSearchSchema.index({ userId: 1, createdAt: -1 });
jobSearchSchema.index({ userId: 1, isActive: 1 });
jobSearchSchema.index({ 'searchQuery.keywords': 'text', 'searchQuery.location': 'text' });
jobSearchSchema.index({ 'results.jobId': 1 });
jobSearchSchema.index({ 'results.matchScore': -1 });
jobSearchSchema.index({ 'results.postedDate': -1 });

// Pre-save middleware to update analytics
jobSearchSchema.pre('save', function(next) {
  if (this.isModified('results')) {
    this.analytics.totalResults = this.results.length;
    this.analytics.appliedCount = this.results.filter(job => job.appliedAt).length;
    
    // Calculate average match score
    if (this.results.length > 0) {
      const totalScore = this.results.reduce((sum, job) => sum + job.matchScore, 0);
      this.analytics.averageMatchScore = Math.round(totalScore / this.results.length);
    }
    
    // Update source analytics
    const sourceCount = {};
    this.results.forEach(job => {
      sourceCount[job.source] = (sourceCount[job.source] || 0) + 1;
    });
    
    this.analytics.topSources = Object.entries(sourceCount)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  next();
});

// Method to add job result
jobSearchSchema.methods.addJob = function(jobData) {
  // Check if job already exists
  const existingJob = this.results.find(job => job.jobId === jobData.jobId);
  if (existingJob) {
    // Update existing job
    Object.assign(existingJob, jobData);
  } else {
    // Add new job
    this.results.push(jobData);
  }
  
  return this.save();
};

// Method to update job status
jobSearchSchema.methods.updateJobStatus = function(jobId, status, notes = '') {
  const job = this.results.find(job => job.jobId === jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  job.status = status;
  if (notes) job.notes = notes;
  
  if (status === 'applied' && !job.appliedAt) {
    job.appliedAt = new Date();
  }
  
  return this.save();
};

// Method to calculate match score
jobSearchSchema.methods.calculateMatchScore = function(jobData, userResume = null) {
  let skillsMatch = 0;
  let experienceMatch = 50; // Default average
  let salaryMatch = 50; // Default average
  let locationMatch = 50; // Default average
  
  // Skills matching (if resume provided)
  if (userResume && userResume.content.skills) {
    const userSkills = [
      ...userResume.content.skills.technical.map(s => s.name || s),
      ...userResume.content.skills.soft
    ].map(skill => skill.toLowerCase());
    
    const jobSkills = jobData.skills ? 
      jobData.skills.map(s => s.name.toLowerCase()) : 
      [];
    
    if (jobSkills.length > 0) {
      const matchingSkills = userSkills.filter(skill => 
        jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
      );
      skillsMatch = Math.min(100, (matchingSkills.length / jobSkills.length) * 100);
    }
  }
  
  // Experience matching
  if (userResume && userResume.totalExperience !== undefined) {
    const userExperience = userResume.totalExperience;
    const requiredExperience = this.extractExperienceFromDescription(jobData.description);
    
    if (requiredExperience > 0) {
      if (userExperience >= requiredExperience) {
        experienceMatch = 100;
      } else {
        experienceMatch = Math.max(0, (userExperience / requiredExperience) * 100);
      }
    }
  }
  
  // Salary matching
  if (jobData.salary && this.searchQuery.salaryRange) {
    const jobMin = jobData.salary.min || 0;
    const jobMax = jobData.salary.max || jobMin;
    const userMin = this.searchQuery.salaryRange.min;
    const userMax = this.searchQuery.salaryRange.max;
    
    if (jobMax >= userMin && jobMin <= userMax) {
      salaryMatch = 100;
    } else if (jobMax < userMin) {
      salaryMatch = Math.max(0, (jobMax / userMin) * 100);
    } else {
      salaryMatch = Math.max(0, (userMax / jobMin) * 100);
    }
  }
  
  // Location matching
  if (this.searchQuery.location && jobData.location) {
    const searchLocation = this.searchQuery.location.toLowerCase();
    const jobLocation = jobData.location.toLowerCase();
    
    if (jobLocation.includes(searchLocation) || searchLocation.includes(jobLocation)) {
      locationMatch = 100;
    } else if (jobData.remote || this.searchQuery.remote) {
      locationMatch = 80; // Good match for remote
    } else {
      locationMatch = 20; // Poor location match
    }
  }
  
  // Calculate overall match score
  const overallMatch = Math.round(
    (skillsMatch * 0.4) + 
    (experienceMatch * 0.3) + 
    (salaryMatch * 0.2) + 
    (locationMatch * 0.1)
  );
  
  return {
    overall: overallMatch,
    breakdown: {
      skillsMatch: Math.round(skillsMatch),
      experienceMatch: Math.round(experienceMatch),
      salaryMatch: Math.round(salaryMatch),
      locationMatch: Math.round(locationMatch)
    }
  };
};

// Helper method to extract experience requirements
jobSearchSchema.methods.extractExperienceFromDescription = function(description) {
  if (!description) return 0;
  
  const experienceRegex = /(\d+)[\s]*\+?[\s]*years?[\s]*(?:of[\s]*)?experience/i;
  const match = description.match(experienceRegex);
  
  return match ? parseInt(match[1]) : 0;
};

// Method to get job recommendations
jobSearchSchema.methods.generateRecommendations = function() {
  const topJobs = this.results
    .filter(job => job.matchScore >= this.filters.minMatchScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
  
  this.recommendations = topJobs.map(job => ({
    jobId: job.jobId,
    reason: `${job.matchScore}% match based on your skills and preferences`,
    confidence: job.matchScore / 100,
    categories: this.getCategoriesForJob(job)
  }));
  
  return this.save();
};

// Helper method to get recommendation categories
jobSearchSchema.methods.getCategoriesForJob = function(job) {
  const categories = [];
  
  if (job.matchDetails.skillsMatch >= 70) categories.push('skills-match');
  if (job.matchDetails.experienceMatch >= 70) categories.push('experience-match');
  if (job.matchDetails.salaryMatch >= 70) categories.push('salary-match');
  if (job.company && job.company.includes('Google|Microsoft|Apple|Amazon|Facebook')) {
    categories.push('company-culture');
  }
  
  return categories;
};

// Static method to find user's active searches
jobSearchSchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ lastSearched: -1 });
};

// Static method to get popular searches
jobSearchSchema.statics.getPopularSearches = function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { 
      _id: '$searchQuery.keywords', 
      count: { $sum: 1 },
      avgMatchScore: { $avg: '$analytics.averageMatchScore' }
    }},
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

export default mongoose.model('JobSearch', jobSearchSchema);
