const amqplib = require('amqplib')

let channel, connection

async function connect() {
    if (connection) return connection

    if (!process.env.RABBIT_URL) {
        throw new Error('RABBIT_URL env variable is missing')
    }

    try {
        connection = await amqplib.connect(process.env.RABBIT_URL)
        console.log('Connected to RabbitMQ')
        channel = await connection.createChannel()
        return connection
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error)
        throw error
    }
}

async function publishToQueue(queueName, data = {}) {
    if (!channel || !connection) await connect()

    await channel.assertQueue(queueName, {
        durable: true
    })

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)))

    console.log("Message sent to queue:", queueName)
}

module.exports = { connect, publishToQueue }
