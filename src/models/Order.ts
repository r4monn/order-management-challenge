// src/models/Order.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IOrder, IService } from '../types/order.js';

export interface IOrderDocument extends IOrder, Document {}

const ServiceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'DONE'],
    default: 'PENDING',
  },
});

const OrderSchema = new Schema<IOrderDocument>({
  lab: {
    type: String,
    required: true,
    trim: true,
  },
  patient: {
    type: String,
    required: true,
    trim: true,
  },
  customer: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    enum: ['CREATED', 'ANALYSIS', 'COMPLETED'],
    default: 'CREATED',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DELETED'],
    default: 'ACTIVE',
  },
  services: {
    type: [ServiceSchema],
    required: true,
    validate: {
      validator: (services: IService[]) => services.length > 0,
      message: 'At least one service is required',
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const Order = mongoose.model<IOrderDocument>('Order', OrderSchema);