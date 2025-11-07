import mongoose, { Schema, Document } from 'mongoose';

/**
 * Model para grupos do Telegram descobertos pelo bot
 * Usado para persistir grupos entre restarts do servidor
 */
export interface IDiscoveredGroup extends Document {
  groupId: string; // ID do grupo no Telegram
  title: string;
  type: 'group' | 'supergroup' | 'channel';
  canPostMessages: boolean;
  canManageChat: boolean;
  canInviteUsers: boolean;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiscoveredGroupSchema = new Schema<IDiscoveredGroup>(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['group', 'supergroup', 'channel'],
      required: true,
    },
    canPostMessages: {
      type: Boolean,
      required: true,
      default: false,
    },
    canManageChat: {
      type: Boolean,
      required: true,
      default: false,
    },
    canInviteUsers: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastChecked: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDiscoveredGroup>('DiscoveredGroup', DiscoveredGroupSchema);
