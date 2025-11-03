import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIntegration extends Document {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId; // Reference to Campaign
  campaignSlug?: string; // APOIA.se campaign slug (optional, for external campaigns)
  telegramGroupId: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  telegramGroupTitle: string;
  apiKey: string;
  // Credenciais da campanha no APOIA.se (criptografadas)
  apoiaseApiKey?: string;
  apoiaseBearerToken?: string;
  rewardLevels: string[]; // IDs dos níveis de recompensa que dão acesso
  isActive: boolean;
  createdBy: Types.ObjectId; // Reference to User (maker)
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    campaignSlug: {
      type: String,
      required: false,
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
    apoiaseApiKey: {
      type: String,
      required: false,
      select: false, // Não retornar por padrão (segurança)
    },
    apoiaseBearerToken: {
      type: String,
      required: false,
      select: false, // Não retornar por padrão (segurança)
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
      type: Schema.Types.ObjectId,
      ref: 'User',
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
