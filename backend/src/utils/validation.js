import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  preferences: Joi.object({
    jobAlerts: Joi.boolean().default(false),
    emailNotifications: Joi.boolean().default(true),
    profileVisibility: Joi.string().valid('public', 'private').default('private'),
    preferredIndustries: Joi.array().items(Joi.string()).default([]),
    preferredJobTypes: Joi.array().items(Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship')).default(['full-time']),
    salaryRange: Joi.object({
      min: Joi.number().min(0).default(0),
      max: Joi.number().min(0).default(999999)
    }).default({ min: 0, max: 999999 }),
    remoteWork: Joi.string().valid('required', 'preferred', 'open', 'no').default('open')
  }).default({})
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  
  rememberMe: Joi.boolean().default(false)
});

// Password change validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
});

// Resume creation validation schema
export const createResumeSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Resume title is required',
      'string.max': 'Resume title cannot exceed 200 characters',
      'any.required': 'Resume title is required'
    }),
  
  content: Joi.object({
    personalInfo: Joi.object({
      firstName: Joi.string().max(50),
      lastName: Joi.string().max(50),
      email: Joi.string().email(),
      phone: Joi.string().max(20),
      location: Joi.string().max(100),
      website: Joi.string().uri(),
      linkedin: Joi.string().uri(),
      github: Joi.string().uri()
    }),
    summary: Joi.string().max(1000),
    experience: Joi.array().items(
      Joi.object({
        title: Joi.string().max(100),
        company: Joi.string().max(100),
        location: Joi.string().max(100),
        startDate: Joi.date(),
        endDate: Joi.date().allow(null),
        current: Joi.boolean().default(false),
        description: Joi.string().max(2000),
        achievements: Joi.array().items(Joi.string().max(500))
      })
    ),
    education: Joi.array().items(
      Joi.object({
        institution: Joi.string().max(100),
        degree: Joi.string().max(100),
        field: Joi.string().max(100),
        startDate: Joi.date(),
        endDate: Joi.date().allow(null),
        gpa: Joi.number().min(0).max(4),
        honors: Joi.array().items(Joi.string().max(100))
      })
    ),
    skills: Joi.object({
      technical: Joi.array().items(Joi.string().max(50)),
      soft: Joi.array().items(Joi.string().max(50)),
      languages: Joi.array().items(
        Joi.object({
          language: Joi.string().max(50),
          proficiency: Joi.string().valid('basic', 'conversational', 'fluent', 'native')
        })
      )
    }),
    projects: Joi.array().items(
      Joi.object({
        name: Joi.string().max(100),
        description: Joi.string().max(1000),
        technologies: Joi.array().items(Joi.string().max(50)),
        url: Joi.string().uri(),
        github: Joi.string().uri(),
        startDate: Joi.date(),
        endDate: Joi.date().allow(null)
      })
    ),
    certifications: Joi.array().items(
      Joi.object({
        name: Joi.string().max(100),
        issuer: Joi.string().max(100),
        date: Joi.date(),
        expiryDate: Joi.date().allow(null),
        credentialId: Joi.string().max(100),
        url: Joi.string().uri()
      })
    )
  }).required(),
  
  type: Joi.string()
    .valid('created', 'uploaded', 'generated')
    .default('created'),
  
  targetJob: Joi.string().max(200).allow(null)
});

// Chat session creation validation schema
export const createChatSessionSchema = Joi.object({
  type: Joi.string()
    .valid('general', 'ats-scoring', 'resume-builder', 'mock-interview', 'job-search', 'career-advice')
    .default('general'),
  
  metadata: Joi.object().default({})
});

// Chat message validation schema
export const sendMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required'
    }),
  
  type: Joi.string()
    .valid('user', 'system')
    .default('user')
});

// Job search creation validation schema
export const createJobSearchSchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Search query is required',
      'string.max': 'Search query cannot exceed 500 characters',
      'any.required': 'Search query is required'
    }),
  
  filters: Joi.object({
    location: Joi.string().max(100).allow(null),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').allow(null),
    jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship').default('full-time'),
    salaryRange: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(0)
    }).allow(null),
    remote: Joi.boolean().default(false),
    companySize: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').allow(null),
    industry: Joi.string().max(100).allow(null)
  }).default({}),
  
  preferences: Joi.object({
    keywords: Joi.array().items(Joi.string().max(50)).default([]),
    excludedKeywords: Joi.array().items(Joi.string().max(50)).default([]),
    preferredCompanies: Joi.array().items(Joi.string().max(100)).default([]),
    dealBreakers: Joi.array().items(Joi.string().max(100)).default([])
  }).default({}),
  
  type: Joi.string()
    .valid('manual', 'automated', 'saved_jobs')
    .default('manual')
});

// Save job validation schema
export const saveJobSchema = Joi.object({
  jobId: Joi.string().max(100).allow(null),
  
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Job title is required',
      'string.max': 'Job title cannot exceed 200 characters',
      'any.required': 'Job title is required'
    }),
  
  company: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Company name is required',
      'string.max': 'Company name cannot exceed 100 characters',
      'any.required': 'Company name is required'
    }),
  
  location: Joi.string().max(100).allow(null),
  description: Joi.string().max(10000).default(''),
  url: Joi.string().uri().allow(null),
  source: Joi.string().max(50).default('manual'),
  salary: Joi.string().max(100).allow(null),
  notes: Joi.string().max(1000).default(''),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

// Update saved job validation schema
export const updateSavedJobSchema = Joi.object({
  notes: Joi.string().max(1000),
  priority: Joi.string().valid('low', 'medium', 'high'),
  applicationStatus: Joi.string().valid('not_applied', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'),
  applicationDate: Joi.date().allow(null),
  interviewDate: Joi.date().allow(null),
  followUpDate: Joi.date().allow(null),
  status: Joi.string().valid('saved', 'archived', 'deleted')
});

// User profile update validation schema
export const updateProfileSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    bio: Joi.string().max(500),
    location: Joi.string().max(100),
    website: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    github: Joi.string().uri(),
    phone: Joi.string().max(20),
    preferences: Joi.object({
      jobAlerts: Joi.boolean(),
      emailNotifications: Joi.boolean(),
      profileVisibility: Joi.string().valid('public', 'private'),
      preferredIndustries: Joi.array().items(Joi.string()),
      preferredJobTypes: Joi.array().items(Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship')),
      salaryRange: Joi.object({
        min: Joi.number().min(0),
        max: Joi.number().min(0)
      }),
      remoteWork: Joi.string().valid('required', 'preferred', 'open', 'no')
    })
  }),
  settings: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt'),
    timezone: Joi.string(),
    theme: Joi.string().valid('light', 'dark', 'auto'),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      inApp: Joi.boolean()
    })
  })
});

// ATS score request validation schema
export const atsScoreSchema = Joi.object({
  jobDescription: Joi.string()
    .max(10000)
    .allow('')
    .messages({
      'string.max': 'Job description cannot exceed 10000 characters'
    })
});

// Resume optimization validation schema
export const optimizeResumeSchema = Joi.object({
  jobDescription: Joi.string()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Job description is required',
      'string.max': 'Job description cannot exceed 10000 characters',
      'any.required': 'Job description is required'
    }),
  
  jobTitle: Joi.string().max(200),
  company: Joi.string().max(100)
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'updatedAt', 'title', 'name').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// Search validation schema
export const searchSchema = Joi.object({
  q: Joi.string().max(500),
  type: Joi.string(),
  status: Joi.string(),
  dateFrom: Joi.date(),
  dateTo: Joi.date()
});

export default {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createResumeSchema,
  createChatSessionSchema,
  sendMessageSchema,
  createJobSearchSchema,
  saveJobSchema,
  updateSavedJobSchema,
  updateProfileSchema,
  atsScoreSchema,
  optimizeResumeSchema,
  paginationSchema,
  searchSchema
};