import amqp from 'amqplib';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'analytics';

  await channel.assertExchange('orders', 'direct', { durable: false });
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, 'orders', 'order.created');

  console.log('[Analytics] Waiting for messages...');

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[Analytics] Updating metrics for order: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

main().catch(console.error);
