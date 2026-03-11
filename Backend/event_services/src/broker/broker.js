const amqplib = require('amqplib')

let channel, connection

async function connect() {
    if (connection) return connection

    try {
        connection = await amqplib.connect(process.env.RABBIT_URL)
        console.log("Connected to RabbitMQ")
        channel = await connection.createChannel()
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error)
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
