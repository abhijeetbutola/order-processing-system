import amqp from 'amqplib';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'pdf';

  await channel.assertExchange('orders', 'direct', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, 'orders', 'order.created');

  console.log('[PDF] Waiting for messages...');

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[PDF] Generating invoice for order: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

main().catch(console.error);
