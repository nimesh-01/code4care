require('dotenv').config()
const app = require('./src/app')
const { connect } = require('./src/broker/broker')
const connectDb = require('./src/db/db')

const PORT = process.env.PORT || 3000

async function start() {
    try {
        await Promise.all([connectDb(), connect()])
        app.listen(PORT, () => {
            console.log(`Auth service is running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Failed to initialize auth service', error)
        process.exit(1)
    }
}

start()