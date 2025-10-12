import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  roles: Array<'admin' | 'user'>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roles: {
      type: [String],
      enum: ['admin', 'user'],
      default: ['user'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
userSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', userSchema);
