import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    // 1. Assert the DLX exchange and working queue WITH the dead letter arguments
  await channel.assertQueue('email-dlx', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx-exchange',
      'x-dead-letter-routing-key': 'dlx-key'
    }
  });
  // 2. Bind working queue to your orders exchange
  await channel.bindQueue('email-dlx', 'orders', 'order.created');
  // 3. In the consume callback:
  channel.consume('email-dlx', (msg) => {
    if (!msg) return;
    // Read retry count from headers (hint: msg.properties.headers)
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
    console.log(`[Consumer] Received message (attempt ${retryCount + 1}/4): ${msg.content.toString()}`);
    const failed = Math.random() < 0.9;
    if (failed) {
      if (retryCount < 3) {
        console.log(`[Consumer] Failed — retrying (attempt ${retryCount + 1}/3)...`);
        channel.publish('orders', 'order.created', msg.content, { headers: { 'x-retry-count': retryCount + 1 } });
        channel.ack(msg);
      } else {
        console.log(`[Consumer] Failed — exhausted all retries. Sending to dead letter queue.`);
        channel.nack(msg, false, false);
      }
    } else {
      console.log(`[Consumer] Success! Message processed.`);
      channel.ack(msg);
    }
  });
  console.log('Waiting for messages...')
}

main().catch(console.error)