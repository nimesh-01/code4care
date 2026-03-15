require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db')
const { connect: connectBroker } = require('./src/broker/broker')
const setListeners = require('./src/broker/listeners')

const PORT = process.env.PORT || 3005

async function start() {
    try {
        await connectDb()
        await connectBroker()
        await setListeners()

        app.listen(PORT, () => {
            console.log(`Notification service is running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Failed to initialize Notification Service', error)
        process.exit(1)
    }
}

start()