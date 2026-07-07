import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    const message = 'Hello from the publisher!'
    // await channel.assertQueue(queue, { durable: false })
    await channel.assertExchange('orders', 'direct', { durable: false })
    // channel.sendToQueue(queue, Buffer.from(message))
    channel.publish('orders', 'order.created', Buffer.from(message))
    console.log(`[x] Sent ${message}`)
    await channel.close()
    await connection.close()
}

main().catch(console.error)