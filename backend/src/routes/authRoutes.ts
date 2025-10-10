import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rotas públicas (com rate limiting)
router.post('/login', authLimiter, authController.login);
router.post('/validate-apoiase', authLimiter, authController.validateApoiase);

// Rotas protegidas
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);

export default router;
