import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    const message = 'Hello from the topic publisher!'
    await channel.assertExchange('orders-topic', 'topic', { durable: true })
    channel.publish('orders-topic', 'order.created', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.updated', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.deleted', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.paid', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.shipped', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.delivered', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.cancelled', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.refunded', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'order.failed', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'payment.failed', Buffer.from(message), { persistent: true })
    channel.publish('orders-topic', 'email.failed', Buffer.from(message), { persistent: true })
    console.log(`[x] Sent messages with order.* and *.failed routing keys`)
    await channel.close()
    await connection.close()
}

main().catch(console.error)