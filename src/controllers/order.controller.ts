import { Response } from 'express';
import { OrderService } from '../services/order.service.js';
import { PaginationParams } from '../types/apiResponse.js';
import { AuthRequest } from '../types/auth.js';

const orderService = new OrderService();

export const OrderController = {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { lab, patient, customer, services } = req.body;
      const userId = req.user!.userId;

      if (!lab || !patient || !customer) {
        res.status(400).json({
          error: 'Lab, patient, and customer are required'
        });
        return;
      }

      const order = await orderService.createOrder({
        lab,
        patient,
        customer,
        services: services || [],
      }, userId);

      res.status(201).json({
        message: 'Order created successfully',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 10, state } = req.query;

      const params: PaginationParams = {
        page: Number(page),
        limit: Number(limit),
        state: state as any,
      };

      const result = await orderService.getOrders(params, userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};