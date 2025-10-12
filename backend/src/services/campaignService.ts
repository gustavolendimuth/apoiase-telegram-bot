import Campaign, { ICampaign } from '../models/Campaign';
import { Types } from 'mongoose';
import logger from '../config/logger';

interface CreateCampaignDTO {
  makerId: string;
  title: string;
  slug: string;
  description: string;
  goal: number;
  currency?: string;
  category: string;
  imageUrl: string;
  videoUrl?: string;
  rewardLevels: Array<{
    id: string;
    title: string;
    amount: number;
    description: string;
    benefits: string[];
  }>;
  endDate?: Date;
}

interface UpdateCampaignDTO {
  title?: string;
  slug?: string;
  description?: string;
  goal?: number;
  imageUrl?: string;
  videoUrl?: string;
  rewardLevels?: Array<{
    id: string;
    title: string;
    amount: number;
    description: string;
    benefits: string[];
  }>;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  endDate?: Date;
}

class CampaignService {
  async createCampaign(data: CreateCampaignDTO): Promise<ICampaign> {
    try {
      // Check if slug is unique
      const existingCampaign = await Campaign.findOne({ slug: data.slug });
      if (existingCampaign) {
        throw new Error('Slug already exists');
      }

      const campaign = new Campaign({
        makerId: new Types.ObjectId(data.makerId),
        title: data.title,
        slug: data.slug,
        description: data.description,
        goal: data.goal,
        currency: data.currency || 'BRL',
        category: data.category,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        rewardLevels: data.rewardLevels,
        endDate: data.endDate,
        status: 'draft',
      });

      await campaign.save();
      logger.info(`Campaign created: ${campaign._id}`);
      return campaign;
    } catch (error) {
      logger.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaignById(id: string): Promise<ICampaign | null> {
    try {
      const campaign = await Campaign.findById(id).populate('makerId', 'name email');
      return campaign;
    } catch (error) {
      logger.error(`Error getting campaign ${id}:`, error);
      throw error;
    }
  }

  async getCampaignBySlug(slug: string): Promise<ICampaign | null> {
    try {
      const campaign = await Campaign.findOne({ slug }).populate('makerId', 'name email');
      return campaign;
    } catch (error) {
      logger.error(`Error getting campaign by slug ${slug}:`, error);
      throw error;
    }
  }

  async getCampaignsByMaker(makerId: string): Promise<ICampaign[]> {
    try {
      const campaigns = await Campaign.find({ makerId: new Types.ObjectId(makerId) }).sort({
        createdAt: -1,
      });
      return campaigns;
    } catch (error) {
      logger.error(`Error getting campaigns for maker ${makerId}:`, error);
      throw error;
    }
  }

  async getAllCampaigns(filters?: {
    status?: string;
    category?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ campaigns: ICampaign[]; total: number }> {
    try {
      const query: any = {};

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.category) {
        query.category = filters.category;
      }

      const total = await Campaign.countDocuments(query);
      const campaigns = await Campaign.find(query)
        .populate('makerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(filters?.limit || 20)
        .skip(filters?.skip || 0);

      return { campaigns, total };
    } catch (error) {
      logger.error('Error getting all campaigns:', error);
      throw error;
    }
  }

  async updateCampaign(id: string, makerId: string, data: UpdateCampaignDTO): Promise<ICampaign | null> {
    try {
      const campaign = await Campaign.findOne({
        _id: id,
        makerId: new Types.ObjectId(makerId),
      });

      if (!campaign) {
        throw new Error('Campaign not found or unauthorized');
      }

      // Check if slug is unique (if being updated)
      if (data.slug && data.slug !== campaign.slug) {
        const existingCampaign = await Campaign.findOne({ slug: data.slug });
        if (existingCampaign) {
          throw new Error('Slug already exists');
        }
      }

      Object.assign(campaign, data);
      await campaign.save();

      logger.info(`Campaign updated: ${campaign._id}`);
      return campaign;
    } catch (error) {
      logger.error(`Error updating campaign ${id}:`, error);
      throw error;
    }
  }

  async deleteCampaign(id: string, makerId: string): Promise<boolean> {
    try {
      const result = await Campaign.deleteOne({
        _id: id,
        makerId: new Types.ObjectId(makerId),
      });

      if (result.deletedCount === 0) {
        throw new Error('Campaign not found or unauthorized');
      }

      logger.info(`Campaign deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting campaign ${id}:`, error);
      throw error;
    }
  }

  async updateCampaignStats(id: string, raised: number, supporters: number): Promise<ICampaign | null> {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        id,
        { raised, supporters },
        { new: true }
      );

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      logger.info(`Campaign stats updated: ${id}`);
      return campaign;
    } catch (error) {
      logger.error(`Error updating campaign stats ${id}:`, error);
      throw error;
    }
  }

  async searchCampaigns(query: string, limit: number = 10): Promise<ICampaign[]> {
    try {
      const campaigns = await Campaign.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
        status: 'active',
      })
        .populate('makerId', 'name email')
        .limit(limit);

      return campaigns;
    } catch (error) {
      logger.error('Error searching campaigns:', error);
      throw error;
    }
  }
}

export default new CampaignService();
