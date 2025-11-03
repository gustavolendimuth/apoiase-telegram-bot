import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  makerId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  goal: number;
  raised: number;
  currency: string;
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
  supporters: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    makerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    goal: {
      type: Number,
      required: true,
      min: 0,
    },
    raised: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BRL',
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'art',
        'music',
        'technology',
        'education',
        'social',
        'games',
        'podcasts',
        'videos',
        'other',
      ],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
    },
    rewardLevels: [
      {
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        description: {
          type: String,
          required: true,
        },
        benefits: [String],
      },
    ],
    supporters: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// slug já tem índice único através de unique: true, não precisa de index adicional
campaignSchema.index({ makerId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });

export default mongoose.model<ICampaign>('Campaign', campaignSchema);
