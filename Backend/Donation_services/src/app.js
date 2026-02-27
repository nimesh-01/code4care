const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const donationRoutes = require('./routes/donation.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])
    .map((url) => url.trim())
    .filter(Boolean)
    .concat(['http://localhost:3000', 'http://localhost:5173'])

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true
}));
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
