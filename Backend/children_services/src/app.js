const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");

// connect to DB (side-effect)
require('./db/mongoose');

const childrenRouter = require('./routes/children.routes');

const app = express();

// CORS configuration - must allow credentials for cookies
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS policy: This origin is not allowed'));
    },
    credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'children_services' }));

app.use('/api', childrenRouter);

module.exports = app;
