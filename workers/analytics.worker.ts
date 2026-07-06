import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '@shared/queues/connection';
import { checkOrderCompletion } from '@shared/utils/checkOrderCompletion';

const prisma = new PrismaClient();

const worker = new Worker(
  'analytics-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'update-analytics':
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { analyticsUpdatedAt: true },
        });
        if (order?.analyticsUpdatedAt) {
          console.log(`[Analytics] Already updated for order ${orderId}, skipping...`);
          return;
        }
        console.log(`[Analytics] Updating analytics for order ${orderId}...`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        await prisma.order.update({ where: { id: orderId }, data: { analyticsUpdatedAt: new Date() } });
        console.log(`[Analytics] Analytics updated for order ${orderId}`);
        await checkOrderCompletion(prisma, orderId, 'Analytics');
        break;

      default:
        console.warn(`[Analytics] Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => console.log(`[Analytics] Job ${job.id} completed`));
worker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(`[Analytics] Job ${job.id} permanently failed:`, err.message);
    await prisma.order.update({ where: { id: job.data.orderId }, data: { status: 'FAILED' } });
  }
});

