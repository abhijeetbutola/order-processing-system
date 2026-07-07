import amqp from 'amqplib';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'email';

  await channel.assertExchange('orders', 'direct', { durable: false });
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, 'orders', 'order.created');

  console.log('[Email] Waiting for messages...');

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[Email] Sending confirmation for order: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

main().catch(console.error);
