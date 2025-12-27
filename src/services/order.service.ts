import { Order } from '../models/Order.js';
import {
  PaginationParams,
  PaginatedResponse
} from '../types/apiResponse.js';
import { IOrder } from '../types/order.js';

export class OrderService {
  private validateServices(services: any[]): void {
    if (!services || services.length === 0) {
      throw new Error('Order must have at least one service');
    }

    const hasInvalidService = services.some(service =>
      !service.name ||
      service.value === undefined ||
      service.value === null
    );

    if (hasInvalidService) {
      throw new Error('All services must have name and value');
    }
  }

  async createOrder(orderData: Omit<IOrder, 'state' | 'status'>, userId: string) {
    this.validateServices(orderData.services);

    const order = await Order.create({
      ...orderData,
      state: 'CREATED',
      status: 'ACTIVE',
      createdBy: userId,
    });

    return order;
  }

  async getOrders(params: PaginationParams, userId: string): Promise<PaginatedResponse<IOrder>> {
    const { page = 1, limit = 10, state } = params;

    const query: any = { createdBy: userId, status: 'ACTIVE' };
    if (state) {
      query.state = state;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    return {
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}