import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    const queue = "hello"
    await channel.assertQueue(queue, { durable: false })
    console.log('[*] Waiting for messages...')
    channel.consume(queue, (msg) => {
        if (msg) {
            console.log(`[x] Received: ${msg.content.toString()}`)
            channel.ack(msg)
        }
    })
}

main().catch(console.error)