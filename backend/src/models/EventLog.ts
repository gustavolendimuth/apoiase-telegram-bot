import mongoose, { Schema, Document } from 'mongoose';

export interface IEventLog extends Document {
  eventType: 'member_joined' | 'member_verified' | 'member_removed' | 'payment_overdue' | 'warning_sent' | 'integration_created' | 'integration_updated' | 'integration_deleted' | 'error';
  integrationId?: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  userId?: string; // Telegram user ID
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
}

const EventLogSchema = new Schema<IEventLog>(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    userId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Índice para buscar eventos recentes
EventLogSchema.index({ createdAt: -1 });
EventLogSchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.model<IEventLog>('EventLog', EventLogSchema);
