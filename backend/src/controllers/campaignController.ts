import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import campaignService from '../services/campaignService';
import logger from '../config/logger';

export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, slug, description, goal, currency, category, imageUrl, videoUrl, rewardLevels, endDate } = req.body;
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!title || !slug || !description || !goal || !category || !imageUrl || !rewardLevels) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const campaign = await campaignService.createCampaign({
      makerId,
      title,
      slug,
      description,
      goal,
      currency,
      category,
      imageUrl,
      videoUrl,
      rewardLevels,
      endDate,
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    logger.error('Error in createCampaign:', error);
    if (error.message === 'Slug already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    logger.error('Error in getCampaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCampaignBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const campaign = await campaignService.getCampaignBySlug(slug);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    logger.error('Error in getCampaignBySlug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyCampaigns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const campaigns = await campaignService.getCampaignsByMaker(makerId);
    res.json(campaigns);
  } catch (error) {
    logger.error('Error in getMyCampaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const { status, category, limit, skip } = req.query;

    const filters = {
      status: status as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    };

    const result = await campaignService.getAllCampaigns(filters);
    res.json(result);
  } catch (error) {
    logger.error('Error in getAllCampaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const campaign = await campaignService.updateCampaign(id, makerId, req.body);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized' });
    }

    res.json(campaign);
  } catch (error: any) {
    logger.error('Error in updateCampaign:', error);
    if (error.message === 'Slug already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await campaignService.deleteCampaign(id, makerId);
    res.status(204).send();
  } catch (error: any) {
    logger.error('Error in deleteCampaign:', error);
    if (error.message === 'Campaign not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchCampaigns = async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const campaigns = await campaignService.searchCampaigns(
      q as string,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(campaigns);
  } catch (error) {
    logger.error('Error in searchCampaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
