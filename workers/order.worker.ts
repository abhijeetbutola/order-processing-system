import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../shared/queues/emailQueue';
import { pdfQueue } from '../shared/queues/pdfQueue';
import { analyticsQueue } from '../shared/queues/analyticsQueue';
import { warehouseQueue } from '../shared/queues/warehouseQueue';

const prisma = new PrismaClient();

const connection = {
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  'order-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'process-order':
        console.log(`Orchestrating order: ${orderId}`);
        await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING' } });
        await job.updateProgress(10);
        await Promise.all([
          emailQueue.add('send-confirmation', { orderId }),
          pdfQueue.add('generate-invoice', { orderId }),
          analyticsQueue.add('update-analytics', { orderId }),
          warehouseQueue.add('notify-warehouse', { orderId }),
        ]);
        await job.updateProgress(80);
        await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } });
        await job.updateProgress(100);
        console.log(`Order ${orderId} orchestrated`);
        break;

      case 'payment-reminder':
        console.log(`[Reminder] Sending payment reminder for order ${orderId}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log(`[Reminder] Payment reminder sent for order ${orderId}`);
        break;

      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', async (job: Job | undefined, err: Error) => {
  // only update DB on the final failure
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(`Job ${job.id} permanently failed:`, err.message);
    await prisma.order.update({
      where: { id: job.data.orderId },
      data: { status: 'FAILED' },
    });
  } else {
    console.warn(`Job ${job?.id} failed attempt ${job?.attemptsMade}, retrying...`);
  }
});
