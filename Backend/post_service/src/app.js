const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const postRoutes = require('./routes/postRoutes')

const app = express()

// Trust proxy for Render/production
app.set('trust proxy', 1)

// CORS configuration
const allowedOrigins = [
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
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'post_service' }))

app.use('/post', postRoutes)

module.exports = app
