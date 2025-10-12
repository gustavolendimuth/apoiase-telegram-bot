import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All support routes require authentication
router.use(authenticateToken);

// Get all supports for the authenticated user
router.get('/my/supports', supportController.getMySupports);

// Get support details
router.get('/:id', supportController.getSupportDetails);

// Create a new support
router.post('/', supportController.createSupport);

// Cancel a support
router.post('/:id/cancel', supportController.cancelSupport);

// Pause a support
router.post('/:id/pause', supportController.pauseSupport);

// Resume a paused support
router.post('/:id/resume', supportController.resumeSupport);

// Get all supports for a campaign (for campaign owners)
router.get('/campaign/:campaignId', supportController.getCampaignSupports);

export default router;
