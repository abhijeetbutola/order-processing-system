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
    console.log(`Processing order: ${job.data.orderId}`);
    await prisma.order.update({
      where: { id: job.data.orderId },
      data: { status: 'PROCESSING' },
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await prisma.order.update({
      where: { id: job.data.orderId },
      data: { status: 'COMPLETED' },
    });
    console.log(`Order ${job.data.orderId} processed`);
  },
  { connection }
);

worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', async (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err.message);
  await prisma.order.update({
    where: { id: job?.data.orderId },
    data: { status: 'FAILED' },
  });
});
