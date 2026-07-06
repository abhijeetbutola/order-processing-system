import { Queue } from 'bullmq';
import { connection } from './connection';

export const notificationQueue = new Queue('notification-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
