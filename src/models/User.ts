import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types/user.js';

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>({
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
    minlength: 8,
  },
}, {
  timestamps: true,
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);