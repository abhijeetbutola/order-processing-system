import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

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
        console.log(`Processing order: ${orderId}`);
        await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING' } });
        await job.updateProgress(10);
        await Promise.all([
          sendConfirmationEmail(orderId),
          generateInvoice(orderId),
          updateAnalytics(orderId),
          notifyWarehouse(orderId),
        ]);
        await job.updateProgress(80);
        await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } });
        await job.updateProgress(100);
        console.log(`Order ${orderId} completed`);
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

async function sendConfirmationEmail(orderId: string) {
  if (Math.random() < 0.3) {
    throw new Error('Email service unavailable');
  }
  console.log(`[Email] Sending confirmation for order ${orderId}...`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`[Email] Confirmation sent for order ${orderId}`);
}
async function generateInvoice(orderId: string) {
  console.log(`[Invoice] Generating invoice for order ${orderId}...`);
  await new Promise((resolve) => setTimeout(resolve, 5800));
  console.log(`[Invoice] Invoice generated for order ${orderId}`);
}
async function updateAnalytics(orderId: string) {
  console.log(`[Analytics] Updating analytics for order ${orderId}...`);
  await new Promise((resolve) => setTimeout(resolve, 2300));
  console.log(`[Analytics] Analytics updated for order ${orderId}`);
}
async function notifyWarehouse(orderId: string) {
  console.log(`[Warehouse] Notifying warehouse for order ${orderId}...`);
  await new Promise((resolve) => setTimeout(resolve, 2600));
  console.log(`[Warehouse] Warehouse notified for order ${orderId}`);
}