import { Queue } from 'bullmq';
import { connection } from './connection';

export const deadLetterQueue = new Queue('dead-letter', {
    connection,
})