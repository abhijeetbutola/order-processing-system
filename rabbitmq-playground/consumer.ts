import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    const queue = "order-processing"
    // await channel.assertQueue(queue, { durable: true })
    await channel.assertExchange('orders', 'direct', { durable: true })
    await channel.assertQueue(queue, { durable: true })
    await channel.bindQueue(queue, 'orders', 'order.created')
    console.log('[*] Waiting for messages...')
    channel.consume(queue, (msg) => {
        if (msg) {
            console.log(`[x] Received: ${msg.content.toString()}`)
            channel.ack(msg)
        }
    })
}

main().catch(console.error)