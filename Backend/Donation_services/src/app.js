const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const donationRoutes = require('./routes/donation.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Middleware
const allowedOrigins = (() => {
    if (process.env.CORS_ALLOWED_ORIGINS === '*') return '*';
    if (process.env.CORS_ALLOWED_ORIGINS) {
        return process.env.CORS_ALLOWED_ORIGINS.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
    const fallbacks = [process.env.CLIENT_URL, process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'];
    return [...new Set(fallbacks.filter(Boolean).map((origin) => origin.trim()))];
})();

const corsOptions = {
    origin: allowedOrigins === '*'
        ? true
        : (origin, callback) => {
              if (!origin) return callback(null, true);
              if (allowedOrigins.includes(origin)) return callback(null, true);
              return callback(new Error(`Not allowed by CORS: ${origin}`));
          },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '💰 Donation & Payment Service is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/donation', donationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
