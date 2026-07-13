import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    channel.publish('orders', 'order.created', Buffer.from('Hello from the DLX publisher!'))
    console.log('Message sent to DLX')
    await channel.close()
    await connection.close()
}

main().catch(console.error)