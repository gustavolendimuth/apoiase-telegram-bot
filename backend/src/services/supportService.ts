import Support, { ISupport } from '../models/Support';
import Campaign from '../models/Campaign';
import mongoose from 'mongoose';
import logger from '../config/logger';

class SupportService {
  /**
   * Get all supports for a specific user (supporter)
   */
  async getSupportsByUser(userId: string): Promise<ISupport[]> {
    try {
      const supports = await Support.find({ supporterId: userId })
        .populate('campaignId', 'title slug imageUrl status category goal raised supporters currency')
        .sort({ createdAt: -1 });

      return supports;
    } catch (error) {
      logger.error('Error getting supports by user:', error);
      throw error;
    }
  }

  /**
   * Get all supports for a specific campaign
   */
  async getSupportsByCampaign(campaignId: string): Promise<ISupport[]> {
    try {
      const supports = await Support.find({ campaignId })
        .populate('supporterId', 'name email')
        .sort({ createdAt: -1 });

      return supports;
    } catch (error) {
      logger.error('Error getting supports by campaign:', error);
      throw error;
    }
  }

  /**
   * Create a new support
   */
  async createSupport(data: {
    supporterId: string;
    campaignId: string;
    rewardLevelId: string;
    amount: number;
    paymentMethod?: string;
  }): Promise<ISupport> {
    try {
      // Verify campaign exists
      const campaign = await Campaign.findById(data.campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Verify reward level exists in campaign
      const rewardLevel = campaign.rewardLevels.find(
        (level) => level.id === data.rewardLevelId
      );
      if (!rewardLevel) {
        throw new Error('Reward level not found');
      }

      // Create support
      const support = new Support({
        supporterId: data.supporterId,
        campaignId: data.campaignId,
        rewardLevelId: data.rewardLevelId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'active',
        startDate: new Date(),
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      await support.save();

      // Update campaign statistics
      await Campaign.findByIdAndUpdate(data.campaignId, {
        $inc: {
          supporters: 1,
          raised: data.amount,
        },
      });

      logger.info(`Support created: ${support._id} for campaign ${data.campaignId}`);
      return support;
    } catch (error) {
      logger.error('Error creating support:', error);
      throw error;
    }
  }

  /**
   * Cancel a support
   */
  async cancelSupport(supportId: string, userId: string): Promise<ISupport | null> {
    try {
      const support = await Support.findOne({
        _id: supportId,
        supporterId: userId,
      });

      if (!support) {
        return null;
      }

      support.status = 'cancelled';
      support.cancelledAt = new Date();
      await support.save();

      // Update campaign statistics
      await Campaign.findByIdAndUpdate(support.campaignId, {
        $inc: {
          supporters: -1,
        },
      });

      logger.info(`Support cancelled: ${supportId}`);
      return support;
    } catch (error) {
      logger.error('Error cancelling support:', error);
      throw error;
    }
  }

  /**
   * Pause a support
   */
  async pauseSupport(supportId: string, userId: string): Promise<ISupport | null> {
    try {
      const support = await Support.findOne({
        _id: supportId,
        supporterId: userId,
      });

      if (!support) {
        return null;
      }

      support.status = 'paused';
      await support.save();

      logger.info(`Support paused: ${supportId}`);
      return support;
    } catch (error) {
      logger.error('Error pausing support:', error);
      throw error;
    }
  }

  /**
   * Resume a paused support
   */
  async resumeSupport(supportId: string, userId: string): Promise<ISupport | null> {
    try {
      const support = await Support.findOne({
        _id: supportId,
        supporterId: userId,
        status: 'paused',
      });

      if (!support) {
        return null;
      }

      support.status = 'active';
      await support.save();

      logger.info(`Support resumed: ${supportId}`);
      return support;
    } catch (error) {
      logger.error('Error resuming support:', error);
      throw error;
    }
  }

  /**
   * Get support details
   */
  async getSupportById(supportId: string, userId: string): Promise<ISupport | null> {
    try {
      const support = await Support.findOne({
        _id: supportId,
        supporterId: userId,
      })
        .populate('campaignId', 'title slug imageUrl status category')
        .populate('supporterId', 'name email');

      return support;
    } catch (error) {
      logger.error('Error getting support by ID:', error);
      throw error;
    }
  }
}

export default new SupportService();
