import express from 'express';
import {
  createChatSession,
  sendMessage,
  getChatHistory,
  getChatSessions,
  deleteChatSession,
  updateChatSession,
  getChatAnalytics
} from '../controllers/chatController.js';
import { verifyToken, subscriptionRateLimit, optionalAuth } from '../middleware/index.js';

const router = express.Router();

// Optional authentication middleware for demo purposes
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // Create a guest user session
    req.user = {
      userId: 'guest_' + Date.now(),
      isGuest: true
    };
    return next();
  }
  
  // If token exists, verify it
  return verifyToken(req, res, next);
};

// Rate limiting based on subscription
const chatRateLimits = {
  free: { chats: 50, messages: 500 },
  pro: { chats: 500, messages: 5000 },
  premium: { chats: -1, messages: -1 }
};

// Chat session routes with optional auth
router.post('/sessions', optionalAuthMiddleware, createChatSession);
router.get('/sessions', optionalAuthMiddleware, getChatSessions);
router.get('/sessions/:sessionId', optionalAuthMiddleware, getChatHistory);
router.put('/sessions/:sessionId', optionalAuthMiddleware, updateChatSession);
router.delete('/sessions/:sessionId', optionalAuthMiddleware, deleteChatSession);

// Message routes with optional auth
router.post('/sessions/:sessionId/messages', optionalAuthMiddleware, sendMessage);

// Analytics routes (requires auth)
router.get('/analytics', verifyToken, getChatAnalytics);

export default router;