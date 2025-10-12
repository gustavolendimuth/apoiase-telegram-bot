import { Router } from 'express';
import * as campaignController from '../controllers/campaignController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (specific routes before generic ones)
router.get('/search', campaignController.searchCampaigns);
router.get('/all', campaignController.getAllCampaigns);
router.get('/slug/:slug', campaignController.getCampaignBySlug);

// Protected routes (require authentication)
// IMPORTANT: Specific routes must come BEFORE generic routes with params
router.post('/', authenticateToken, campaignController.createCampaign);
router.get('/my/campaigns', authenticateToken, campaignController.getMyCampaigns);
router.put('/:id', authenticateToken, campaignController.updateCampaign);
router.delete('/:id', authenticateToken, campaignController.deleteCampaign);

// Generic route with :id param (must be last)
router.get('/:id', campaignController.getCampaign);

export default router;
