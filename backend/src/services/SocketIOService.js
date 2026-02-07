import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';

class SocketIOService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> { socketId, userInfo, lastSeen }
    this.typingUsers = new Map(); // sessionId -> Set of userIds typing
    this.typingTimeouts = new Map(); // socketId -> timeout for stopping typing
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} server - HTTP server instance
   * @returns {Server} Socket.IO server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('Socket.IO server initialized');
    return this.io;
  }

  /**
   * Setup Socket.IO middleware for authentication
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userInfo = {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          subscription: user.subscription
        };

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId} (${socket.id})`);
      
      // Store connected user info
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        userInfo: socket.userInfo,
        lastSeen: new Date(),
        connectedAt: new Date()
      });

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Emit user online status
      this.broadcastUserStatus(socket.userId, 'online');

      // Handle chat session events
      this.setupChatHandlers(socket);

      // Handle typing indicators
      this.setupTypingHandlers(socket);

      // Handle notification events
      this.setupNotificationHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.userId} (${reason})`);
        
        // Update user status
        this.connectedUsers.delete(socket.userId);
        this.broadcastUserStatus(socket.userId, 'offline');
        
        // Clear typing indicators
        this.clearUserTyping(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  /**
   * Setup chat-related event handlers
   * @param {Socket} socket - Socket instance
   */
  setupChatHandlers(socket) {
    // Join chat session room
    socket.on('join-chat', async (data) => {
      try {
        const { sessionId } = data;
        
        // Verify user has access to this session
        const session = await ChatSession.findOne({
          _id: sessionId,
          userId: socket.userId
        });

        if (!session) {
          socket.emit('error', { message: 'Chat session not found or access denied' });
          return;
        }

        socket.join(`chat:${sessionId}`);
        socket.currentChatSession = sessionId;

        socket.emit('chat-joined', {
          sessionId,
          timestamp: new Date()
        });

        console.log(`User ${socket.userId} joined chat session ${sessionId}`);

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat session' });
      }
    });

    // Leave chat session room
    socket.on('leave-chat', (data) => {
      const { sessionId } = data;
      socket.leave(`chat:${sessionId}`);
      
      if (socket.currentChatSession === sessionId) {
        socket.currentChatSession = null;
      }

      // Clear typing indicator for this session
      this.stopTyping(socket, sessionId);

      socket.emit('chat-left', {
        sessionId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} left chat session ${sessionId}`);
    });

    // Handle new message event
    socket.on('message-sent', (data) => {
      const { sessionId, message } = data;
      
      // Broadcast to other users in the session (if any)
      socket.to(`chat:${sessionId}`).emit('new-message', {
        sessionId,
        message,
        timestamp: new Date()
      });
    });

    // Handle message status updates (delivered, read)
    socket.on('message-status', (data) => {
      const { sessionId, messageId, status } = data;
      
      socket.to(`chat:${sessionId}`).emit('message-status-update', {
        sessionId,
        messageId,
        status,
        timestamp: new Date()
      });
    });
  }

  /**
   * Setup typing indicator handlers
   * @param {Socket} socket - Socket instance
   */
  setupTypingHandlers(socket) {
    socket.on('typing-start', (data) => {
      const { sessionId } = data;
      this.startTyping(socket, sessionId);
    });

    socket.on('typing-stop', (data) => {
      const { sessionId } = data;
      this.stopTyping(socket, sessionId);
    });
  }

  /**
   * Setup notification handlers
   * @param {Socket} socket - Socket instance
   */
  setupNotificationHandlers(socket) {
    socket.on('subscribe-notifications', (data) => {
      const { types = ['chat', 'resume', 'jobs'] } = data;
      
      types.forEach(type => {
        socket.join(`notifications:${type}:${socket.userId}`);
      });

      socket.emit('notifications-subscribed', {
        types,
        timestamp: new Date()
      });
    });
  }

  /**
   * Start typing indicator
   * @param {Socket} socket - Socket instance
   * @param {string} sessionId - Chat session ID
   */
  startTyping(socket, sessionId) {
    if (!sessionId) return;

    // Clear existing timeout
    if (this.typingTimeouts.has(socket.id)) {
      clearTimeout(this.typingTimeouts.get(socket.id));
    }

    // Add user to typing users for this session
    if (!this.typingUsers.has(sessionId)) {
      this.typingUsers.set(sessionId, new Set());
    }
    this.typingUsers.get(sessionId).add(socket.userId);

    // Broadcast typing indicator
    socket.to(`chat:${sessionId}`).emit('user-typing', {
      sessionId,
      userId: socket.userId,
      userInfo: socket.userInfo,
      timestamp: new Date()
    });

    // Auto-stop typing after 5 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(socket, sessionId);
    }, 5000);

    this.typingTimeouts.set(socket.id, timeout);
  }

  /**
   * Stop typing indicator
   * @param {Socket} socket - Socket instance
   * @param {string} sessionId - Chat session ID
   */
  stopTyping(socket, sessionId) {
    if (!sessionId) return;

    // Clear timeout
    if (this.typingTimeouts.has(socket.id)) {
      clearTimeout(this.typingTimeouts.get(socket.id));
      this.typingTimeouts.delete(socket.id);
    }

    // Remove user from typing users
    if (this.typingUsers.has(sessionId)) {
      this.typingUsers.get(sessionId).delete(socket.userId);
      
      if (this.typingUsers.get(sessionId).size === 0) {
        this.typingUsers.delete(sessionId);
      }
    }

    // Broadcast stop typing
    socket.to(`chat:${sessionId}`).emit('user-stopped-typing', {
      sessionId,
      userId: socket.userId,
      timestamp: new Date()
    });
  }

  /**
   * Clear all typing indicators for a user
   * @param {Socket} socket - Socket instance
   */
  clearUserTyping(socket) {
    // Clear timeout
    if (this.typingTimeouts.has(socket.id)) {
      clearTimeout(this.typingTimeouts.get(socket.id));
      this.typingTimeouts.delete(socket.id);
    }

    // Remove from all typing sessions
    for (const [sessionId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(socket.userId)) {
        typingSet.delete(socket.userId);
        
        if (typingSet.size === 0) {
          this.typingUsers.delete(sessionId);
        }

        // Broadcast stop typing to all sessions
        socket.to(`chat:${sessionId}`).emit('user-stopped-typing', {
          sessionId,
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Broadcast user online/offline status
   * @param {string} userId - User ID
   * @param {string} status - 'online' or 'offline'
   */
  broadcastUserStatus(userId, status) {
    this.io.emit('user-status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to specific user
   * @param {string} userId - Target user ID
   * @param {Object} notification - Notification data
   */
  sendNotification(userId, notification) {
    const userConnection = this.connectedUsers.get(userId);
    
    if (userConnection) {
      this.io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date()
      });
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  sendNotificationToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendNotification(userId, notification);
    });
  }

  /**
   * Broadcast system announcement to all connected users
   * @param {Object} announcement - Announcement data
   */
  broadcastAnnouncement(announcement) {
    this.io.emit('system-announcement', {
      ...announcement,
      timestamp: new Date()
    });
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users info
   * @returns {Array} Array of connected user info
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  /**
   * Check if user is online
   * @param {string} userId - User ID
   * @returns {boolean} True if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get typing users for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Array} Array of typing user IDs
   */
  getTypingUsers(sessionId) {
    const typingSet = this.typingUsers.get(sessionId);
    return typingSet ? Array.from(typingSet) : [];
  }

  /**
   * Emit bot thinking indicator
   * @param {string} sessionId - Chat session ID
   * @param {string} botType - Type of bot responding
   */
  emitBotThinking(sessionId, botType) {
    this.io.to(`chat:${sessionId}`).emit('bot-thinking', {
      sessionId,
      botType,
      timestamp: new Date()
    });
  }

  /**
   * Stop bot thinking indicator
   * @param {string} sessionId - Chat session ID
   */
  stopBotThinking(sessionId) {
    this.io.to(`chat:${sessionId}`).emit('bot-stopped-thinking', {
      sessionId,
      timestamp: new Date()
    });
  }

  /**
   * Get Socket.IO server instance
   * @returns {Server} Socket.IO server instance
   */
  getIO() {
    return this.io;
  }
}

export default new SocketIOService();