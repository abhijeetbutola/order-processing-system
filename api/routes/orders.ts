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
    const processJob = await orderQueue.add('process-order', { orderId: order.id }, { priority })
    res.status(202).json({ orderId: order.id, jobId: processJob.id, status: order.status })
})

router.get("/job/:jobId/progress", async (req, res) => {
    const job = await orderQueue.getJob(req.params.jobId);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ jobId: req.params.jobId, progress: job.progress });
})

export default router;