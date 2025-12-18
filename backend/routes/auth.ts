import express from 'express';
import { register, login, getProfile, updatePushToken } from '../controllers/authController.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.post('/update-push-token', authMiddleware, updatePushToken);

export default router;