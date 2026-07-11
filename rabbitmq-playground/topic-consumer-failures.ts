import amqp from 'amqplib';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'failures-queue';

  await channel.assertExchange('orders-topic', 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, 'orders-topic', '#.failed');

  console.log('[Failures] Waiting for failure events...');

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[Failures] Caught failure — routing key: ${msg.fields.routingKey}, message: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

main().catch(console.error);
