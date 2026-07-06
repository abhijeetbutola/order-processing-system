import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { connection } from '@shared/queues/connection';

const worker = new Worker(
  'notification-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'payment-reminder':
        console.log(`[Notification] Sending payment reminder for order ${orderId}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log(`[Notification] Payment reminder sent for order ${orderId}`);
        break;

      default:
        console.warn(`[Notification] Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => console.log(`[Notification] Job ${job.id} completed`));
worker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Notification] Job ${job?.id} failed:`, err.message);
});
