import mongoose, { Schema, Document } from 'mongoose';

export interface ITelegramAuthToken extends Document {
  token: string;
  campaignId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rewardLevels: string[];
  status: 'pending' | 'used' | 'expired';
  expiresAt: Date;
  usedAt?: Date;
  integrationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TelegramAuthTokenSchema: Schema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rewardLevels: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'used', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      // index será criado abaixo via schema.index() no índice composto
    },
    usedAt: {
      type: Date,
    },
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
    },
  },
  {
    timestamps: true,
  }
);

// Index composto para buscar tokens válidos
TelegramAuthTokenSchema.index({ token: 1, status: 1, expiresAt: 1 });

// Método para verificar se token está válido
TelegramAuthTokenSchema.methods.isValid = function (): boolean {
  return this.status === 'pending' && this.expiresAt > new Date();
};

export default mongoose.model<ITelegramAuthToken>(
  'TelegramAuthToken',
  TelegramAuthTokenSchema
);
