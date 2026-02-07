import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    linkedinUrl: {
      type: String,
      trim: true
    },
    githubUrl: {
      type: String,
      trim: true
    },
    portfolioUrl: {
      type: String,
      trim: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  preferences: {
    jobType: [{
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance']
    }],
    industries: [{
      type: String
    }],
    locations: [{
      type: String
    }],
    salaryRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 200000
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    experienceLevel: {
      type: String,
      enum: ['entry-level', 'mid-level', 'senior-level', 'executive'],
      default: 'entry-level'
    },
    remoteWork: {
      type: Boolean,
      default: false
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'active'
    },
    expiresAt: {
      type: Date
    }
  },
  usage: {
    chatMessagesCount: {
      type: Number,
      default: 0
    },
    resumesGenerated: {
      type: Number,
      default: 0
    },
    atsScoresRun: {
      type: Number,
      default: 0
    },
    mockInterviewsCompleted: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

// Method to check usage limits
userSchema.methods.canUseFeature = function(feature) {
  const limits = {
    free: {
      chatMessagesCount: 50,
      resumesGenerated: 2,
      atsScoresRun: 5,
      mockInterviewsCompleted: 1
    },
    premium: {
      chatMessagesCount: 500,
      resumesGenerated: 10,
      atsScoresRun: 25,
      mockInterviewsCompleted: 10
    },
    pro: {
      chatMessagesCount: -1, // unlimited
      resumesGenerated: -1,
      atsScoresRun: -1,
      mockInterviewsCompleted: -1
    }
  };

  const planLimits = limits[this.subscription.plan];
  const currentUsage = this.usage[feature];
  
  return planLimits[feature] === -1 || currentUsage < planLimits[feature];
};

// Method to increment usage
userSchema.methods.incrementUsage = function(feature) {
  this.usage[feature] += 1;
  return this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

export default mongoose.model('User', userSchema);
