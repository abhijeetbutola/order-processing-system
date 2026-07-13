import { Queue } from 'bullmq';
import { connection } from '@shared/queues/connection';

export const orderQueue = new Queue('order-processing', { connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
 });
