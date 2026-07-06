import { Queue } from 'bullmq';
import { connection } from './connection';

export const pdfQueue = new Queue('pdf-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
