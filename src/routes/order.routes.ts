import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.patch('/:id/advance', OrderController.advanceOrder);

export default router;