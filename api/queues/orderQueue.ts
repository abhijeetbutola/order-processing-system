import { Queue } from 'bullmq';

export const connection = {
  maxRetriesPerRequest: null,
};

export const orderQueue = new Queue('order-processing', { connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
 });
