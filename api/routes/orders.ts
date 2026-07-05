import { Router } from 'express';
import prisma from '../db';
import { orderQueue } from '../queues/orderQueue';

const router = Router();

router.post("/", async (req, res) => {
    const { customerId, items, priority } = req.body
    // calculate total
    const total = items.reduce((sum: number, item: { price: number, quantity: number }) => sum + item.price * item.quantity, 0)
    // save to DB
    const order = await prisma.order.create({
        data: { customerId, items, total }
    })
    // enqueue job
    await orderQueue.add('process-order', { orderId: order.id }, {priority})
    await orderQueue.add('payment-reminder', { orderId: order.id }, {delay: 10000})
    res.status(202).json({ orderId: order.id, status: order.status })
})

export default router;