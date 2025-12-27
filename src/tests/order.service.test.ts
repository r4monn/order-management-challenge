import { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { OrderService } from '../services/order.service.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';

describe('OrderService - Business Logic', () => {
    let orderService: OrderService;
    let userId: string;
    let testUser: any;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI as string);
    }, 15000);

    beforeEach(async () => {
        orderService = new OrderService();

        // Criar usuário de teste
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser = await User.create({
            email: `test${Date.now()}@example.com`,
            password: hashedPassword,
        });
        userId = testUser._id.toString();
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Order Creation Validation', () => {
        it('should reject order with no services', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [],
            };

            await expect(orderService.createOrder(orderData as any, userId))
                .rejects
                .toThrow('Order must have at least one service');
        }, 10000);

        it('should reject order with invalid services (missing name)', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: '', value: 100 },
                    { name: 'Service 2', value: 50 },
                ],
            };

            await expect(orderService.createOrder(orderData as any, userId))
                .rejects
                .toThrow('All services must have name and value');
        });

        it('should reject order with invalid services (missing value)', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: 'Service 1', value: null as any },
                    { name: 'Service 2', value: 50 },
                ],
            };

            await expect(orderService.createOrder(orderData as any, userId))
                .rejects
                .toThrow('All services must have name and value');
        });

        it('should reject order with zero total value', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: 'Service 1', value: 0 },
                    { name: 'Service 2', value: 0 },
                ],
            };

            await expect(orderService.createOrder(orderData as any, userId))
                .rejects
                .toThrow('Order total value must be greater than zero');
        });

        it('should reject order with negative total value', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: 'Service 1', value: -100 },
                    { name: 'Service 2', value: 50 },
                ],
            };

            await expect(orderService.createOrder(orderData as any, userId))
                .rejects
                .toThrow('Order total value must be greater than zero');
        });

        it('should create order with valid services', async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: 'Blood Test', value: 150.50 },
                    { name: 'Urine Test', value: 75.25 },
                ],
            };

            const order = await orderService.createOrder(orderData as any, userId);

            expect(order).toBeDefined();
            expect(order.state).toBe('CREATED');
            expect(order.status).toBe('ACTIVE');
            expect(order.createdBy?.toString()).toBe(userId);
            expect(order.services).toHaveLength(2);
        });
    });

    describe('Order State Transitions', () => {
        let orderId: string;

        beforeEach(async () => {
            const orderData = {
                lab: 'Lab A',
                patient: 'Mário Augusto',
                customer: 'Hospital X',
                services: [
                    { name: 'Test', value: 100 },
                ],
            };

            const order = await orderService.createOrder(orderData as any, userId);
            orderId = order._id.toString();
        });

        it('should advance from CREATED to ANALYSIS', async () => {
            const order = await orderService.advanceOrder(orderId, userId);
            expect(order.state).toBe('ANALYSIS');
        });

        it('should advance from ANALYSIS to COMPLETED', async () => {
            // Primeiro para ANALYSIS
            await orderService.advanceOrder(orderId, userId);

            // Depois para COMPLETED
            const order = await orderService.advanceOrder(orderId, userId);
            expect(order.state).toBe('COMPLETED');
        });

        it('should mark all services as DONE when completing order', async () => {
            // Avançar para ANALYSIS primeiro
            await orderService.advanceOrder(orderId, userId);

            // Agora para COMPLETED
            const order = await orderService.advanceOrder(orderId, userId);
            expect(order.state).toBe('COMPLETED');

            // Verificar se todos os serviços estão como DONE
            const updatedOrder = await Order.findById(orderId);
            expect(updatedOrder?.services.every(s => s.status === 'DONE')).toBe(true);
        });

        it('should reject advancing beyond COMPLETED', async () => {
            // Avançar até COMPLETED
            await orderService.advanceOrder(orderId, userId);
            await orderService.advanceOrder(orderId, userId);

            // Tentar avançar além
            await expect(orderService.advanceOrder(orderId, userId))
                .rejects
                .toThrow('Order in state COMPLETED cannot be advanced further');
        });

        it('should reject order not found', async () => {
            const nonExistentOrderId = new mongoose.Types.ObjectId().toString();
            await expect(orderService.advanceOrder(nonExistentOrderId, userId))
                .rejects
                .toThrow('Order not found');
        });

        it('should reject order not belonging to user', async () => {
            // Criar outro usuário
            const hashedPassword = await bcrypt.hash('password123', 10);
            const anotherUser = await User.create({
                email: `another${Date.now()}@example.com`,
                password: hashedPassword,
            });
            const anotherUserId = anotherUser._id.toString();

            await expect(orderService.advanceOrder(orderId, anotherUserId))
                .rejects
                .toThrow('Order not found');
        });
    });

    describe('Order Pagination', () => {
        beforeEach(async () => {
            // Criar múltiplos pedidos
            for (let i = 0; i < 15; i++) {
                await orderService.createOrder({
                    lab: `Lab ${i}`,
                    patient: `Patient ${i}`,
                    customer: `Customer ${i}`,
                    services: [{ name: `Service ${i}`, value: 100 }],
                } as any, userId);
            }
        });

        it('should paginate orders correctly', async () => {
            const result = await orderService.getOrders({ page: 1, limit: 10 }, userId);

            expect(result.data).toHaveLength(10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.total).toBe(15);
            expect(result.totalPages).toBe(2);
        });

        it('should paginate to second page correctly', async () => {
            const result = await orderService.getOrders({ page: 2, limit: 10 }, userId);

            expect(result.data).toHaveLength(5);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.total).toBe(15);
            expect(result.totalPages).toBe(2);
        });

        it('should filter by state', async () => {
            // Avançar alguns pedidos para ANALYSIS
            const orders = await Order.find({ createdBy: userId });

            // Verificar se há pedidos suficientes
            expect(orders.length).toBeGreaterThanOrEqual(2);

            await orderService.advanceOrder(orders[0]!._id.toString(), userId);
            await orderService.advanceOrder(orders[1]!._id.toString(), userId);

            const result = await orderService.getOrders({
                page: 1,
                limit: 10,
                state: 'ANALYSIS'
            }, userId);

            expect(result.data.length).toBeGreaterThan(0);
            expect(result.data.every(o => o.state === 'ANALYSIS')).toBe(true);
        });

        it('should return empty array when no orders match filter', async () => {
            const result = await orderService.getOrders({
                page: 1,
                limit: 10,
                state: 'COMPLETED'
            }, userId);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should use default pagination values', async () => {
            const result = await orderService.getOrders({
                page: 0,
                limit: 0
            }, userId);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.data).toHaveLength(10);
        });
    });
});