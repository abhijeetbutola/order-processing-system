import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '../shared/queues/connection';
import { deadLetterQueue } from '../shared/queues/deadLetterQueue';

const prisma = new PrismaClient();

const worker = new Worker(
  'email-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'send-confirmation':
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { emailSentAt: true },
        });
        if (order?.emailSentAt) {
          console.log(`[Email] Already sent for order ${orderId}, skipping...`);
          return;
        }
        if (Math.random() < 0.3) throw new Error('Email service unavailable');
        console.log(`[Email] Sending confirmation for order ${orderId}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await prisma.order.update({ where: { id: orderId }, data: { emailSentAt: new Date() } });
        console.log(`[Email] Confirmation sent for order ${orderId}`);
        break;

      default:
        console.warn(`[Email] Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => console.log(`[Email] Job ${job.id} completed`));
worker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(`[Email] Job ${job.id} permanently failed, moving to dead letter queue`)
    await deadLetterQueue.add('dead-letter', {
      originalQueue: 'email-processing',
      jobName: job.name,
      jobData: job.data,
      failedReason: err.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    })
  }
});
