import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '@shared/queues/connection';
import { checkOrderCompletion } from '@shared/utils/checkOrderCompletion';

const prisma = new PrismaClient();

const worker = new Worker(
  'pdf-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'generate-invoice':
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { invoiceGeneratedAt: true },
        });
        if (order?.invoiceGeneratedAt) {
          console.log(`[PDF] Invoice already generated for order ${orderId}, skipping...`);
          return;
        }
        console.log(`[PDF] Generating invoice for order ${orderId}...`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        await prisma.order.update({ where: { id: orderId }, data: { invoiceGeneratedAt: new Date() } });
        console.log(`[PDF] Invoice generated for order ${orderId}`);
        await checkOrderCompletion(prisma, orderId, 'PDF');
        break;

      default:
        console.warn(`[PDF] Unknown job name: ${job.name}`);
    }
  },
  { connection,
    concurrency: 10,
   }
);

worker.on('completed', (job: Job) => console.log(`[PDF] Job ${job.id} completed`));
worker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(`[PDF] Job ${job.id} permanently failed:`, err.message);
    await prisma.order.update({ where: { id: job.data.orderId }, data: { status: 'FAILED' } });
  }
});

