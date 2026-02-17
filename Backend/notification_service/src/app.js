const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { connect, subscribeToQueue } = require('./broker/broker')
const setListeners = require('./broker/listeners')
const app = express()
connect().then(() => {
    setListeners()
})

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3000']
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true)
        return callback(new Error('CORS policy: This origin is not allowed'))
    },
    credentials: true,
}
app.use(cors(corsOptions))

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Notification service is running' })
})
app.use(express.json())
module.exports = app