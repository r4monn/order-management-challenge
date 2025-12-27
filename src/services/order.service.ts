import { Order } from '../models/Order.js';
import {
  PaginationParams,
  PaginatedResponse
} from '../types/apiResponse.js';
import { IOrder, OrderState } from '../types/order.js';

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

    const totalValue = services.reduce((sum, service) => sum + service.value, 0);
    if (totalValue <= 0) {
      throw new Error('Order total value must be greater than zero');
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

  async advanceOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      createdBy: userId,
      status: 'ACTIVE',
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderState = order.get('state') as OrderState;

    if (!orderState) {
      throw new Error('Order state is not defined');
    }

    const stateTransitions: Record<OrderState, OrderState[]> = {
      'CREATED': ['ANALYSIS'],
      'ANALYSIS': ['COMPLETED'],
      'COMPLETED': []
    };

    const possibleTransitions = stateTransitions[orderState];

    if (possibleTransitions.length === 0) {
      throw new Error(`Order in state ${orderState} cannot be advanced further`);
    }

    const nextState = possibleTransitions[0];
    order.set('state', nextState);

    if (nextState === 'COMPLETED') {
      order.services = order.services.map(service => ({
        ...service.toObject(),
        status: 'DONE' as const
      }));
    }

    await order.save();
    return order.toObject() as IOrder;
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