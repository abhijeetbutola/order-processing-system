import { Queue } from 'bullmq';
import { connection } from './connection';

export const warehouseQueue = new Queue('warehouse-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
