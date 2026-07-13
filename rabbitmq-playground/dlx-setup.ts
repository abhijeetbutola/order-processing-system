import amqp from 'amqplib';

async function main() {
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()
    await channel.assertExchange('dlx-exchange', 'direct', { durable: true })
    await channel.assertQueue('dlx-queue', { durable: true })
    await channel.bindQueue('dlx-queue', 'dlx-exchange', 'dlx-key')
    console.log('DLX setup complete')
}

main().catch(console.error)