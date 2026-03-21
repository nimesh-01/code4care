const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { connect } = require('./broker/broker')
const setListeners = require('./broker/listeners')
const connectDb = require('./db/db')
const notificationRoutes = require('./routes/notification.routes')

const app = express()

// Connect to MongoDB and RabbitMQ
connectDb().then(() => {
    connect().then(() => {
        setListeners()
    })
}).catch(err => {
    console.error('Failed to connect to DB:', err)
})

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
}
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Notification service is running' })
})

// Notification REST API routes
app.use('/api/notifications', notificationRoutes)

module.exports = app