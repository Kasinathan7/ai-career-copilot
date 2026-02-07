import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      subscription: user.subscription 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Register new user
export const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      preferences = {} 
    } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        firstName,
        lastName,
        preferences: {
          jobAlerts: preferences.jobAlerts || false,
          emailNotifications: preferences.emailNotifications || true,
          profileVisibility: preferences.profileVisibility || 'private',
          preferredIndustries: preferences.preferredIndustries || [],
          preferredJobTypes: preferences.preferredJobTypes || ['full-time'],
          salaryRange: preferences.salaryRange || { min: 0, max: 999999 },
          remoteWork: preferences.remoteWork || 'open',
          ...preferences
        }
      },
      subscription: {
        plan: 'free',
        startDate: new Date(),
        isActive: true
      },
      settings: {
        language: 'en',
        timezone: 'UTC',
        theme: 'light'
      }
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Store refresh token
    newUser.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      rememberMe
    });

    // Clean old refresh tokens (keep only last 5)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and validate refresh token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenIndex = user.refreshTokens.findIndex(
      tokenObj => tokenObj.token === refreshToken
    );

    if (tokenIndex === -1) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Replace old refresh token with new one
    user.refreshTokens[tokenIndex] = {
      token: newRefreshToken,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;

    if (userId) {
      const user = await User.findById(userId);
      if (user && refreshToken) {
        // Remove specific refresh token
        user.refreshTokens = user.refreshTokens.filter(
          tokenObj => tokenObj.token !== refreshToken
        );
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout from all devices
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-password -refreshTokens')
      .populate('resumes', 'title createdAt updatedAt version');

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
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.refreshTokens;
    delete updates.subscription;
    delete updates.usage;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
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
      message: 'Internal server error'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear all refresh tokens
    user.password = hashedNewPassword;
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify token (for protected routes)
export const verifyToken = async (req, res) => {
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
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};