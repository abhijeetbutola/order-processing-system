import { Queue } from 'bullmq';
import { connection } from './connection';

export const analyticsQueue = new Queue('analytics-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
