import { Router } from 'express';
import webhookController from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// Webhooks com rate limiting específico
router.post('/apoiase', webhookLimiter, webhookController.apoiaseWebhook);
router.post('/telegram', webhookLimiter, webhookController.telegramWebhook);

export default router;
