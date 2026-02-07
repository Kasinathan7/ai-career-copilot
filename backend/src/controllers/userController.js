import User from '../models/User.js';
import Resume from '../models/Resume.js';
import ChatSession from '../models/ChatSession.js';
import JobSearch from '../models/JobSearch.js';

// Get user dashboard data
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user with basic stats
    const user = await User.findById(userId)
      .select('-password -refreshTokens')
      .populate('resumes', 'title createdAt atsScore');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent activity counts
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // Last 30 days

    const [chatSessions, jobSearches, savedJobsSearch] = await Promise.all([
      ChatSession.countDocuments({ 
        userId, 
        createdAt: { $gte: recentDate } 
      }),
      JobSearch.countDocuments({ 
        userId, 
        createdAt: { $gte: recentDate },
        type: { $ne: 'saved_jobs' }
      }),
      JobSearch.findOne({ 
        userId, 
        type: 'saved_jobs' 
      }).select('results')
    ]);

    const savedJobsCount = savedJobsSearch ? savedJobsSearch.results.length : 0;

    // Get recent chat sessions
    const recentChats = await ChatSession.find({ userId })
      .select('type createdAt analytics.totalMessages analytics.lastActivity')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Calculate usage for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyUsage = user.usage.monthly.find(
      m => m.month === currentMonth && m.year === currentYear
    ) || {
      chatsCreated: 0,
      messagesProcessed: 0,
      resumesCreated: 0,
      atsAnalyses: 0
    };

    // Get plan limits
    const planLimits = {
      free: { 
        chats: 50, 
        messages: 500, 
        resumes: 3, 
        atsAnalyses: 10 
      },
      pro: { 
        chats: 500, 
        messages: 5000, 
        resumes: 25, 
        atsAnalyses: 100 
      },
      premium: { 
        chats: -1, 
        messages: -1, 
        resumes: -1, 
        atsAnalyses: -1 
      }
    };

    const userPlanLimits = planLimits[user.subscription.plan];

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.email,
          subscription: user.subscription,
          joinedAt: user.createdAt
        },
        stats: {
          totalResumes: user.resumes.length,
          totalChats: recentChats.length,
          totalJobSearches: jobSearches,
          savedJobs: savedJobsCount
        },
        recentActivity: {
          chatSessions: recentChats,
          lastLogin: user.lastLogin
        },
        usage: {
          current: monthlyUsage,
          limits: userPlanLimits,
          percentUsed: {
            chats: userPlanLimits.chats === -1 ? 0 : 
              Math.round((monthlyUsage.chatsCreated / userPlanLimits.chats) * 100),
            messages: userPlanLimits.messages === -1 ? 0 : 
              Math.round((monthlyUsage.messagesProcessed / userPlanLimits.messages) * 100),
            resumes: userPlanLimits.resumes === -1 ? 0 : 
              Math.round((user.resumes.length / userPlanLimits.resumes) * 100),
            atsAnalyses: userPlanLimits.atsAnalyses === -1 ? 0 : 
              Math.round((monthlyUsage.atsAnalyses / userPlanLimits.atsAnalyses) * 100)
          }
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Prevent updating sensitive fields
    const restrictedFields = [
      'password', 'email', 'refreshTokens', 'subscription', 
      'usage', 'createdAt', 'lastLogin', 'isActive'
    ];
    restrictedFields.forEach(field => delete updates[field]);

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: updates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'profile.preferences': preferences,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { 
        preferences: user.profile.preferences 
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};

// Get user settings
export const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('settings profile.preferences subscription');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        settings: user.settings,
        preferences: user.profile.preferences,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings'
    });
  }
};

// Update user settings
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = req.body;

    // Validate settings structure
    const allowedSettings = ['language', 'timezone', 'theme', 'notifications'];
    const filteredSettings = {};
    
    allowedSettings.forEach(setting => {
      if (settings[setting] !== undefined) {
        filteredSettings[setting] = settings[setting];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          settings: { ...filteredSettings },
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { 
        settings: user.settings 
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

// Get user usage statistics
export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'current' } = req.query;

    const user = await User.findById(userId)
      .select('usage subscription');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let usageData;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (period === 'current') {
      // Current month usage
      usageData = user.usage.monthly.find(
        m => m.month === currentMonth && m.year === currentYear
      ) || {
        month: currentMonth,
        year: currentYear,
        chatsCreated: 0,
        messagesProcessed: 0,
        resumesCreated: 0,
        resumesUploaded: 0,
        atsAnalyses: 0,
        jobSearches: 0
      };
    } else if (period === 'lifetime') {
      // Lifetime usage
      usageData = user.usage.lifetime;
    } else if (period === 'history') {
      // All monthly usage history
      usageData = user.usage.monthly.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    }

    // Get plan limits
    const planLimits = {
      free: { 
        chats: 50, 
        messages: 500, 
        resumes: 3, 
        atsAnalyses: 10,
        jobSearches: 20
      },
      pro: { 
        chats: 500, 
        messages: 5000, 
        resumes: 25, 
        atsAnalyses: 100,
        jobSearches: 200
      },
      premium: { 
        chats: -1, 
        messages: -1, 
        resumes: -1, 
        atsAnalyses: -1,
        jobSearches: -1
      }
    };

    const userPlanLimits = planLimits[user.subscription.plan];

    res.json({
      success: true,
      data: {
        period,
        subscription: user.subscription,
        limits: userPlanLimits,
        usage: usageData
      }
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve usage statistics'
    });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete all user data
    await Promise.all([
      Resume.deleteMany({ userId }),
      ChatSession.deleteMany({ userId }),
      JobSearch.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

// Export user data (GDPR compliance)
export const exportData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user, resumes, chatSessions, jobSearches] = await Promise.all([
      User.findById(userId).select('-password -refreshTokens'),
      Resume.find({ userId }),
      ChatSession.find({ userId }),
      JobSearch.find({ userId })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const exportData = {
      user,
      resumes,
      chatSessions: chatSessions.map(session => ({
        ...session.toObject(),
        messages: session.messages.length // Only count, not content for privacy
      })),
      jobSearches,
      exportedAt: new Date()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}.json"`);
    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data'
    });
  }
};

// Get user activity feed
export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const skip = (page - 1) * limit;
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 90); // Last 90 days

    // Get recent activities from different collections
    const [recentResumes, recentChats, recentJobSearches] = await Promise.all([
      Resume.find({ 
        userId, 
        createdAt: { $gte: recentDate } 
      }).select('title createdAt updatedAt type').sort({ createdAt: -1 }),
      
      ChatSession.find({ 
        userId, 
        createdAt: { $gte: recentDate } 
      }).select('type createdAt analytics.totalMessages').sort({ createdAt: -1 }),
      
      JobSearch.find({ 
        userId, 
        createdAt: { $gte: recentDate },
        type: { $ne: 'saved_jobs' }
      }).select('query type createdAt analytics.totalResults').sort({ createdAt: -1 })
    ]);

    // Combine and format activities
    const activities = [];

    recentResumes.forEach(resume => {
      activities.push({
        type: 'resume',
        action: resume.type === 'uploaded' ? 'uploaded' : 'created',
        title: resume.title,
        timestamp: resume.createdAt,
        details: { resumeType: resume.type }
      });
    });

    recentChats.forEach(chat => {
      activities.push({
        type: 'chat',
        action: 'started',
        title: `${chat.type} chat session`,
        timestamp: chat.createdAt,
        details: { 
          chatType: chat.type, 
          messageCount: chat.analytics.totalMessages 
        }
      });
    });

    recentJobSearches.forEach(search => {
      activities.push({
        type: 'job_search',
        action: 'searched',
        title: search.query,
        timestamp: search.createdAt,
        details: { 
          searchType: search.type, 
          resultsCount: search.analytics.totalResults 
        }
      });
    });

    // Sort by timestamp and filter by type if specified
    let sortedActivities = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (type) {
      sortedActivities = sortedActivities.filter(activity => activity.type === type);
    }

    // Paginate
    const paginatedActivities = sortedActivities.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sortedActivities.length,
          pages: Math.ceil(sortedActivities.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity feed'
    });
  }
};