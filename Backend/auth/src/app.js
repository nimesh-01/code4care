const express = require('express')
const cors = require('cors')
require('dotenv').config()
const authroutes = require('./routes/auth.routes')
const cookieParser = require('cookie-parser')
const app = express()

// CORS configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:5173']
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true)
        return callback(new Error('CORS policy: This origin is not allowed'))
    },
    credentials: true,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Auth service is running' })
})
app.use('/auth', authroutes)
module.exports = app