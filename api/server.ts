import 'dotenv/config';
import express from 'express';
import ordersRouter from './routes/orders';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { orderQueue } from './queues/orderQueue';
import { emailQueue } from '../shared/queues/emailQueue';
import { pdfQueue } from '../shared/queues/pdfQueue';
import { analyticsQueue } from '../shared/queues/analyticsQueue';
import { warehouseQueue } from '../shared/queues/warehouseQueue';
import { deadLetterQueue } from '../shared/queues/deadLetterQueue';

const app = express();

app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [
    new BullMQAdapter(orderQueue),
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(pdfQueue),
    new BullMQAdapter(analyticsQueue),
    new BullMQAdapter(warehouseQueue),
    new BullMQAdapter(deadLetterQueue),
  ],
  serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/orders', ordersRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});