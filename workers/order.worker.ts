import { Worker, Job } from 'bullmq';

const connection = {
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  'order-processing',
  async (job: Job) => {
    console.log(`Processing order: ${job.data.orderId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`Order ${job.data.orderId} processed`);
  },
  { connection }
);

worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
