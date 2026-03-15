const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const notificationRoutes = require('./routes/notification.routes')

const app = express()

const allowedOrigins = (() => {
    if (process.env.CORS_ALLOWED_ORIGINS === '*') return '*'
    if (process.env.CORS_ALLOWED_ORIGINS) {
        return process.env.CORS_ALLOWED_ORIGINS.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean)
    }
    const fallbacks = [process.env.FRONTEND_URL, process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
    return [...new Set(fallbacks.filter(Boolean).map((origin) => origin.trim()))]
})()

const corsOptions = {
    origin:
        allowedOrigins === '*'
            ? true
            : (origin, callback) => {
                  if (!origin) return callback(null, true)
                  if (allowedOrigins.includes(origin)) return callback(null, true)
                  return callback(new Error('CORS policy: This origin is not allowed'))
              },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
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