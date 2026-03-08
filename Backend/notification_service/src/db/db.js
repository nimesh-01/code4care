const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Notification Service DB connected successfully')
    } catch (err) {
        console.error('DB connection failed:', err)
        throw err
    }
}

module.exports = connectDb
