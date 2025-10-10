import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIntegration extends Document {
  _id: Types.ObjectId;
  campaignId: string;
  telegramGroupId: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  telegramGroupTitle: string;
  apiKey: string;
  rewardLevels: string[]; // IDs dos níveis de recompensa que dão acesso
  isActive: boolean;
  createdBy: string; // ID do fazedor
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    telegramGroupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    telegramGroupType: {
      type: String,
      enum: ['group', 'supergroup', 'channel'],
      required: true,
    },
    telegramGroupTitle: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    rewardLevels: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para buscar integrações por campanha
IntegrationSchema.index({ campaignId: 1, isActive: 1 });

export default mongoose.model<IIntegration>('Integration', IntegrationSchema);
