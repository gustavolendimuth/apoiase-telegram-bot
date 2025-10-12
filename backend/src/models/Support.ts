import mongoose, { Document, Schema } from 'mongoose';

export interface ISupport extends Document {
  supporterId: mongoose.Types.ObjectId; // User who is supporting
  campaignId: mongoose.Types.ObjectId; // Campaign being supported
  rewardLevelId: string; // ID of the reward level chosen
  amount: number; // Monthly amount being paid
  status: 'active' | 'cancelled' | 'paused' | 'payment_failed';
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  startDate: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportSchema = new Schema<ISupport>(
  {
    supporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    rewardLevelId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'paused', 'payment_failed'],
      default: 'active',
    },
    paymentMethod: {
      type: String,
    },
    lastPaymentDate: {
      type: Date,
    },
    nextPaymentDate: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supportSchema.index({ supporterId: 1 });
supportSchema.index({ campaignId: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ supporterId: 1, status: 1 });

export default mongoose.model<ISupport>('Support', supportSchema);
