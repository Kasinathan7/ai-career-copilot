import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for custom IDs
    default: () => new mongoose.Types.ObjectId()
  },
  role: { 
    type: String, 
    enum: ['user', 'assistant', 'system'], 
    required: [true, 'Message role is required']
  },
  content: { 
    type: String, 
    required: [true, 'Message content is required'],
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  metadata: {
    chatbotType: {
      type: String,
      enum: ['main', 'ats-score', 'resume-builder', 'mock-interview', 'job-suggest', 'job-search'],
      default: 'main'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    processingTime: {
      type: Number,
      default: 0
    },
    tokens: {
      type: Number,
      default: 0
    },
    intent: String,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }]
  },
  attachments: [{
    type: {
      type: String,
      enum: ['file', 'image', 'resume', 'job-description']
    },
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }]
});

const chatSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for guest users
    required: [true, 'User ID is required']
  },
  sessionType: { 
    type: String, 
    enum: ['main', 'ats-score', 'resume-builder', 'mock-interview', 'job-suggest', 'job-search'],
    default: 'main',
    required: [true, 'Session type is required']
  },
  title: {
    type: String,
    default: function() {
      return `${this.sessionType} session`;
    },
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  messages: [messageSchema],
  context: {
    resumeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Resume' 
    },
    jobDescription: {
      type: String,
      maxlength: [5000, 'Job description cannot exceed 5000 characters']
    },
    targetRole: {
      type: String,
      maxlength: [100, 'Target role cannot exceed 100 characters']
    },
    userPreferences: {
      type: mongoose.Schema.Types.Mixed
    },
    interviewState: {
      currentQuestion: {
        type: Number,
        default: 0
      },
      questionType: {
        type: String,
        enum: ['behavioral', 'technical', 'situational', 'cultural'],
        default: 'behavioral'
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      totalQuestions: {
        type: Number,
        default: 5
      },
      scores: [{
        question: String,
        answer: String,
        score: Number,
        feedback: String
      }]
    },
    atsAnalysis: {
      lastScore: Number,
      improvements: [String],
      keywordSuggestions: [String]
    },
    jobSearchCriteria: {
      keywords: [String],
      location: String,
      jobType: String,
      salaryRange: {
        min: Number,
        max: Number
      },
      experienceLevel: String,
      remote: Boolean
    }
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'archived'],
    default: 'active'
  },
  settings: {
    language: {
      type: String,
      default: 'en'
    },
    voiceEnabled: {
      type: Boolean,
      default: false
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  analytics: {
    totalMessages: { 
      type: Number, 
      default: 0 
    },
    userMessages: { 
      type: Number, 
      default: 0 
    },
    assistantMessages: { 
      type: Number, 
      default: 0 
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastActivity: { 
      type: Date, 
      default: Date.now 
    },
    totalTokens: { 
      type: Number, 
      default: 0 
    },
    userSatisfactionScore: {
      type: Number,
      min: 1,
      max: 5
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    intents: [{
      intent: String,
      count: { type: Number, default: 1 }
    }]
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration
chatSessionSchema.virtual('duration').get(function() {
  if (this.messages.length < 2) return 0;
  const firstMessage = this.messages[0];
  const lastMessage = this.messages[this.messages.length - 1];
  return lastMessage.timestamp - firstMessage.timestamp;
});

// Index for faster queries
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, sessionType: 1, status: 1 });
chatSessionSchema.index({ 'messages.timestamp': -1 });
chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update analytics when messages are added
chatSessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.analytics.totalMessages = this.messages.length;
    this.analytics.userMessages = this.messages.filter(m => m.role === 'user').length;
    this.analytics.assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
    this.analytics.lastActivity = new Date();
    this.analytics.totalTokens = this.messages.reduce((total, msg) => {
      return total + (msg.metadata?.tokens || 0);
    }, 0);
    
    // Calculate average response time
    const assistantMessages = this.messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length > 0) {
      const totalResponseTime = assistantMessages.reduce((sum, msg) => 
        sum + (msg.metadata.processingTime || 0), 0);
      this.analytics.averageResponseTime = totalResponseTime / assistantMessages.length;
    }
  }
  next();
});

// Instance method to add message
chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  const message = {
    role,
    content,
    timestamp: new Date(),
    metadata: {
      chatbotType: this.sessionType,
      ...metadata
    }
  };

  this.messages.push(message);
  this.status = 'active';
  return this.save();
};

// Method to get conversation history for AI context
chatSessionSchema.methods.getConversationHistory = function(limit = 10) {
  return this.messages
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

// Method to update interview state
chatSessionSchema.methods.updateInterviewState = function(updates) {
  this.context.interviewState = {
    ...this.context.interviewState,
    ...updates
  };
  return this.save();
};

// Method to calculate completion rate
chatSessionSchema.methods.calculateCompletionRate = function() {
  switch (this.sessionType) {
    case 'mock-interview':
      const totalQuestions = this.context.interviewState?.totalQuestions || 5;
      const answeredQuestions = this.context.interviewState?.currentQuestion || 0;
      this.analytics.completionRate = Math.min(100, (answeredQuestions / totalQuestions) * 100);
      break;
    case 'resume-builder':
      // Calculate based on resume sections completed
      this.analytics.completionRate = Math.min(100, this.messages.length * 5);
      break;
    default:
      // For other types, base on message count
      this.analytics.completionRate = Math.min(100, this.messages.length * 10);
  }
  return this.save();
};

// Static method to get recent sessions by user
chatSessionSchema.statics.getRecentByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ 'analytics.lastActivity': -1 })
    .limit(limit)
    .select('sessionType title status analytics.totalMessages analytics.lastActivity createdAt');
};

// Static method to find active sessions for user
chatSessionSchema.statics.findActiveByUser = function(userId, sessionType = null) {
  const query = { userId, status: 'active' };
  if (sessionType) query.sessionType = sessionType;
  return this.find(query).sort({ updatedAt: -1 });
};

export default mongoose.model('ChatSession', chatSessionSchema);
