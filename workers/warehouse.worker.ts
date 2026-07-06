import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '../shared/queues/connection';

const prisma = new PrismaClient();

const worker = new Worker(
  'warehouse-processing',
  async (job: Job) => {
    const { orderId } = job.data;

    switch (job.name) {
      case 'notify-warehouse':
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { warehouseNotifiedAt: true },
        });
        if (order?.warehouseNotifiedAt) {
          console.log(`[Warehouse] Already notified for order ${orderId}, skipping...`);
          return;
        }
        console.log(`[Warehouse] Notifying warehouse for order ${orderId}...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        await prisma.order.update({ where: { id: orderId }, data: { warehouseNotifiedAt: new Date() } });
        console.log(`[Warehouse] Warehouse notified for order ${orderId}`);
        break;

      default:
        console.warn(`[Warehouse] Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

worker.on('completed', (job: Job) => console.log(`[Warehouse] Job ${job.id} completed`));
worker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Warehouse] Job ${job?.id} failed:`, err.message);
});
