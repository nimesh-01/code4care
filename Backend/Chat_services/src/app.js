const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// CORS configuration
const allowedOrigins = (() => {
    if (process.env.CORS_ALLOWED_ORIGINS === '*') return '*';
    if (process.env.CORS_ALLOWED_ORIGINS) {
        return process.env.CORS_ALLOWED_ORIGINS.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
    const fallbacks = [process.env.FRONTEND_URL, process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];
    return [...new Set(fallbacks.filter(Boolean).map((origin) => origin.trim()))];
})();

const corsOptions = {
    origin: allowedOrigins === '*'
        ? true
        : (origin, callback) => {
              if (!origin) return callback(null, true);
              if (allowedOrigins.includes(origin)) return callback(null, true);
              return callback(new Error('CORS policy: This origin is not allowed'));
          },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Rate limiting to prevent spam
const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Chat Service is running',
        timestamp: new Date().toISOString()
    });
});

// Apply rate limiting to chat routes
app.use('/chat', chatLimiter, chatRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

module.exports = app;
