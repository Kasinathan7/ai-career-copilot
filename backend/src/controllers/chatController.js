import ChatSession from '../models/ChatSession.js';
import ChatbotService from '../services/chatbotService.js';
import SocketIOService from '../services/SocketIOService.js';
import User from '../models/User.js';

// Create new chat session
export const createChatSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const isGuest = req.user.isGuest || false;
    const { type = 'general', metadata = {} } = req.body;

    // For guest users, skip user lookup and usage checks
    let userProfile = {
      firstName: 'Guest',
      preferences: {},
      subscription: 'free'
    };

    if (!isGuest) {
      try {
        // Check user's usage limits
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Check if user has exceeded monthly limits
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyUsage = user.usage.monthly.find(
          m => m.month === currentMonth && m.year === currentYear
        );

        const planLimits = {
          free: { chats: 50, messages: 500 },
          pro: { chats: 500, messages: 5000 },
          premium: { chats: -1, messages: -1 } // unlimited
        };

        const userPlan = user.subscription.plan;
        const limits = planLimits[userPlan];

        if (limits.chats !== -1 && monthlyUsage && monthlyUsage.chatsCreated >= limits.chats) {
          return res.status(403).json({
            success: false,
            message: `Monthly chat limit reached for ${userPlan} plan. Please upgrade for more chats.`
          });
        }

        userProfile = {
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          preferences: user.profile?.preferences,
          subscription: user.subscription?.plan
        };
      } catch (userError) {
        console.error('User lookup error:', userError);
        // Continue as guest if user lookup fails
      }
    }

    // Create new chat session
    const chatSession = new ChatSession({
      userId,
      type,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        isGuest,
        ...metadata
      },
      context: {
        userProfile
      }
    });

    await chatSession.save();

    // Update user usage only for non-guest users
    if (!isGuest) {
      try {
        const user = await User.findById(userId);
        if (user) {
          await user.updateUsageStats('chat_created');
        }
      } catch (updateError) {
        console.error('Usage update error:', updateError);
        // Continue even if usage update fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: {
        sessionId: chatSession._id,
        type: chatSession.type,
        createdAt: chatSession.createdAt
      }
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send message to chat
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, type = 'user' } = req.body;
    const userId = req.user.userId;
    const isGuest = req.user.isGuest || false;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find chat session - for guest users, only check _id, for real users check both
    const chatSession = await ChatSession.findOne(
      isGuest ? { _id: sessionId } : { _id: sessionId, userId }
    );

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check user's message limits only for non-guest users
    if (!isGuest) {
      try {
        const user = await User.findById(userId);
        if (user && user.usage && user.usage.monthly) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthlyUsage = user.usage.monthly.find(
            m => m.month === currentMonth && m.year === currentYear
          );

          const planLimits = {
            free: { messages: 500 },
            pro: { messages: 5000 },
            premium: { messages: -1 }
          };

          const userPlan = user.subscription?.plan || 'free';
          const limits = planLimits[userPlan];

          if (limits.messages !== -1 && monthlyUsage && monthlyUsage.messagesProcessed >= limits.messages) {
            return res.status(403).json({
              success: false,
              message: `Monthly message limit reached for ${userPlan} plan. Please upgrade for more messages.`
            });
          }
        }
      } catch (userError) {
        console.error('User limits check error:', userError);
        // Continue even if user check fails
      }
    }

    // Add user message to session
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      metadata: {
        type,
        userAgent: req.headers['user-agent'],
        sessionDuration: Date.now() - chatSession.createdAt.getTime()
      }
    };

    chatSession.messages.push(userMessage);

    // Emit bot thinking indicator
    SocketIOService.emitBotThinking(sessionId, chatSession.type);

    // Process message through chatbot service
    const botResponse = await ChatbotService.processMessage(
      message.trim(),
      userId,
      chatSession.context
    );

    // Stop bot thinking indicator
    SocketIOService.stopBotThinking(sessionId);

    // Add bot response to session
    const botMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: botResponse.content,
      timestamp: new Date(),
      metadata: {
        intent: botResponse.metadata?.intent,
        confidence: botResponse.metadata?.confidence,
        suggestions: botResponse.metadata?.suggestions,
        processingTime: botResponse.metadata?.processingTime
      }
    };

    chatSession.messages.push(botMessage);

    // Update session context and analytics
    if (botResponse.context) {
      chatSession.context = { ...chatSession.context, ...botResponse.context };
    }

    chatSession.analytics.totalMessages = chatSession.messages.length;
    chatSession.analytics.lastActivity = new Date();

    if (botResponse.metadata?.intent) {
      const existingIntent = chatSession.analytics.intents.find(
        i => i.intent === botResponse.metadata.intent
      );
      if (existingIntent) {
        existingIntent.count++;
      } else {
        chatSession.analytics.intents.push({
          intent: botResponse.metadata.intent,
          count: 1
        });
      }
    }

    await chatSession.save();

    // Update user usage only for non-guest users
    if (!isGuest) {
      const user = await User.findById(userId);
      if (user) {
        await user.updateUsageStats('message_processed');
      }
    }

    // Send real-time notification for the bot response
    SocketIOService.sendNotification(userId, {
      type: 'chat-response',
      sessionId: chatSession._id,
      message: {
        id: botMessage.id,
        content: botMessage.content,
        intent: botResponse.metadata?.intent,
        suggestions: botResponse.metadata?.suggestions
      }
    });

    res.json({
      success: true,
      data: {
        userMessage,
        botMessage,
        sessionId: chatSession._id,
        suggestions: botResponse.metadata?.suggestions || []
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    // Try to save user message even if bot fails
    try {
      const chatSession = await ChatSession.findOne({
        _id: req.params.sessionId,
        userId: req.user.userId
      });
      
      if (chatSession) {
        chatSession.messages.push({
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content: req.body.message.trim(),
          timestamp: new Date()
        });
        
        chatSession.messages.push({
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again.',
          timestamp: new Date(),
          metadata: { error: true }
        });
        
        await chatSession.save();
      }
    } catch (saveError) {
      console.error('Failed to save error state:', saveError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    const chatSession = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Paginate messages
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const messages = chatSession.messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        sessionId: chatSession._id,
        type: chatSession.type,
        messages,
        totalMessages: chatSession.messages.length,
        page: parseInt(page),
        hasMore: endIndex < chatSession.messages.length,
        analytics: chatSession.analytics
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
};

// Get all chat sessions for user
export const getChatSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const filter = { userId };
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find(filter)
      .select('type createdAt updatedAt analytics.totalMessages analytics.lastActivity')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSessions = await ChatSession.countDocuments(filter);

    // Add preview of last message for each session
    const sessionsWithPreview = await Promise.all(
      sessions.map(async (session) => {
        const fullSession = await ChatSession.findById(session._id);
        const lastMessage = fullSession.messages[fullSession.messages.length - 1];
        
        return {
          ...session.toObject(),
          lastMessage: lastMessage ? {
            content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
            timestamp: lastMessage.timestamp,
            role: lastMessage.role
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        sessions: sessionsWithPreview,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalSessions,
          pages: Math.ceil(totalSessions / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat sessions'
    });
  }
};

// Delete chat session
export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const chatSession = await ChatSession.findOneAndDelete({
      _id: sessionId,
      userId
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session'
    });
  }
};

// Update chat session (e.g., title, type)
export const updateChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.userId;
    delete updates.messages;
    delete updates.analytics;
    delete updates.createdAt;

    const chatSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-messages');

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session updated successfully',
      data: { session: chatSession }
    });

  } catch (error) {
    console.error('Update chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat session'
    });
  }
};

// Get chat analytics
export const getChatAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = '30d' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const analytics = await ChatSession.aggregate([
      { $match: { userId: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$analytics.totalMessages' },
          avgMessagesPerSession: { $avg: '$analytics.totalMessages' },
          sessionTypes: { $push: '$type' },
          intents: { $push: '$analytics.intents' }
        }
      }
    ]);

    const result = analytics[0] || {
      totalSessions: 0,
      totalMessages: 0,
      avgMessagesPerSession: 0,
      sessionTypes: [],
      intents: []
    };

    // Process session types
    const typeCounts = result.sessionTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Process intents
    const intentCounts = {};
    result.intents.forEach(intentArray => {
      intentArray.forEach(intentObj => {
        intentCounts[intentObj.intent] = (intentCounts[intentObj.intent] || 0) + intentObj.count;
      });
    });

    res.json({
      success: true,
      data: {
        timeframe,
        summary: {
          totalSessions: result.totalSessions,
          totalMessages: result.totalMessages,
          avgMessagesPerSession: Math.round(result.avgMessagesPerSession || 0)
        },
        breakdown: {
          sessionTypes: typeCounts,
          topIntents: Object.entries(intentCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([intent, count]) => ({ intent, count }))
        }
      }
    });

  } catch (error) {
    console.error('Get chat analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat analytics'
    });
  }
};