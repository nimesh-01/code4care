const express = require('express')
const cors = require('cors')
require('dotenv').config()
const authroutes = require('./routes/auth.routes')
const superadminRoutes = require('./routes/superadmin.routes')
const cookieParser = require('cookie-parser')
const app = express()

// CORS configuration
const allowedOrigins = (() => {
    if (process.env.CORS_ALLOWED_ORIGINS === '*') return '*'
    if (process.env.CORS_ALLOWED_ORIGINS) {
        return process.env.CORS_ALLOWED_ORIGINS.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean)
    }
    return [process.env.FRONTEND_URL?.trim() || 'http://localhost:5173']
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
    optionsSuccessStatus: 204,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Auth service is running' })
})
app.use('/auth', authroutes)
app.use('/superadmin', superadminRoutes)
module.exports = app