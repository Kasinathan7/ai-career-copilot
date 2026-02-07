import express from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  updatePreferences,
  getSettings,
  updateSettings,
  getUsageStats,
  deleteAccount,
  exportData,
  getActivityFeed
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/index.js';

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Dashboard and profile routes
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Preferences and settings routes
router.put('/preferences', updatePreferences);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Usage and analytics routes
router.get('/usage', getUsageStats);
router.get('/activity', getActivityFeed);

// Data management routes
router.get('/export', exportData);
router.delete('/account', deleteAccount);

export default router;