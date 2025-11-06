import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId;
  integrationId: mongoose.Types.ObjectId;
  supporterEmail: string;
  supporterId: string; // ID do apoiador na APOIA.se
  telegramUserId?: string;
  telegramUsername?: string;
  status: 'pending_verification' | 'active' | 'payment_overdue' | 'removed';
  joinedAt?: Date;
  verifiedAt?: Date;
  lastPaymentCheck?: Date;
  removalWarningAt?: Date;
  removedAt?: Date;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      required: true,
    },
    supporterEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    supporterId: {
      type: String,
      required: true,
      index: true, // Kept: not in compound indexes
    },
    telegramUserId: {
      type: String,
      sparse: true,
    },
    telegramUsername: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'payment_overdue', 'removed'],
      default: 'pending_verification',
    },
    joinedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    lastPaymentCheck: {
      type: Date,
    },
    removalWarningAt: {
      type: Date,
    },
    removedAt: {
      type: Date,
    },
    inviteToken: {
      type: String,
    },
    inviteExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para otimizar queries
MemberSchema.index({ integrationId: 1, status: 1 });
MemberSchema.index({ supporterEmail: 1, integrationId: 1 });
MemberSchema.index({ telegramUserId: 1, integrationId: 1 });
MemberSchema.index({ inviteToken: 1 }, { sparse: true });

export default mongoose.model<IMember>('Member', MemberSchema);
