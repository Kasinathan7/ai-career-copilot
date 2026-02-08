import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      subscription: decoded.subscription
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    } else {
      console.error('Token verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Optional authentication - sets user if token is valid, but doesn't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        subscription: decoded.subscription
      };
    }

    next();
  } catch (error) {
    // Silently continue without authentication on token errors
    next();
  }
};

// Check subscription plan
export const checkSubscription = (requiredPlans = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (requiredPlans.length === 0) {
      return next(); // No plan requirement
    }

    const userPlan = req.user.subscription;
    
    if (!requiredPlans.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: `This feature requires a ${requiredPlans.join(' or ')} subscription`,
        requiredPlans,
        userPlan
      });
    }

    next();
  };
};

// Rate limiting based on subscription
export const subscriptionRateLimit = (limits = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(); // Skip if no user
      }

      const userId = req.user.userId;
      const userPlan = req.user.subscription;
      
      // Get user's current usage
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyUsage = user.usage.monthly.find(
        m => m.month === currentMonth && m.year === currentYear
      );

      if (!monthlyUsage) {
        return next(); // No usage record yet, allow
      }

      // Check limits based on plan
      const planLimits = limits[userPlan];
      if (!planLimits) {
        return next(); // No limits defined for this plan
      }

      // Check specific endpoint limits
      const endpoint = req.route?.path || req.path;
      let limitExceeded = false;
      let limitType = '';

      if (endpoint.includes('/chat') && planLimits.chats !== -1) {
        if (monthlyUsage.chatsCreated >= planLimits.chats) {
          limitExceeded = true;
          limitType = 'chat sessions';
        }
      } else if (endpoint.includes('/resume') && planLimits.resumes !== -1) {
        if (monthlyUsage.resumesCreated >= planLimits.resumes) {
          limitExceeded = true;
          limitType = 'resumes';
        }
      } else if (endpoint.includes('/ats') && planLimits.atsAnalyses !== -1) {
        if (monthlyUsage.atsAnalyses >= planLimits.atsAnalyses) {
          limitExceeded = true;
          limitType = 'ATS analyses';
        }
      }

      if (limitExceeded) {
        return res.status(429).json({
          success: false,
          message: `Monthly ${limitType} limit reached for ${userPlan} plan`,
          usage: monthlyUsage,
          limits: planLimits
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error to avoid blocking service
    }
  };
};

// Validate request body
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value; // Use validated and transformed data
    next();
  };
};

// CORS middleware
export const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
  'http://localhost:5173',
  'https://ai-career-copilot-frontend.onrender.com'
];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

// Security headers
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  
  // Log response time when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      message: 'Validation error',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    };
    return res.status(400).json(error);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} already exists`
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired'
    };
    return res.status(401).json(error);
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File too large'
    };
    return res.status(400).json(error);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      success: false,
      message: 'Too many files'
    };
    return res.status(400).json(error);
  }

  // Custom API errors
  if (err.statusCode) {
    error = {
      success: false,
      message: err.message || 'API error'
    };
    return res.status(err.statusCode).json(error);
  }

  // Default server error
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err.message;
  }

  res.status(500).json(error);
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
};