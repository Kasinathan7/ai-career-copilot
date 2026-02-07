import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken
} from '../controllers/authController.js';
import { verifyToken as authMiddleware } from '../middleware/index.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(authMiddleware); // Apply authentication to all routes below

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/verify', verifyToken);

export default router;