import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import supportService from '../services/supportService';
import logger from '../config/logger';

export const getMySupports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supports = await supportService.getSupportsByUser(userId);
    res.json({ supports });
  } catch (error) {
    logger.error('Error in getMySupports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCampaignSupports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Verify user owns the campaign before showing supports
    const supports = await supportService.getSupportsByCampaign(campaignId);
    res.json({ supports });
  } catch (error) {
    logger.error('Error in getCampaignSupports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSupport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { campaignId, rewardLevelId, amount, paymentMethod } = req.body;

    if (!campaignId || !rewardLevelId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const support = await supportService.createSupport({
      supporterId: userId,
      campaignId,
      rewardLevelId,
      amount,
      paymentMethod,
    });

    res.status(201).json(support);
  } catch (error: any) {
    logger.error('Error in createSupport:', error);
    if (error.message === 'Campaign not found' || error.message === 'Reward level not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelSupport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const support = await supportService.cancelSupport(id, userId);

    if (!support) {
      return res.status(404).json({ error: 'Support not found' });
    }

    res.json(support);
  } catch (error) {
    logger.error('Error in cancelSupport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const pauseSupport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const support = await supportService.pauseSupport(id, userId);

    if (!support) {
      return res.status(404).json({ error: 'Support not found' });
    }

    res.json(support);
  } catch (error) {
    logger.error('Error in pauseSupport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resumeSupport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const support = await supportService.resumeSupport(id, userId);

    if (!support) {
      return res.status(404).json({ error: 'Support not found or not paused' });
    }

    res.json(support);
  } catch (error) {
    logger.error('Error in resumeSupport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSupportDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const support = await supportService.getSupportById(id, userId);

    if (!support) {
      return res.status(404).json({ error: 'Support not found' });
    }

    res.json(support);
  } catch (error) {
    logger.error('Error in getSupportDetails:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
