import { Queue } from 'bullmq';
import { connection } from './connection';

export const emailQueue = new Queue('email-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
